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
  const recurse = (op: JscadOperation) => executeJscadOperations(jscad, op)

  const { type, ...params } = operation

  switch (type) {
    case "intersect":
      return jscad.booleans.intersect(...operation.shapes.map(recurse))
    case "subtract":
      return jscad.booleans.subtract(...operation.shapes.map(recurse))
    case "union":
      return jscad.booleans.union(...operation.shapes.map(recurse))
    case "colorize":
      return jscad.colors.colorize(operation.color, recurse(operation.shape))
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
    case "rotate":
      return jscad.transforms.rotate(operation.angles, recurse(operation.shape))
    case "scale":
      return jscad.transforms.scale(operation.factors, recurse(operation.shape))
    case "translate":
      return jscad.transforms.translate(
        operation.vector,
        recurse(operation.shape),
      )
    case "extrudeLinear":
      return jscad.extrusions.extrudeLinear(
        operation.options,
        recurse(operation.shape),
      )
    case "extrudeRotate":
      return jscad.extrusions.extrudeRotate(
        operation.options,
        recurse(operation.shape),
      )
    case "createGeom2":
      return jscad.geometries.geom2.create(operation.points)
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
