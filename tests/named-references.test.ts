import { expect, test } from "bun:test"
import type { JscadImplementation } from "../lib"
import upstream from "@jscad/modeling"
import jscad from "@tscircuit/jscad"
import {
  executeJscadOperations,
  jscadPlanner as planner,
  resolveReferencePlanes,
} from "../lib"

const nativeAdapter = jscad as unknown as JscadImplementation<any, any>
const rawAdapter = upstream as unknown as JscadImplementation<any, any>

test("reference operations survive JSON and execute using a compatible kernel", () => {
  const profile = planner.references.nameOutlines(
    planner.booleans.subtract(
      planner.primitives.rectangle({ size: [20, 14] }),
      planner.primitives.polygon({
        points: [
          [-2, -2],
          [2, -2],
          [2, 2],
          [-2, 2],
        ],
      }),
    ),
    { outer: "outside", hole: "bore" },
  )
  const plan = planner.transforms.translate(
    [10, 20, 30],
    planner.extrusions.extrudeLinear(
      { height: -8, topOutlineName: "top", bottomOutlineName: "bottom" },
      profile,
    ),
  )
  const roundtrip = JSON.parse(JSON.stringify(plan))
  const before = JSON.stringify(roundtrip)
  const solid = executeJscadOperations<any, any>(nativeAdapter, roundtrip)
  expect(jscad.references.list(solid)).toContain("top.bore")
  expect(jscad.references.get(solid, "top.bore").matrix.slice(12, 15)).toEqual([
    10, 20, 22,
  ])
  expect(JSON.stringify(roundtrip)).toBe(before)
  const unnamed = executeJscadOperations<any, any>(rawAdapter, roundtrip)
  expect(upstream.geometries.geom3.toPolygons(unnamed)).toEqual(
    upstream.geometries.geom3.toPolygons(structuredClone(solid)),
  )
  expect(
    upstream.measurements.measureArea(
      executeJscadOperations<any, any>(rawAdapter, profile),
    ),
  ).toBeCloseTo(264)
  expect(JSON.stringify(roundtrip)).toBe(before)
  const named = planner.references.name(
    "outline",
    planner.primitives.rectangle({ size: [2, 4] }),
  )
  expect(
    jscad.references.list(
      executeJscadOperations<any, any>(nativeAdapter, named),
    ),
  ).toEqual(["outline"])
  const wrappedPlane = planner.references.name("datum", {
    type: "rectangle",
    size: [2, 4],
    reference: true,
    name: "mount",
  })
  expect(resolveReferencePlanes(wrappedPlane).referencePlanes[0]?.name).toBe(
    "mount",
  )
  expect(
    executeJscadOperations<any, any>(
      rawAdapter,
      planner.primitives.cuboid({ size: [2, 3, 4] }),
    ).polygons,
  ).toHaveLength(6)
})
