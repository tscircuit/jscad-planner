import type { Matrix4 } from "./jscad-operations-types"

const invalidTransformMatrixMessage =
  "Transform matrix must be a column-major array of exactly 16 finite numbers"

export function assertTransformMatrix(
  matrix: unknown,
): asserts matrix is Matrix4 {
  if (
    !Array.isArray(matrix) ||
    matrix.length !== 16 ||
    !Array.from(matrix).every(Number.isFinite)
  ) {
    throw new Error(invalidTransformMatrixMessage)
  }
}

export function toTransformMatrix(matrix: ArrayLike<number>): Matrix4 {
  if (matrix == null || matrix.length !== 16) {
    throw new Error(invalidTransformMatrixMessage)
  }
  const copy = Array.from(matrix)
  assertTransformMatrix(copy)
  return copy
}
