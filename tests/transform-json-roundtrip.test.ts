import { expect, it } from "bun:test"
import assert from "node:assert/strict"
import jscad from "@jscad/modeling"
import { executeJscadOperations, jscadPlanner } from "../lib"
import { executeModelingPlan } from "./fixtures/execute-modeling-plan"

it("round-trips nested matrix and legacy transforms through JSON", () => {
  const { mat4 } = jscad.maths
  const shape = jscadPlanner.primitives.cuboid({ size: [2, 4, 6] })
  const innerMatrix = mat4.fromRotation(mat4.create(), Math.PI / 4, [2, -1, 3])
  const outerMatrix = mat4.fromTranslation(mat4.create(), [7, -5, 11])
  const plan = jscadPlanner.transforms.transform(
    outerMatrix,
    jscadPlanner.transforms.rotate(
      [Math.PI / 6, 0, 0],
      jscadPlanner.transforms.translate(
        [1, 2, 3],
        jscadPlanner.transforms.transform(innerMatrix, shape),
      ),
    ),
  )
  const restored = JSON.parse(JSON.stringify(plan))

  expect(restored).toEqual(plan)
  expect(executeJscadOperations(jscadPlanner, restored)).toEqual(plan)

  const actual = executeModelingPlan(restored)
  assert(jscad.geometries.geom3.isA(actual))
  const expected = jscad.transforms.transform(
    outerMatrix,
    jscad.transforms.rotate(
      [Math.PI / 6, 0, 0],
      jscad.transforms.translate(
        [1, 2, 3],
        jscad.transforms.transform(
          innerMatrix,
          jscad.primitives.cuboid({ size: [2, 4, 6] }),
        ),
      ),
    ),
  )
  expect(jscad.geometries.geom3.toPolygons(actual)).toEqual(
    jscad.geometries.geom3.toPolygons(expected),
  )
})
