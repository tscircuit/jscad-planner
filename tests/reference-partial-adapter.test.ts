import { expect, test } from "bun:test"
import upstream from "@jscad/modeling"
import {
  executeJscadOperations,
  jscadPlanner as p,
  type JscadImplementation,
} from "../lib"

test("partial reference adapters use available methods and propagate implementation errors", () => {
  const rectangle = p.primitives.rectangle({ size: [4, 6] })
  const plan = p.references.name(
    "profile",
    p.references.nameOutlines(rectangle, { outer: "outside" }),
  )
  let evaluated = 0
  const named: string[] = []
  const rawAdapter = upstream as unknown as JscadImplementation<any, any>
  const adapter: JscadImplementation<any, any> = {
    ...rawAdapter,
    primitives: {
      ...rawAdapter.primitives,
      rectangle: (options: any) => {
        evaluated++
        return upstream.primitives.rectangle(options)
      },
    },
    references: {
      name(name, shape) {
        named.push(name)
        return shape
      },
    },
  }
  expect(
    upstream.measurements.measureArea(executeJscadOperations(adapter, plan)),
  ).toBeCloseTo(24)
  expect(evaluated).toBe(1)
  expect(named).toEqual(["profile"])
  const outlinesOnly: JscadImplementation<any, any> = {
    ...adapter,
    references: {
      nameOutlines(shape, names) {
        named.push(names.outer!)
        return shape
      },
    },
  }
  expect(
    upstream.measurements.measureArea(
      executeJscadOperations(outlinesOnly, plan),
    ),
  ).toBeCloseTo(24)
  expect(evaluated).toBe(2)
  expect(named).toEqual(["profile", "outside"])
  expect(() =>
    executeJscadOperations(
      {
        ...adapter,
        references: {
          name() {
            throw new Error("invalid reference name")
          },
        },
      },
      plan,
    ),
  ).toThrow("invalid reference name")
  expect(() =>
    executeJscadOperations(
      {
        ...adapter,
        references: {
          nameOutlines() {
            throw new Error("ambiguous outline")
          },
        },
      },
      plan,
    ),
  ).toThrow("ambiguous outline")
  expect(() =>
    executeJscadOperations(
      {
        ...adapter,
        references: undefined,
        primitives: {
          ...adapter.primitives,
          rectangle() {
            throw new Error("invalid profile")
          },
        },
      },
      plan,
    ),
  ).toThrow("invalid profile")
})
