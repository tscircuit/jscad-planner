import { expect, it } from "bun:test"
import assert from "node:assert/strict"
import jscad from "@jscad/modeling"
import {
  jscadPlanner,
  type CreateGeom3Operation,
  type JscadPolygon3,
} from "../lib"
import { executeModelingPlan } from "./fixtures/execute-modeling-plan"

it("transforms native JSCAD polygons after a JSON roundtrip without casts", () => {
  const solid = jscad.primitives.cuboid({ size: [2, 4, 6] })
  const polygons: JscadPolygon3[] = jscad.geometries.geom3.toPolygons(solid)
  polygons[0].color = [1, 0, 0, 0.5]
  polygons[0].plane = jscad.geometries.poly3.plane(polygons[0])
  const shape: CreateGeom3Operation = { type: "createGeom3", polygons }
  expect(jscadPlanner.geometries.geom3.create(polygons)).toEqual(shape)

  const matrix = jscad.maths.mat4.fromTranslation(
    jscad.maths.mat4.create(),
    [7, -5, 11],
  )
  const plan = jscadPlanner.transforms.transform(matrix, shape)
  const restored = JSON.parse(JSON.stringify(plan))
  expect(restored).toEqual(plan)
  const actual = executeModelingPlan(restored)
  assert(jscad.geometries.geom3.isA(actual))

  expect(jscad.geometries.geom3.toPolygons(actual)).toEqual(
    jscad.geometries.geom3.toPolygons(
      jscad.transforms.transform(matrix, solid),
    ),
  )
  expect(jscad.measurements.measureVolume(actual)).toBeCloseTo(48)
})
