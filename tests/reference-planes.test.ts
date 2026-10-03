import { expect, test } from "bun:test"
import jscad from "@jscad/modeling"
import {
  executeJscadOperations,
  jscadPlanner as p,
  resolveReferencePlanes,
  type JscadOperation,
  type Vector3D,
} from "../lib"

const marker = (name: string): JscadOperation =>
  p.primitives.rectangle({ size: [42, 42], name, reference: true })
const execute = (plan: JscadOperation) => {
  // @ts-expect-error JSCAD overloads differ from the existing adapter interface.
  return executeJscadOperations(jscad, plan)
}
const closeVector = (actual: number[], expected: number[]) =>
  actual.forEach((n, i) => expect(n).toBeCloseTo(expected[i], 8))

test("spacer references survive JSON and leave the solid and holes unchanged", () => {
  for (const height of [10, 18]) {
    const centers = [-15.5, 15.5].flatMap((x) =>
      [-15.5, 15.5].map((y) => [x, y]),
    )
    const cylinder = (radius: number, x: number, y: number, h = height) =>
      p.primitives.cylinder({ radius, height: h, center: [x, y, height / 2] })
    const solid = p.booleans.subtract(
      p.booleans.union(
        p.transforms.translate(
          [0, 0, 2],
          p.primitives.cuboid({ size: [42, 42, 4] }),
        ),
        ...centers.map(([x, y]) => cylinder(4, x, y)),
      ),
      cylinder(15, 0, 0, height + 2),
      ...centers.map(([x, y]) => cylinder(1.6, x, y, height + 2)),
    )
    const plan = p.booleans.union(
      solid,
      p.transforms.rotateY(Math.PI, marker("motor")),
      p.transforms.translate([0, 0, height], marker("board")),
    )
    const json = JSON.stringify(plan)
    const { geometry, referencePlanes } = resolveReferencePlanes(
      JSON.parse(json),
    )
    expect(geometry).toEqual(solid)
    expect(JSON.stringify(plan)).toBe(json)
    closeVector(referencePlanes[0].normal, [0, 0, -1])
    closeVector(referencePlanes[1].origin, [0, 0, height])
    const actual = execute(plan)
    expect(jscad.geometries.geom3.toPolygons(actual)).toEqual(
      jscad.geometries.geom3.toPolygons(execute(solid)),
    )
    closeVector(jscad.measurements.measureBoundingBox(actual)[1], [
      21,
      21,
      height,
    ])
    for (const [x, y] of centers) {
      const holeProbe = execute(cylinder(1.5, x, y, height + 2))
      expect(
        jscad.measurements.measureVolume(
          jscad.booleans.intersect(actual, holeProbe),
        ),
      ).toBeCloseTo(0, 8)
    }
    expect(
      jscad.measurements.measureVolume(
        jscad.booleans.intersect(
          actual,
          execute(cylinder(14.9, 0, 0, height + 2)),
        ),
      ),
    ).toBeCloseTo(0, 8)
  }
})

test("composes transform order and keeps the in-plane axis through rotations", () => {
  const reference = p.primitives.rectangle({
    size: [2, 4],
    center: [3, 5],
    name: "offset",
    reference: true,
  })
  const angles = [0.4, -0.7, 1.1]
  const translation: Vector3D = [7, -5, 11]
  const plan = p.transforms.translate(
    translation,
    p.transforms.rotate(angles, reference),
  )
  const plane = resolveReferencePlanes(plan).referencePlanes[0]
  const transformPoint = (point: Vector3D): Vector3D => {
    const rotated = jscad.maths.vec3.transform(
      jscad.maths.vec3.create(),
      point,
      jscad.maths.mat4.fromTaitBryanRotation(
        jscad.maths.mat4.create(),
        angles[2],
        angles[1],
        angles[0],
      ),
    )
    return jscad.maths.vec3.add(jscad.maths.vec3.create(), rotated, translation)
  }
  const origin = transformPoint([3, 5, 0])
  const xPoint = transformPoint([4, 5, 0])
  const zPoint = transformPoint([3, 5, 1])
  closeVector(plane.origin, origin)
  closeVector(
    plane.xAxis,
    xPoint.map((n, i) => n - origin[i]),
  )
  closeVector(
    plane.normal,
    zPoint.map((n, i) => n - origin[i]),
  )
  expect(
    resolveReferencePlanes(
      p.transforms.rotate(
        angles,
        p.transforms.translate(translation, reference),
      ),
    ).referencePlanes[0].origin,
  ).not.toEqual(plane.origin)
})

