import { describe, expect, it } from "bun:test"
import assert from "node:assert/strict"
import jscad from "@jscad/modeling"
import { executeJscadOperations, jscadPlanner } from "../lib"
import { executeModelingPlan } from "./fixtures/execute-modeling-plan"

for (const primitive of ["sphere", "cylinder"] as const) {
  describe(`${primitive} resolution`, () => {
    for (const resolution of [8, 16]) {
      it(`uses ${resolution} segments after a JSON roundtrip`, () => {
        const plan = jscadPlanner.primitives[primitive]({
          radius: 2,
          center: [1, 2, 3],
          resolution,
        })
        const restored = JSON.parse(JSON.stringify(plan))
        expect(executeJscadOperations(jscadPlanner, restored)).toEqual(plan)
        const actual = executeModelingPlan(restored)
        const expected = jscad.primitives[primitive]({
          radius: 2,
          center: [1, 2, 3],
          segments: resolution,
        })
        assert(jscad.geometries.geom3.isA(actual))
        expect(jscad.geometries.geom3.toPolygons(actual)).toEqual(
          jscad.geometries.geom3.toPolygons(expected),
        )
      })
    }

    it("honors resolution in an existing serialized plan", () => {
      const plan = { type: primitive, resolution: 8 }
      const actual = executeModelingPlan(plan)
      assert(jscad.geometries.geom3.isA(actual))
      expect(jscad.geometries.geom3.toPolygons(actual)).toEqual(
        jscad.geometries.geom3.toPolygons(
          jscad.primitives[primitive]({ segments: 8 }),
        ),
      )
      expect(plan).toEqual({ type: primitive, resolution: 8 })
    })

    it("accepts native segments and gives it precedence over resolution", () => {
      for (const options of [
        { segments: 8 },
        { segments: 8, resolution: 16 },
      ]) {
        const plan = jscadPlanner.primitives[primitive](Object.freeze(options))
        const actual = executeModelingPlan(JSON.parse(JSON.stringify(plan)))
        assert(jscad.geometries.geom3.isA(actual))
        expect(jscad.geometries.geom3.toPolygons(actual)).toEqual(
          jscad.geometries.geom3.toPolygons(
            jscad.primitives[primitive]({ segments: 8 }),
          ),
        )
      }
    })

    it("keeps the native default when no resolution is specified", () => {
      const actual = executeModelingPlan(jscadPlanner.primitives[primitive]())
      assert(jscad.geometries.geom3.isA(actual))
      expect(jscad.geometries.geom3.toPolygons(actual)).toEqual(
        jscad.geometries.geom3.toPolygons(jscad.primitives[primitive]()),
      )
    })
  })
}
