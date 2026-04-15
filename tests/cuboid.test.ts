import { expect, it, describe } from "bun:test"
import { jscadPlanner } from "../lib/jscad-planner.ts"
import { executeJscadOperations } from "../lib/execute-jscad-operations.ts"

describe("cuboid", () => {
  it("should be able to create a cuboid operation", () => {
    const cuboidOp = jscadPlanner.primitives.cuboid({
      size: [10, 20, 5],
    })

    expect(cuboidOp).toEqual({
      type: "cuboid",
      size: [10, 20, 5],
    })

    const executedOp = executeJscadOperations(jscadPlanner, cuboidOp)
    expect(executedOp).toEqual(cuboidOp)
  })

  it("should be able to create a cuboid with center", () => {
    const cuboidOp = jscadPlanner.primitives.cuboid({
      size: [10, 20, 5],
      center: [1, 2, 3],
    })

    expect(cuboidOp).toEqual({
      type: "cuboid",
      size: [10, 20, 5],
      center: [1, 2, 3],
    })

    const executedOp = executeJscadOperations(jscadPlanner, cuboidOp)
    expect(executedOp).toEqual(cuboidOp)
  })

  it("should be able to use cuboid in boolean operations", () => {
    const result = jscadPlanner.booleans.subtract(
      jscadPlanner.primitives.cuboid({ size: [10, 10, 10] }),
      jscadPlanner.primitives.sphere({ radius: 5 }),
    )

    expect(result).toEqual({
      type: "subtract",
      shapes: [
        { type: "cuboid", size: [10, 10, 10] },
        { type: "sphere", radius: 5 },
      ],
    })
  })
})
