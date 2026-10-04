import { expect, test } from "bun:test"
import jscad from "@jscad/modeling"
import {
  executeJscadOperations,
  jscadPlanner as p,
  preserveMaterial,
  resolveReferencePlanes,
  materials,
  type JscadOperation,
  type MaterialOptions,
} from "../lib"
import { executeModelingPlan } from "./fixtures/execute-modeling-plan"

const silver: MaterialOptions = {
  color: "silver",
  metalness: 1,
  roughness: 0.25,
}
const blue: MaterialOptions = { color: "royalblue", opacity: 0.5 }
const roundTrip = (plan: JscadOperation): JscadOperation =>
  JSON.parse(JSON.stringify(plan))

// Execute actual native geometry; the fixture accounts for existing differences
// between JSCAD's overloads and the planner adapter's TypeScript interface.
const execute = (plan: JscadOperation): any =>
  executeModelingPlan(roundTrip(plan))

test("typed primitive materials survive JSON and native execution", () => {
  const primitives = [
    p.primitives.cube({ size: 2, material: silver }),
    p.primitives.sphere({ radius: 2, material: silver }),
    p.primitives.cylinder({ radius: 2, height: 3, material: silver }),
    p.primitives.cuboid({ size: [2, 3, 4], material: silver }),
    p.primitives.roundedCuboid({
      size: [2, 3, 4],
      roundRadius: 0.2,
      material: silver,
    }),
    p.primitives.rectangle({ size: [2, 3], material: silver }),
    p.primitives.polygon({
      points: [
        [0, 0],
        [2, 0],
        [0, 3],
      ],
      material: silver,
    }),
  ]
  for (const plan of primitives) {
    const json = JSON.stringify(plan)
    const geometry = execute(plan)
    expect(geometry.material).toEqual(silver)
    expect(geometry.material).not.toBe(plan.material)
    expect(JSON.stringify(plan)).toBe(json)
  }
})

test("a translated silver cube keeps its material and geometry after execution", () => {
  const plan = p.transforms.translate(
    [5, 0, 0],
    p.materials.applyMaterial(silver, p.primitives.cube({ size: 2 })),
  )
  const geometry = execute(plan)
  expect(geometry.material).toEqual(silver)
  expect(jscad.measurements.measureBoundingBox(geometry) as number[][]).toEqual(
    [
      [4, -1, -1],
      [6, 1, 1],
    ],
  )
  expect(jscad.measurements.measureVolume(geometry)).toBeCloseTo(8)
})

test("applyMaterial creates a serializable operation and supports native and custom adapters", () => {
  const shape = p.primitives.cube({ size: 2 })
  const plan = p.materials.applyMaterial(silver, shape)
  expect(plan).toEqual({ type: "applyMaterial", material: silver, shape })
  expect(execute(plan).material).toEqual(silver)
  expect(executeJscadOperations(p, roundTrip(plan))).toEqual(plan)
  let calls = 0
  const adapter = {
    ...p,
    materials: {
      applyMaterial: (material: MaterialOptions, geometry: JscadOperation) => {
        calls++
        return p.materials.applyMaterial(material, geometry)
      },
    },
  }
  expect(executeJscadOperations(adapter, plan)).toEqual(plan)
  expect(calls).toBe(1)
  expect(execute(p.materials.applyMaterial(blue, plan)).material).toEqual(blue)
  const reference = p.primitives.rectangle({
    size: [2, 2],
    reference: true,
    name: "hidden",
  })
  expect(
    resolveReferencePlanes(p.materials.applyMaterial(silver, reference))
      .geometry,
  ).toBeUndefined()
  const measured = p.measurements.measureVolume(shape)
  expect(() => execute(p.materials.applyMaterial(silver, measured))).toThrow(
    "geometry operation",
  )
})

test("matrix transforms, legacy transforms and colorization inherit materials", () => {
  const shape = p.primitives.cube({ size: 2, material: silver })
  const plans = [
    p.transforms.transform(jscad.maths.mat4.create(), shape),
    p.transforms.translate([1, 2, 3], shape),
    p.transforms.rotate([0.1, 0.2, 0.3], shape),
    p.transforms.rotateX(0.1, shape),
    p.transforms.rotateY(0.2, shape),
    p.transforms.rotateZ(0.3, shape),
    p.transforms.scale([2, 3, 4], shape),
    p.colors.colorize([1, 0, 0], shape),
  ]
  for (const plan of plans) {
    expect(execute(plan).material).toEqual(silver)
    expect(execute(p.materials.applyMaterial(blue, plan)).material).toEqual(
      blue,
    )
  }
  expect(execute(p.colors.colorize([1, 0, 0], shape)).color).toEqual([
    1, 0, 0, 1,
  ])
})

test("linear and rotational extrusion inherit profile materials", () => {
  const profile = p.primitives.rectangle({
    size: [1, 2],
    center: [3, 0],
    material: silver,
  })
  const plans = [
    p.extrusions.extrudeLinear({ height: 4 }, profile),
    p.extrusions.extrudeRotate({ angle: Math.PI * 2 }, profile),
  ]
  for (const plan of plans) {
    const solid = execute(plan)
    expect(solid.material).toEqual(silver)
    expect(jscad.measurements.measureVolume(solid)).toBeGreaterThan(0)
    expect(execute(p.materials.applyMaterial(blue, plan)).material).toEqual(
      blue,
    )
  }
})

