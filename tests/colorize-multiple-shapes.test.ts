import { expect, test } from "bun:test"
import jscad from "@jscad/modeling"
import {
  type JscadOperation,
  executeJscadOperations,
  jscadPlanner as planner,
} from "../lib"
import { executeModelingPlan } from "./fixtures/execute-modeling-plan"

const roundTrip = (operation: JscadOperation): JscadOperation =>
  JSON.parse(JSON.stringify(operation))

const cube = (x: number) =>
  planner.primitives.cube({ size: 2, center: [x, 0, 0] })

test("colorizing multiple shapes preserves each solid through JSON", () => {
  const plan = planner.colors.colorize([1, 0, 0], cube(0), cube(10), cube(20))
  const result = executeModelingPlan(roundTrip(plan))
  const expected = jscad.colors.colorize(
    [1, 0, 0],
    ...[0, 10, 20].map((x) =>
      jscad.primitives.cube({ size: 2, center: [x, 0, 0] }),
    ),
  )

  expect(Array.isArray(result)).toBe(true)
  expect(result).toEqual(expected)
})

test("multiple overlapping shapes remain separate instead of being unioned", () => {
  const result = executeModelingPlan(
    roundTrip(planner.colors.colorize([0, 1, 0], cube(0), cube(1))),
  )
  const expected = jscad.colors.colorize(
    [0, 1, 0],
    jscad.primitives.cube({ size: 2 }),
    jscad.primitives.cube({ size: 2, center: [1, 0, 0] }),
  )

  expect(result).toEqual(expected)
})

test("colorized groups compose with nested transforms and unions", () => {
  const plan = planner.booleans.union(
    planner.transforms.translate(
      [0, 3, 0],
      planner.colors.colorize([0, 0, 1], cube(0), cube(10)),
    ),
    cube(20),
  )
  const expected = jscad.booleans.union(
    jscad.transforms.translate(
      [0, 3, 0],
      jscad.colors.colorize(
        [0, 0, 1],
        jscad.primitives.cube({ size: 2 }),
        jscad.primitives.cube({ size: 2, center: [10, 0, 0] }),
      ),
    ),
    jscad.primitives.cube({ size: 2, center: [20, 0, 0] }),
  )

  expect(executeModelingPlan(roundTrip(plan))).toEqual(expected)
})

test("colorizing mixed 2D and 3D shapes matches the native result", () => {
  const points: [number, number][] = [
    [0, 0],
    [2, 0],
    [0, 2],
  ]
  const plan = planner.colors.colorize(
    [1, 0, 1],
    planner.geometries.geom2.fromPoints(points),
    cube(10),
  )
  const expected = jscad.colors.colorize(
    [1, 0, 1],
    jscad.geometries.geom2.fromPoints(points),
    jscad.primitives.cube({ size: 2, center: [10, 0, 0] }),
  )

  expect(executeModelingPlan(roundTrip(plan))).toEqual(expected)
})

test("executing a colored group against the planner preserves the plan", () => {
  const plan = planner.colors.colorize([1, 0, 0], cube(0), cube(10))
  const original = roundTrip(plan)

  expect(executeJscadOperations(planner, roundTrip(plan))).toEqual(original)
  expect(plan).toEqual(original)
})

test("single-shape color plans retain their existing serialization", () => {
  const shape = cube(0)
  const plan = planner.colors.colorize([1, 0, 0], shape)

  expect(plan).toEqual({ type: "colorize", color: [1, 0, 0], shape })
  expect(executeModelingPlan(roundTrip(plan))).toEqual(
    jscad.colors.colorize(
      [1, 0, 0],
      jscad.primitives.cube({ size: 2, center: [0, 0, 0] }),
    ),
  )
})
