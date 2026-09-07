import { expect, it } from "bun:test"
import assert from "node:assert/strict"
import jscad from "@jscad/modeling"
import { jscadPlanner } from "../lib"
import { executeModelingPlan } from "./fixtures/execute-modeling-plan"

it("transforms a geom2 using a column-major matrix", () => {
  const { mat4 } = jscad.maths
  const matrix = mat4.multiply(
    mat4.create(),
    mat4.fromTranslation(mat4.create(), [7, -5, 0]),
    mat4.fromZRotation(mat4.create(), Math.PI / 2),
  )
  const points: [number, number][] = [
    [0, 0],
    [4, 0],
    [4, 2],
    [0, 2],
  ]
  const plan = jscadPlanner.transforms.transform(
    matrix,
    jscadPlanner.geometries.geom2.fromPoints(points),
  )
  const actual = executeModelingPlan(plan)
  assert(jscad.geometries.geom2.isA(actual))
  const expected = jscad.transforms.translate(
    [7, -5, 0],
    jscad.transforms.rotateZ(
      Math.PI / 2,
      jscad.geometries.geom2.fromPoints(points),
    ),
  )

  expect(jscad.geometries.geom2.toPoints(actual)).toEqual(
    jscad.geometries.geom2.toPoints(expected),
  )
  expect(jscad.measurements.measureBoundingBox(actual)).toEqual([
    [5, -5, 0],
    [7, -1, 0],
  ])
  expect(jscad.measurements.measureArea(actual)).toBeCloseTo(8)
})
