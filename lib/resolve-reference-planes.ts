import { mat4, vec3 } from "gl-matrix"
import {
  assertTransformMatrix,
  toTransformMatrix,
} from "./assert-transform-matrix"
import type {
  JscadOperation,
  Matrix4,
  RectangleOperation,
  PolygonOperation,
  Vector3D,
} from "./jscad-operations-types"

/** A part-local attachment frame. Coordinates retain the plan's units (mm in
 * tscircuit), in right-handed XYZ. origin is a point; normal and xAxis are unit
 * directions. The rectangle starts in XY with outward normal +Z and tangent +X.
 */
export interface NamedReferencePlane {
  name: string
  origin: Vector3D
  normal: Vector3D
  xAxis: Vector3D
}

const identity = (): Matrix4 => toTransformMatrix(mat4.create())

function transformMatrix(operation: JscadOperation): Matrix4 {
  const result = identity()
  switch (operation.type) {
    case "transform":
      assertTransformMatrix(operation.matrix)
      return [...operation.matrix]
    case "translate":
      return toTransformMatrix(mat4.fromTranslation(result, operation.vector))
    case "scale":
      return toTransformMatrix(mat4.fromScaling(result, operation.factors))
    case "rotate": {
      // JSCAD rotate([x,y,z]) applies X, then Y, then Z: Rz * Ry * Rx.
      mat4.rotateZ(result, result, operation.angles[2])
      mat4.rotateY(result, result, operation.angles[1])
      mat4.rotateX(result, result, operation.angles[0])
      return result
    }
    case "rotateX":
      return toTransformMatrix(mat4.fromXRotation(result, operation.angle))
    case "rotateY":
      return toTransformMatrix(mat4.fromYRotation(result, operation.angle))
    case "rotateZ":
      return toTransformMatrix(mat4.fromZRotation(result, operation.angle))
    default:
      throw new Error(`Cannot use ${operation.type} as a reference transform`)
  }
}

function getReferencePlane(
  rectangle: RectangleOperation | PolygonOperation,
  transforms: JscadOperation[],
): NamedReferencePlane {
  const name = rectangle.name
  if (!name?.trim())
    throw new Error("Reference rectangles require a nonblank name")
  let center: number[]
  if (rectangle.type === "rectangle") {
    if (
      rectangle.size.length !== 2 ||
      !rectangle.size.every((n) => Number.isFinite(n) && n > 0)
    ) {
      throw new Error(
        `Reference rectangle "${name}" requires two positive finite dimensions`,
      )
    }
    center = rectangle.center ?? [0, 0]
  } else {
    // Rectangle components may lower to standard polygon operations. Preserve
    // the local XY frame; the marker's bounds center is its attachment point.
    const points = rectangle.points
    if (
      rectangle.paths ||
      points.length !== 4 ||
      !points.every(
        (p) =>
          p.length === 2 &&
          p.every((n) => typeof n === "number" && Number.isFinite(n)),
      )
    ) {
      throw new Error(
        `Reference polygon "${name}" must be an axis-aligned rectangle`,
      )
    }
    const corners = points as [number, number][]
    const xs = [...new Set(corners.map((p) => p[0]))]
    const ys = [...new Set(corners.map((p) => p[1]))]
    if (
      xs.length !== 2 ||
      ys.length !== 2 ||
      new Set(corners.map((p) => JSON.stringify(p))).size !== 4
    ) {
      throw new Error(
        `Reference polygon "${name}" must be an axis-aligned rectangle`,
      )
    }
    center = [(xs[0] + xs[1]) / 2, (ys[0] + ys[1]) / 2]
  }
  if (center.length !== 2 || !center.every(Number.isFinite)) {
    throw new Error(`Reference rectangle "${name}" has an invalid center`)
  }
  const matrix = identity()
  for (const transform of transforms) {
    mat4.multiply(matrix, matrix, transformMatrix(transform))
  }
  assertTransformMatrix(matrix)
  if (
    matrix[3] !== 0 ||
    matrix[7] !== 0 ||
    matrix[11] !== 0 ||
    matrix[15] !== 1
  ) {
    throw new Error(`Reference rectangle "${name}" requires affine transforms`)
  }
  const inverse = mat4.invert(identity(), matrix)
  if (!inverse)
    throw new Error(`Reference rectangle "${name}" has a singular transform`)
  const origin: Vector3D = [0, 0, 0]
  vec3.transformMat4(origin, [center[0], center[1], 0], matrix)
  // Directions do not pick up translation. Normals use inverse transpose,
  // including nonuniform scaling/reflections; tangents use the forward matrix.
  const normal: Vector3D = [inverse[2], inverse[6], inverse[10]]
  const xAxis: Vector3D = [matrix[0], matrix[1], matrix[2]]
  if (
    ![...origin, ...normal, ...xAxis].every(Number.isFinite) ||
    !vec3.length(normal) ||
    !vec3.length(xAxis)
  ) {
    throw new Error(`Reference rectangle "${name}" has an invalid frame`)
  }
  vec3.normalize(normal, normal)
  vec3.normalize(xAxis, xAxis)
  return { name, origin, normal, xAxis }
}

