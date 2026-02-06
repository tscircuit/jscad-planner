import { describe, expect, it } from "bun:test"
import { executeJscadOperations } from "../lib/execute-jscad-operations"
import { jscadPlanner } from "../lib/jscad-planner"

describe("geom2.fromPoints and rotate axis transforms", () => {
  it("creates a fromPoints geom2 operation and executes it", () => {
    const points: [number, number][] = [
      [0, 0],
      [10, 0],
      [10, 5],
    ]

    const op = jscadPlanner.geometries.geom2.fromPoints(points)

    expect(op).toEqual({
      type: "fromPointsGeom2",
      points,
    })

    expect(executeJscadOperations(jscadPlanner, op)).toEqual(op)
  })

  it("creates rotateX/Y/Z operations and executes them", () => {
    const shape = jscadPlanner.primitives.cube({ size: 4, center: [0, 0, 0] })

    const rx = jscadPlanner.transforms.rotateX(Math.PI / 6, shape)
    const ry = jscadPlanner.transforms.rotateY(Math.PI / 4, shape)
    const rz = jscadPlanner.transforms.rotateZ(Math.PI / 3, shape)

    expect(rx).toEqual({
      type: "rotateX",
      angle: Math.PI / 6,
      shape,
    })
    expect(ry).toEqual({
      type: "rotateY",
      angle: Math.PI / 4,
      shape,
    })
    expect(rz).toEqual({
      type: "rotateZ",
      angle: Math.PI / 3,
      shape,
    })

    expect(executeJscadOperations(jscadPlanner, rx)).toEqual(rx)
    expect(executeJscadOperations(jscadPlanner, ry)).toEqual(ry)
    expect(executeJscadOperations(jscadPlanner, rz)).toEqual(rz)
  })
})
