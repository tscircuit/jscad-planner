import jscad from "@jscad/modeling"
import { executeJscadOperations, type JscadOperation } from "../../lib"

export const executeModelingPlan = (operation: JscadOperation): unknown => {
  // @ts-expect-error The existing implementation interface differs from JSCAD's overloaded primitives/geometries.
  return executeJscadOperations(jscad, operation)
}
