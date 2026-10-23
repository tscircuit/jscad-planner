import { expect, test } from "bun:test"
import upstream from "@jscad/modeling"
import {
  executeJscadOperations,
  jscadPlanner as p,
  type JscadImplementation,
} from "../lib"

test("legacy adapters receive geometry options without cap names after a JSON roundtrip", () => {
  const options = { height: -8, twistAngle: 0.2, twistSteps: 4 }
  const plan = JSON.parse(
    JSON.stringify(
      p.extrusions.extrudeLinear(
        { ...options, topOutlineName: "top", bottomOutlineName: "bottom" },
        p.references.name(
          "profile",
          p.references.nameOutlines(p.primitives.rectangle({ size: [4, 6] }), {
            outer: "outside",
          }),
        ),
      ),
    ),
  )
  const before = JSON.stringify(plan)
  let calls = 0
  const adapter = {
    ...upstream,
    extrusions: {
      ...upstream.extrusions,
      extrudeLinear: (received: typeof options, shape: any) => {
        calls++
        expect(received).toEqual(options)
        return upstream.extrusions.extrudeLinear(received, shape)
      },
    },
  } as unknown as JscadImplementation<any, any>
  const expected = upstream.extrusions.extrudeLinear(
    options,
    upstream.primitives.rectangle({ size: [4, 6] }),
  )
  for (const references of [undefined, {}]) {
    const result = executeJscadOperations({ ...adapter, references }, plan)
    expect(upstream.geometries.geom3.toPolygons(result)).toEqual(
      upstream.geometries.geom3.toPolygons(structuredClone(expected)),
    )
  }
  expect(calls).toBe(2)
  expect(JSON.stringify(plan)).toBe(before)
})