test("affine transforms preserve planes through shear, scaling, and reflection", () => {
  const matrix = jscad.maths.mat4.create()
  matrix[0] = 2
  matrix[5] = 3
  matrix[10] = -4
  matrix[2] = 0.5
  matrix[12] = 7
  matrix[13] = 9
  matrix[14] = 11
  const plane = resolveReferencePlanes(
    p.transforms.transform(matrix, marker("mount")),
  ).referencePlanes[0]
  const expected = jscad.maths.plane.transform(
    jscad.maths.plane.create(),
    [0, 0, 1, 0],
    matrix,
  )
  // JSCAD flips reflected polygon normals; attachment normals represent a side
  // of a plane and follow inverse transpose, retaining the authored side.
  closeVector(plane.origin, [7, 9, 11])
  expect(
    Math.abs(
      jscad.maths.vec3.dot(plane.normal, [
        expected[0],
        expected[1],
        expected[2],
      ]),
    ),
  ).toBeCloseTo(1)
  expect(jscad.maths.vec3.dot(plane.normal, plane.xAxis)).toBeCloseTo(0)
  expect(plane.normal[2]).toBeLessThan(0)
})

test("reference cutters are omitted but a reference cannot replace a subtraction base", () => {
  const solid = p.primitives.cuboid({ size: [2, 3, 4] })
  expect(
    resolveReferencePlanes(p.booleans.subtract(solid, marker("mount")))
      .geometry,
  ).toEqual(solid)
  expect(() =>
    resolveReferencePlanes(p.booleans.subtract(marker("mount"), solid)),
  ).toThrow("subtraction base")
})

test("ordinary rectangles still execute and extrude", () => {
  const plan = p.extrusions.extrudeLinear(
    { height: 4 },
    p.primitives.rectangle({ size: [2, 3] }),
  )
  expect(jscad.measurements.measureVolume(execute(plan))).toBeCloseTo(24)
})

test("rejects ambiguous or unusable reference frames", () => {
  expect(() =>
    resolveReferencePlanes([marker("same"), marker("same")]),
  ).toThrow("Duplicate")
  expect(() => resolveReferencePlanes(marker(" "))).toThrow("nonblank")
  expect(() =>
    resolveReferencePlanes({
      type: "rectangle",
      size: [0, 2],
      name: "bad",
      reference: true,
    }),
  ).toThrow("positive finite")
  expect(() =>
    resolveReferencePlanes({
      type: "cuboid",
      size: [1, 1, 1],
      name: "bad",
      reference: true,
    }),
  ).toThrow("Only rectangles")
  expect(() =>
    resolveReferencePlanes(p.transforms.scale([1, 1, 0], marker("flat"))),
  ).toThrow("singular")
  expect(() =>
    resolveReferencePlanes(p.transforms.translate([NaN, 0, 0], marker("bad"))),
  ).toThrow("finite")
  const projective = jscad.maths.mat4.create()
  projective[3] = 1
  expect(() =>
    resolveReferencePlanes(p.transforms.transform(projective, marker("bad"))),
  ).toThrow("affine")
  expect(() =>
    resolveReferencePlanes(
      p.extrusions.extrudeLinear({ height: 4 }, marker("profile")),
    ),
  ).toThrow("outside extrusion")
  expect(resolveReferencePlanes(marker("only")).geometry).toBeUndefined()
  expect(() => execute(marker("only"))).toThrow("only reference")
})

test("recognizes rectangle components lowered to existing polygon plans", () => {
  const reference = {
    ...p.primitives.polygon({
      points: [
        [-2, -3],
        [2, -3],
        [2, 3],
        [-2, 3],
      ],
    }),
    name: "board",
    reference: true,
  }
  const result = resolveReferencePlanes(
    p.transforms.translate([3, 4, 10], reference),
  )
  expect(result.geometry).toBeUndefined()
  closeVector(result.referencePlanes[0].origin, [3, 4, 10])
  expect(() =>
    resolveReferencePlanes({
      type: "polygon",
      points: [
        [0, 0],
        [1, 0],
        [0, 1],
      ],
      reference: true,
      name: "triangle",
    }),
  ).toThrow("axis-aligned rectangle")
})
