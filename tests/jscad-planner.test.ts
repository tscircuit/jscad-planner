import { expect, it } from "bun:test"
import { jscadPlanner } from "../lib/jscad-planner.ts"
import { executeJscadOperations } from "../lib/execute-jscad-operations.ts"

it("should be able to create operations, then execute the operations against the jscad planner", () => {
  const operations1 = jscadPlanner.booleans.intersect(
    jscadPlanner.primitives.cube({ size: 10, center: true }),
    jscadPlanner.primitives.sphere({ radius: 10, center: true }),
  )

  expect(operations1).toBeDefined()

  const operations2 = executeJscadOperations(jscadPlanner, operations1)

  expect(operations2).toBeDefined()

  console.log(operations1, operations2)
})
