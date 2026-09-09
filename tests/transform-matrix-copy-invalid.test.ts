import { expect, it } from "bun:test"
import { toTransformMatrix } from "../lib"

it("rejects invalid array-like matrices before copying or returning them", () => {
  const invalidMatrices: unknown[] = [
    undefined,
    null,
    {},
    { length: 2 ** 32 },
    { length: 16 },
    "1111111111111111",
    new Float64Array(15),
    new Float32Array(17),
    new Float64Array(16).fill(NaN),
    new Float64Array(16).fill(Infinity),
    new Float64Array(16).fill(-Infinity),
  ]

  for (const matrix of invalidMatrices) {
    expect(() =>
      // @ts-expect-error Exercise invalid matrices from untyped callers.
      toTransformMatrix(matrix),
    ).toThrow("exactly 16 finite numbers")
  }
})
