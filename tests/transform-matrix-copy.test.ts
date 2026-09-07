import { expect, it } from "bun:test"
import {
  jscadPlanner,
  toTransformMatrix,
  type Matrix4,
  type TransformOperation,
} from "../lib"

it("copies numeric array-like matrices losslessly into serializable tuples", () => {
  const precise = new Float64Array([
    1 + Number.EPSILON,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    7 + 2 ** -40,
    -5,
    11,
    1,
  ])
  const inputs: ArrayLike<number>[] = [
    precise,
    new Float32Array(precise),
    Array.from(precise),
    { ...precise, length: 16 },
  ]
  const shape = jscadPlanner.primitives.cuboid({ size: [2, 4, 6] })

  for (const input of inputs) {
    const matrix: Matrix4 = toTransformMatrix(input)
    const operation: TransformOperation = { type: "transform", matrix, shape }

    expect(Array.isArray(matrix)).toBe(true)
    expect(matrix).not.toBe(input)
    expect(Array.from(matrix)).toEqual(Array.from(input))
    expect(jscadPlanner.transforms.transform(matrix, shape)).toEqual(operation)
    expect(JSON.parse(JSON.stringify(operation))).toEqual(operation)
  }

  const matrix = toTransformMatrix(precise)
  precise[12] = 100
  expect(matrix[0]).toBe(1 + Number.EPSILON)
  expect(matrix[12]).toBe(7 + 2 ** -40)
})
