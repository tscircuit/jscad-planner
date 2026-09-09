import { expect, it } from "bun:test"
import assert from "node:assert/strict"
import jscad from "@jscad/modeling"
import { jscadPlanner } from "../lib"
import { executeModelingPlan } from "./fixtures/execute-modeling-plan"

it("transforms a solid with off-axis rotation before translation", () => {
  const { mat4 } = jscad.maths
  const angle = Math.PI / 3
  const axis: [number, number, number] = [1, 2, 3]
  const offset: [number, number, number] = [7, -5, 11]
  const rotation = mat4.fromRotation(mat4.create(), angle, axis)
  const translation = mat4.fromTranslation(mat4.create(), offset)
  const matrix = mat4.multiply(mat4.create(), translation, rotation)
  const shape = jscadPlanner.primitives.cuboid({ size: [2, 4, 6] })
  const plan = jscadPlanner.transforms.transform(matrix, shape)

  expect(plan).toEqual({ type: "transform", matrix, shape })
  const actual = executeModelingPlan(plan)
  assert(jscad.geometries.geom3.isA(actual))
  const solid = jscad.primitives.cuboid({ size: [2, 4, 6] })
  const expected = jscad.transforms.translate(
    offset,
    jscad.transforms.transform(rotation, solid),
  )
  expect(jscad.geometries.geom3.toPolygons(actual)).toEqual(
    jscad.geometries.geom3.toPolygons(expected),
  )
  expect(jscad.measurements.measureVolume(actual)).toBeCloseTo(48)

  const reversed = executeModelingPlan(
    jscadPlanner.transforms.transform(
      mat4.multiply(mat4.create(), rotation, translation),
      shape,
    ),
  )
  assert(jscad.geometries.geom3.isA(reversed))
  expect(jscad.measurements.measureBoundingBox(actual)).not.toEqual(
    jscad.measurements.measureBoundingBox(reversed),
  )
})
