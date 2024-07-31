import type { JscadImplementation } from "./jscad-implementation-types"
import type { JscadOperation } from "./jscad-operations-types"

export const executeJscadOperations = (
  jscad: JscadImplementation,
  operation: JscadOperation,
) => {
  const recurse = (op: JscadOperation) => executeJscadOperations(jscad, op)

  switch (operation.type) {
    case "intersect":
      return jscad.booleans.intersect(...operation.shapes.map(recurse))
    case "subtract":
      return jscad.booleans.subtract(...operation.shapes.map(recurse))
    case "union":
      return jscad.booleans.union(...operation.shapes.map(recurse))
    case "colorize":
      return jscad.colors.colorize(operation.color, recurse(operation.shape))
    case "cube":
      return jscad.primitives.cube({ size: operation.size })
    case "sphere":
      return jscad.primitives.sphere({ radius: operation.radius })
    case "cylinder":
      return jscad.primitives.cylinder({
        radius: operation.radius,
        height: operation.height,
        center: operation.center,
        resolution: operation.resolution,
      })
    case "rotate":
      return jscad.transformations.rotate(
        operation.angles,
        recurse(operation.shape),
      )
    case "scale":
      return jscad.transformations.scale(
        operation.factors,
        recurse(operation.shape),
      )
    case "translate":
      return jscad.transformations.translate(
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
      throw new Error(`Unsupported operation type: ${(operation as any).type}`)
  }
}
