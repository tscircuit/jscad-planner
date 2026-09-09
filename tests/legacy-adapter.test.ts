import { expect, it, mock } from "bun:test"
import {
  executeJscadOperations,
  jscadPlanner,
  type JscadImplementation,
  type JscadOperation,
} from "../lib"

it("accepts an adapter without matrix support and executes legacy operations", () => {
  const { transform, ...legacyTransforms } = jscadPlanner.transforms
  const cube = mock(jscadPlanner.primitives.cube)
  const translate = mock(legacyTransforms.translate)
  const adapter: JscadImplementation<JscadOperation, JscadOperation> = {
    ...jscadPlanner,
    primitives: { ...jscadPlanner.primitives, cube },
    transforms: { ...legacyTransforms, translate },
  }
  const shape = jscadPlanner.primitives.cube({ size: 2 })
  const plan = jscadPlanner.booleans.union(
    jscadPlanner.transforms.translate(
      [1, 2, 3],
      jscadPlanner.transforms.scale(
        [2, 3, 4],
        jscadPlanner.transforms.rotate(
          [0.1, 0.2, 0.3],
          jscadPlanner.transforms.rotateX(
            0.4,
            jscadPlanner.transforms.rotateY(
              0.5,
              jscadPlanner.transforms.rotateZ(0.6, shape),
            ),
          ),
        ),
      ),
    ),
    shape,
  )

  expect(adapter.transforms.transform).toBeUndefined()
  expect(executeJscadOperations(adapter, plan)).toEqual(plan)
  expect(cube).toHaveBeenCalledTimes(2)
  expect(translate).toHaveBeenCalledTimes(1)
})
