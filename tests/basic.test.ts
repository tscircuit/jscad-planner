import { describe, expect, it } from "bun:test"
import { executeJscadOperations } from "../lib/execute-jscad-operations.ts"
import { jscadPlanner } from "../lib/jscad-planner.ts"

describe("jscad-planner", () => {
  it("should be able to create operations, then execute the operations against the jscad planner", () => {
    const operations1 = jscadPlanner.booleans.intersect(
      jscadPlanner.primitives.cube({ size: 10, center: [10, 0, 0] }),
      jscadPlanner.primitives.sphere({ radius: 10, center: [0, 0, 0] }),
    )

    expect(operations1).toEqual({
      type: "intersect",
      shapes: [
        {
          type: "cube",
          size: 10,
          center: [10, 0, 0],
        },
        {
          type: "sphere",
          radius: 10,
          center: [0, 0, 0],
        },
      ],
    })

    const operations2 = executeJscadOperations(jscadPlanner, operations1)

    expect(operations1).toEqual(operations2)
  })

  it("should be able to create a rounded cuboid operation", () => {
    const roundedCuboidOp = jscadPlanner.primitives.roundedCuboid({
      size: [10, 20, 10],
      roundRadius: 2,
      segments: 16,
    })

    expect(roundedCuboidOp).toEqual({
      type: "roundedCuboid",
      size: [10, 20, 10],
      roundRadius: 2,
      segments: 16,
    })

    const executedOp = executeJscadOperations(jscadPlanner, roundedCuboidOp)
    expect(executedOp).toEqual(roundedCuboidOp)
  })
})
