import { expect, it, mock } from "bun:test"
import {
  executeJscadOperations,
  jscadPlanner,
  type JscadImplementation,
  type JscadOperation,
  type Matrix4,
} from "../lib"

it("reports missing matrix support before executing the child shape", () => {
  const { transform, ...legacyTransforms } = jscadPlanner.transforms
  const cube = mock(jscadPlanner.primitives.cube)
  const adapter: JscadImplementation<JscadOperation, JscadOperation> = {
    ...jscadPlanner,
    primitives: { ...jscadPlanner.primitives, cube },
    transforms: legacyTransforms,
  }
  const matrix: Matrix4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 7, -5, 11, 1]
  const plan = jscadPlanner.transforms.transform(
    matrix,
    jscadPlanner.primitives.cube({ size: 2 }),
  )

  expect(() => executeJscadOperations(adapter, plan)).toThrow(
    'Cannot execute "transform" operation: this JSCAD adapter does not support transforms.transform',
  )
  expect(cube).not.toHaveBeenCalled()
})
