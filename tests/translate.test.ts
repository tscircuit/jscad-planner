import { expect, it } from "bun:test"
import { jscadPlanner } from "../lib/jscad-planner"

it("should be able to translate a shape", () => {
  const shape = jscadPlanner.primitives.cube({ size: 10, center: [10, 0, 0] })
  const translatedShape = jscadPlanner.transforms.translate([10, 0, 0], shape)
  expect(translatedShape).toEqual({
    type: "translate",
    vector: [10, 0, 0],
    shape,
  })
})
