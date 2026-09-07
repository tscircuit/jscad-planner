import type { Matrix4 } from "./jscad-operations-types"

export function assertTransformMatrix(
  matrix: unknown,
): asserts matrix is Matrix4 {
  if (
    !Array.isArray(matrix) ||
    matrix.length !== 16 ||
    !Array.from(matrix).every(Number.isFinite)
  ) {
    throw new Error(
      "Transform matrix must be a column-major array of exactly 16 finite numbers",
    )
  }
}
