import { expect, it } from "bun:test"
import {
  assertTransformMatrix,
  executeJscadOperations,
  jscadPlanner,
  type TransformOperation,
} from "../lib"

it("narrows a copied typed-array matrix for serializable operations without casts", () => {
  const externalMat4 = new Float32Array([
    1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 7, -5, 11, 1,
  ])
  const matrix = [...externalMat4]
  assertTransformMatrix(matrix)
  const shape = jscadPlanner.primitives.cuboid({ size: [2, 4, 6] })
  const operation: TransformOperation = { type: "transform", matrix, shape }

  expect(Array.isArray(operation.matrix)).toBe(true)
  expect(jscadPlanner.transforms.transform(matrix, shape)).toEqual(operation)
  expect(JSON.parse(JSON.stringify(operation))).toEqual(operation)
  expect(executeJscadOperations(jscadPlanner, operation)).toEqual(operation)
})
