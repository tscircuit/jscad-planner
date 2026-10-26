import { describe, expect, it } from "bun:test"
import { executeJscadOperations } from "../lib/execute-jscad-operations.ts"
import { jscadPlanner } from "../lib/jscad-planner.ts"

describe("cuboid operations", () => {
  it("should be able to create a cuboid operation", () => {
    const cuboidOp = jscadPlanner.primitives.cuboid({
      size: [10, 20, 30],
    })

    expect(cuboidOp).toEqual({
      type: "cuboid",
      size: [10, 20, 30],
    })

    const executedOp = executeJscadOperations(jscadPlanner, cuboidOp)
    expect(executedOp).toEqual(cuboidOp)
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

  it("should be able to use cuboid in boolean operations", () => {
    const unionOp = jscadPlanner.booleans.union(
      jscadPlanner.primitives.cuboid({ size: [10, 10, 10] }),
      jscadPlanner.primitives.cuboid({ size: [5, 5, 5] }),
    )

    expect(unionOp).toEqual({
      type: "union",
      shapes: [
        {
          type: "cuboid",
          size: [10, 10, 10],
        },
        {
          type: "cuboid",
          size: [5, 5, 5],
        },
      ],
    })

    const executedOp = executeJscadOperations(jscadPlanner, unionOp)
    expect(executedOp).toEqual(unionOp)
  })

  it("should be able to transform cuboid operations", () => {
    const translatedCuboid = jscadPlanner.transforms.translate(
      [10, 20, 30],
      jscadPlanner.primitives.cuboid({ size: [5, 5, 5] }),
    )

    expect(translatedCuboid).toEqual({
      type: "translate",
      vector: [10, 20, 30],
      shape: {
        type: "cuboid",
        size: [5, 5, 5],
      },
    })

    const executedOp = executeJscadOperations(jscadPlanner, translatedCuboid)
    expect(executedOp).toEqual(translatedCuboid)
  })
})
