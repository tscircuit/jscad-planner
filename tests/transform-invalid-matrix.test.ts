import { expect, it, mock } from "bun:test"
import { executeJscadOperations, jscadPlanner } from "../lib"

it("rejects malformed matrices before building or executing a transform", () => {
  const invalidMatrices = [
    undefined,
    null,
    "not a matrix",
    {},
    [],
    Array(15).fill(0),
    Array(17).fill(0),
    Array(16),
    [...Array(15).fill(0), "1"],
    [...Array(15).fill(0), null],
    [...Array(15).fill(0), NaN],
    [...Array(15).fill(0), Infinity],
    [...Array(15).fill(0), -Infinity],
    new Float32Array(16),
  ]
  const cube = mock(jscadPlanner.primitives.cube)
  const transform = mock(jscadPlanner.transforms.transform)
  const implementation = {
    ...jscadPlanner,
    primitives: { ...jscadPlanner.primitives, cube },
    transforms: { ...jscadPlanner.transforms, transform },
  }
  const shape = jscadPlanner.primitives.cube({ size: 2 })
  const message = "exactly 16 finite numbers"

  for (const matrix of invalidMatrices) {
    expect(() =>
      // @ts-expect-error Exercise malformed matrices from untyped callers.
      jscadPlanner.transforms.transform(matrix, shape),
    ).toThrow(message)
    expect(() =>
      executeJscadOperations(implementation, {
        type: "transform",
        // @ts-expect-error Exercise malformed matrices from external plans.
        matrix,
        shape,
      }),
    ).toThrow(message)
  }
  expect(cube).not.toHaveBeenCalled()
  expect(transform).not.toHaveBeenCalled()
})