/** Extract named reference rectangles before CSG execution, returning a fresh
 * geometry-only plan. Never evaluates geometry or mutates the authored plan.
 * Nested transforms map each marker's local XY frame into the plan-root frame.
 * A root array represents independent solids/markers, as produced by a Fragment.
 */
export function resolveReferencePlanes(
  plan: JscadOperation | JscadOperation[],
) {
  const referencePlanes: NamedReferencePlane[] = []
  const names = new Set<string>()
  function visit(
    operation: JscadOperation,
    transforms: JscadOperation[],
    inProfile = false,
  ): JscadOperation | undefined {
    if (operation.reference) {
      if (operation.type !== "rectangle" && operation.type !== "polygon")
        throw new Error("Only rectangles can be reference geometry")
      if (inProfile)
        throw new Error(
          "Reference rectangles must be outside extrusion and measurement inputs",
        )
      const plane = getReferencePlane(operation, transforms)
      if (names.has(plane.name))
        throw new Error(`Duplicate reference plane "${plane.name}"`)
      names.add(plane.name)
      referencePlanes.push(plane)
      return undefined
    }
    switch (operation.type) {
      case "translate":
      case "rotate":
      case "rotateX":
      case "rotateY":
      case "rotateZ":
      case "scale":
      case "transform": {
        const shape = visit(
          operation.shape,
          [...transforms, operation],
          inProfile,
        )
        return shape ? { ...operation, shape } : undefined
      }
      case "colorize": {
        const shape = visit(operation.shape, transforms, inProfile)
        return shape ? { ...operation, shape } : undefined
      }
      case "extrudeLinear":
      case "extrudeRotate":
      case "measureArea":
      case "measureVolume":
      case "measureBoundingBox": {
        const shape = visit(operation.shape, transforms, true)
        return shape ? { ...operation, shape } : undefined
      }
      case "union":
      case "subtract":
      case "intersect":
      case "hull":
      case "hullChain": {
        const children = operation.shapes.map((shape) =>
          visit(shape, transforms, inProfile),
        )
        if (
          operation.type === "subtract" &&
          operation.shapes.length &&
          !children[0]
        ) {
          throw new Error("A subtraction base cannot be reference geometry")
        }
        const shapes = children.filter(
          (shape): shape is JscadOperation => shape !== undefined,
        )
        if (!shapes.length) return undefined
        if (shapes.length === 1) return shapes[0]
        return { ...operation, shapes }
      }
      default:
        return { ...operation }
    }
  }
  const roots = (Array.isArray(plan) ? plan : [plan])
    .map((operation) => visit(operation, []))
    .filter((operation): operation is JscadOperation => operation !== undefined)
  const geometry: JscadOperation | undefined =
    roots.length > 1 ? { type: "union", shapes: roots } : roots[0]
  return { geometry, referencePlanes }
}
