import { resolveReferencePlanes } from "./resolve-reference-planes"
import { assertTransformMatrix } from "./assert-transform-matrix"
import { preserveMaterial } from "./material"
import type { JscadImplementation } from "./jscad-implementation-types"
import type {
  CubeOperation,
  CylinderOperation,
  JscadOperation,
  SphereOperation,
  PolygonOperation,
  CuboidOperation,
  RoundedCuboidOperation,
} from "./jscad-operations-types"

export const executeJscadOperations = <ShapeOrOp = any, MeasurementT = number>(
  jscad: JscadImplementation<ShapeOrOp, MeasurementT>,
  operation: JscadOperation,
): any => {
  if (Array.isArray(operation) && operation.length === 1) {
    return executeJscadOperations(jscad, operation[0])
  }
  if (Array.isArray(operation)) {
    throw new Error(
      `executeJscadOperations currently doesn't support Array<JscadOperation>, try adding a root union or or executing each element individually`,
    )
  }
  const { geometry } = resolveReferencePlanes(operation)
  if (!geometry) throw new Error("JSCAD plan contains only reference geometry")
  return executeGeometry(jscad, geometry)
}

const executeGeometry = <ShapeOrOp, MeasurementT>(
  jscad: JscadImplementation<ShapeOrOp, MeasurementT>,
  operation: JscadOperation,
): any => {
  const result = evaluateOperation(jscad, operation)
  // Measurements and unit conversions have no geometry to carry appearance.
  switch (operation.type) {
    case "measureBoundingBox":
    case "measureArea":
    case "measureVolume":
    case "degToRad":
    case "radToDeg":
      return result
    default:
      return preserveMaterial(operation, result)
  }
}

const evaluateOperation = <ShapeOrOp, MeasurementT>(
  jscad: JscadImplementation<ShapeOrOp, MeasurementT>,
  operation: JscadOperation,
): any => {
  const recurse = (op: JscadOperation) => executeGeometry(jscad, op)
  const transformShape = (
    operation: JscadOperation,
    transform: (shape: ShapeOrOp) => ShapeOrOp,
  ) => {
    const shape = recurse(operation)
    return preserveMaterial(shape, transform(shape))
  }
  const combineShapes = (
    shapes: JscadOperation[],
    combine: (...shapes: ShapeOrOp[]) => ShapeOrOp,
  ) => {
    const result = combine(...shapes.map(recurse))
    // An adapter may copy metadata from its first operand. A combined solid
    // must use the operation's explicit material, not an arbitrary operand's.
    if (result && typeof result === "object" && "material" in result) {
      const { material, ...geometry } = result
      return geometry
    }
    return result
  }

  // Material metadata is handled here, not passed as a modeling option.
  const { type, material, ...params } = operation

  switch (type) {
    case "rectangle":
      if (!jscad.primitives.rectangle)
        throw new Error("JSCAD adapter does not support primitives.rectangle")
      return jscad.primitives.rectangle({
        size: operation.size,
        center: operation.center ?? [0, 0],
      })
    case "intersect":
      return combineShapes(operation.shapes, (...shapes) =>
        jscad.booleans.intersect(...shapes),
      )
    case "subtract": {
      const shapes = operation.shapes.map(recurse)
      return preserveMaterial(
        shapes[0] ?? {},
        jscad.booleans.subtract(...shapes),
      )
    }
    case "union":
      return combineShapes(operation.shapes, (...shapes) =>
        jscad.booleans.union(...shapes),
      )
    case "hull":
      return combineShapes(operation.shapes, (...shapes) =>
        jscad.hulls.hull(...shapes),
      )
    case "hullChain":
      return combineShapes(operation.shapes, (...shapes) =>
        jscad.hulls.hullChain(...shapes),
      )
    case "colorize":
      return transformShape(operation.shape, (shape) =>
        jscad.colors.colorize(operation.color, shape),
      )
    case "cube":
      return jscad.primitives.cube(params as CubeOperation)
    case "sphere":
      return jscad.primitives.sphere(params as SphereOperation)
    case "cylinder":
      return jscad.primitives.cylinder(params as CylinderOperation)
    case "polygon":
      return jscad.primitives.polygon(params as PolygonOperation)
    case "cuboid":
      return jscad.primitives.cuboid(params as CuboidOperation)
    case "roundedCuboid":
      return jscad.primitives.roundedCuboid(params as RoundedCuboidOperation)
    case "transform":
      assertTransformMatrix(operation.matrix)
      if (!jscad.transforms.transform) {
        throw new Error(
          'Cannot execute "transform" operation: this JSCAD adapter does not support transforms.transform',
        )
      }
      return transformShape(operation.shape, (shape) =>
        jscad.transforms.transform!(operation.matrix, shape),
      )
    case "rotate":
      return transformShape(operation.shape, (shape) =>
        jscad.transforms.rotate(operation.angles, shape),
      )
    case "rotateX":
      return transformShape(operation.shape, (shape) =>
        jscad.transforms.rotateX(operation.angle, shape),
      )
    case "rotateY":
      return transformShape(operation.shape, (shape) =>
        jscad.transforms.rotateY(operation.angle, shape),
      )
    case "rotateZ":
      return transformShape(operation.shape, (shape) =>
        jscad.transforms.rotateZ(operation.angle, shape),
      )
    case "scale":
      return transformShape(operation.shape, (shape) =>
        jscad.transforms.scale(operation.factors, shape),
      )
    case "translate":
      return transformShape(operation.shape, (shape) =>
        jscad.transforms.translate(operation.vector, shape),
      )
    case "extrudeLinear":
      return transformShape(operation.shape, (shape) =>
        jscad.extrusions.extrudeLinear(operation.options, shape),
      )
    case "extrudeRotate":
      return transformShape(operation.shape, (shape) =>
        jscad.extrusions.extrudeRotate(operation.options, shape),
      )
    case "createGeom2":
      return jscad.geometries.geom2.create(operation.points)
    case "fromPointsGeom2":
      return jscad.geometries.geom2.fromPoints(operation.points)
    case "createGeom3":
      return jscad.geometries.geom3.create(operation.polygons)
    case "createPath2":
      return jscad.geometries.path2.create(operation.points)
    case "measureBoundingBox":
      return jscad.measurements.measureBoundingBox(recurse(operation.shape))
    case "measureArea":
      return jscad.measurements.measureArea(recurse(operation.shape))
    case "measureVolume":
      return jscad.measurements.measureVolume(recurse(operation.shape))
    case "degToRad":
      return jscad.utils.degToRad(operation.degrees)
    case "radToDeg":
      return jscad.utils.radToDeg(operation.radians)
    default:
      if ((operation as any).type === undefined) {
        throw new Error(
          `Operation type is undefined. This usually means the operation object is malformed or not properly initialized. Operation: ${JSON.stringify(operation, null, 2).slice(0, 200)}...`,
        )
      }
      throw new Error(
        `Unsupported operation type: ${(operation as any).type}. Operation: ${JSON.stringify(operation, null, 2)}`,
      )
  }
}
