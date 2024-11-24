import { expect, it } from "bun:test"
import { jscadPlanner } from "../lib/jscad-planner"

it("should be able to hull shapes", () => {
  const shape1 = jscadPlanner.primitives.cube({ size: 2, center: [10, 0, 0] })
  const shape2 = jscadPlanner.primitives.cube({ size: 10, center: [0, 0, 0] })
  const translatedShape = jscadPlanner.booleans.hull( shape1, shape2)
  expect(translatedShape).toEqual({
    type: "hull",
    ["shapes"]: [shape1, shape2],
  })
})
