import { expect, test } from "bun:test"
import { mkdirSync } from "node:fs"
import jscad from "@jscad/modeling"
import type { Geom3 } from "@jscad/modeling/src/geometries/types"
import type { JscadOperation } from "../lib"
import { executeModelingPlan } from "./fixtures/execute-modeling-plan"

// Found while making the ORBIT turntable's multicolour wire harness.
// Reduced to two disjoint solids: a union should retain their face colours.
// This snapshot records the current bug, not the intended fixed appearance.
const shapes: JscadOperation[] = [
  { type: "colorize", color: [0, 0.42, 1], shape: {
    type: "translate", vector: [-5, 0, 0],
    shape: { type: "cuboid", size: [8, 8, 3] },
  } },
  { type: "colorize", color: [1, 0.2, 0.13], shape: {
    type: "translate", vector: [5, 0, 0],
    shape: { type: "cuboid", size: [8, 8, 3] },
  } },
]

// Draw the actual executed polygons, using polygon.color ?? geometry.color,
// as downstream mesh exporters do. Gray explicitly means no colour metadata.
function renderGeometry(geometries: Geom3[], offsetX: number): string {
  const faces = geometries.flatMap((geometry) =>
    jscad.geometries.geom3.toPolygons(geometry).map((polygon) => ({
      vertices: polygon.vertices,
      color: polygon.color ?? geometry.color,
      depth: polygon.vertices.reduce((sum, [x, y, z]) => sum + x + y + z, 0)
        / polygon.vertices.length,
    })),
  ).sort((a, b) => a.depth - b.depth)
  return faces.map(({ vertices, color }) => {
    const fill = color
      ? `rgb(${color.slice(0, 3).map((c) => Math.round(c * 255)).join(",")})`
      : "#b8bdc4"
    const points = vertices.map(([x, y, z]) =>
      `${(offsetX + 14 * (x - y)).toFixed(3)},${(190 + 7 * (x + y) - 18 * z).toFixed(3)}`,
    ).join(" ")
    return `<polygon points="${points}" fill="${fill}" stroke="#334155" stroke-width="0.8"/>`
  }).join("\n")
}

test("ORBIT repro: union loses the colours retained by separate shapes", async () => {
  const combined = executeModelingPlan({ type: "union", shapes }) as Geom3
  const separate = shapes.map((shape) => executeModelingPlan(shape) as Geom3)
  expect(separate.map((shape) => shape.color)).toEqual([
    [0, 0.42, 1, 1], [1, 0.2, 0.13, 1],
  ])
  expect(jscad.measurements.measureVolume(combined)).toBeCloseTo(384)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="350" viewBox="0 0 1000 350">
<rect width="1000" height="350" fill="white"/>
<g font-family="sans-serif" text-anchor="middle" fill="#0f172a">
<text x="250" y="35" font-size="22">Combined with union</text>
<text x="750" y="35" font-size="22">Same shapes executed separately</text>
<text x="500" y="325" font-size="16">Gray = missing colour metadata. Expected: both shapes keep their blue / red colours.</text>
</g>
${renderGeometry([combined], 250)}
${renderGeometry(separate, 750)}
</svg>\n`
  const directory = `${import.meta.dir}/__snapshots__`
  const path = `${directory}/orbit-union-colors-repro.svg`
  if (process.env.BUN_UPDATE_SNAPSHOTS === "1") {
    mkdirSync(directory, { recursive: true })
    await Bun.write(path, svg)
  }
  expect(svg).toBe(await Bun.file(path).text())
})
