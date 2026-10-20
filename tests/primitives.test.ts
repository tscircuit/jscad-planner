import { expect, it, describe } from "bun:test"
import { jscadPlanner } from "../lib/jscad-planner.ts"
import { executeJscadOperations } from "../lib/execute-jscad-operations.ts"

describe("primitives", () => {
  it("should create a cuboid operation and round-trip it through the executor", () => {
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

  it("should create a cylinder operation and round-trip it through the executor", () => {
    const cylinderOp = jscadPlanner.primitives.cylinder({
      radius: 5,
      height: 20,
      center: [0, 0, 0],
      resolution: 32,
    })

    expect(cylinderOp).toEqual({
      type: "cylinder",
      radius: 5,
      height: 20,
      center: [0, 0, 0],
      resolution: 32,
    })

    const executedOp = executeJscadOperations(jscadPlanner, cylinderOp)
    expect(executedOp).toEqual(cylinderOp)
  })

  it("should create a polygon operation and round-trip it through the executor", () => {
    const polygonOp = jscadPlanner.primitives.polygon({
      points: [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
    })

    expect(polygonOp).toEqual({
      type: "polygon",
      points: [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ],
    })

    const executedOp = executeJscadOperations(jscadPlanner, polygonOp)
    expect(executedOp).toEqual(polygonOp)
  })
})