test("subtraction inherits from its base, with an explicit result override", () => {
  const plan = p.booleans.subtract(
    p.primitives.cube({ size: 4, material: silver }),
    p.primitives.sphere({ radius: 1, material: blue }),
  )
  const actual = execute(plan)
  expect(actual.material).toEqual(silver)
  expect(jscad.measurements.measureVolume(actual)).toBeLessThan(64)
  expect(execute(p.materials.applyMaterial(blue, plan)).material).toEqual(blue)
  expect(
    execute(
      p.booleans.subtract(
        p.primitives.cube({ size: 4 }),
        p.primitives.sphere({ radius: 1, material: blue }),
      ),
    ).material,
  ).toBeUndefined()
})

test("combined booleans and hulls use only a result material", () => {
  const a = p.primitives.cube({ size: 2, material: silver })
  const b = p.primitives.cube({ size: 2, center: [1, 0, 0], material: blue })
  const plans = [
    p.booleans.union(a, b),
    p.booleans.intersect(a, b),
    p.hulls.hull(a, b),
    p.hulls.hullChain(a, b),
  ]
  for (const plan of plans) {
    const actual = execute(plan)
    expect(actual.material).toBeUndefined()
    expect(execute(p.materials.applyMaterial(silver, plan)).material).toEqual(
      silver,
    )
  }
})

test("reference removal and single-shape collapse preserve the result material", () => {
  const solid = p.primitives.cube({ size: 2, material: silver })
  const marker = p.primitives.rectangle({
    size: [2, 2],
    name: "mount",
    reference: true,
    material: silver,
  })
  for (const plan of [
    p.booleans.union(solid, marker),
    p.booleans.subtract(solid, marker),
    p.hulls.hull(solid, marker),
  ]) {
    const authored = p.materials.applyMaterial(blue, plan)
    const { geometry, referencePlanes } = resolveReferencePlanes(
      roundTrip(authored),
    )
    expect(geometry?.material).toEqual(blue)
    expect(referencePlanes).toHaveLength(1)
    expect(execute(authored).material).toEqual(blue)
    expect(solid.material).toEqual(silver)
  }
  expect(execute(p.booleans.union(solid)).material).toEqual(silver)
})

test("measurements and conversions keep their original numeric results", () => {
  const solid = p.primitives.cube({ size: 2, material: silver })
  expect(
    execute({ ...p.measurements.measureVolume(solid), material: blue }),
  ).toBeCloseTo(8)
  expect(
    execute({ ...p.measurements.measureArea(solid), material: blue }),
  ).toBeCloseTo(24)
  const bounds = execute({
    ...p.measurements.measureBoundingBox(solid),
    material: blue,
  })
  expect(bounds).toEqual([
    [-1, -1, -1],
    [1, 1, 1],
  ])
  expect(bounds).not.toHaveProperty("material")
  expect(bounds[0]).not.toHaveProperty("material")
  expect(
    execute({ type: "degToRad", degrees: 180, material: silver }),
  ).toBeCloseTo(Math.PI)
  expect(
    execute({ type: "radToDeg", radians: Math.PI, material: silver }),
  ).toBeCloseTo(180)
})

test("shared helpers copy tuple colors and geometry arrays without mutating inputs", () => {
  const material: MaterialOptions = {
    color: [0.1, 0.2, 0.3],
    emissive: [0.4, 0.5, 0.6],
  }
  const source = p.primitives.cube({ size: 2 })
  const authored = p.materials.applyMaterial(material, source)
  const geometry = execute(authored)
  geometry.material.color[0] = 0.9
  geometry.material.emissive[0] = 0.9
  expect(material.color).toEqual([0.1, 0.2, 0.3])
  expect(authored.material).toEqual(material)
  expect(source.material).toBeUndefined()
  const shapes = [
    jscad.primitives.cube({ size: 2 }),
    jscad.primitives.sphere({ radius: 1 }),
  ]
  const applied = materials.applyMaterial(silver, shapes)
  const preserved = preserveMaterial({ material: silver }, shapes)
  expect(applied.map((shape) => shape.material)).toEqual([silver, silver])
  expect(preserved).toEqual(applied)
  expect(shapes[0]).not.toHaveProperty("material")
  expect(shapes[1]).not.toHaveProperty("material")
})

test("material support works with planner adapters and stays out of primitive options", () => {
  const cube = p.primitives.cube({ size: 2, material: silver })
  const plan = p.materials.applyMaterial(
    blue,
    p.transforms.translate([5, 0, 0], p.primitives.cube({ size: 2 })),
  )
  expect(executeJscadOperations(p, roundTrip(plan))).toEqual(plan)
  let received: unknown
  const adapter = {
    ...p,
    primitives: {
      ...p.primitives,
      cube: (options: Parameters<typeof p.primitives.cube>[0]) => {
        received = options
        return p.primitives.cube(options)
      },
    },
  }
  expect(executeJscadOperations(adapter, cube).material).toEqual(silver)
  expect(received).toEqual({ size: 2 })
  // Some adapters copy the first operand instead of constructing fresh metadata.
  const copyingAdapter = {
    ...p,
    booleans: {
      ...p.booleans,
      union: (...shapes: JscadOperation[]) => shapes[0],
    },
  }
  const combined = p.booleans.union(cube, p.primitives.cube({ size: 3 }))
  expect(
    executeJscadOperations(copyingAdapter, combined).material,
  ).toBeUndefined()
  expect(
    executeJscadOperations(
      copyingAdapter,
      p.materials.applyMaterial(blue, combined),
    ).material,
  ).toEqual(blue)
})
