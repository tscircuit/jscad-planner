import type { Color, Vector2D, Vector3D } from "./jscad-operations-types"

export interface JscadImplementation<ShapeOrOp = any, MeasurementT = number> {
  booleans: {
    intersect: (...geometries: ShapeOrOp[]) => ShapeOrOp
    subtract: (...geometries: ShapeOrOp[]) => ShapeOrOp
    union: (...geometries: ShapeOrOp[]) => ShapeOrOp
  }
  colors: {
    colorize: (color: Color, ...geometries: ShapeOrOp[]) => ShapeOrOp
  }
  primitives: {
    cube: (options?: {
      size?: number | number[]
      center?: Vector3D
    }) => ShapeOrOp
    sphere: (options?: {
      radius?: number
      center?: Vector3D
      resolution?: number
    }) => ShapeOrOp
    cylinder: (options?: {
      radius?: number
      height?: number
      center?: Vector3D
      resolution?: number
    }) => ShapeOrOp
    polygon: (options: {
      points: Vector2D[] | Vector2D[][]
      paths?: number[] | number[][]
    }) => ShapeOrOp
    cuboid: (options: { size: [number, number, number] }) => ShapeOrOp
  }
  transformations: {
    rotate: (angles: number[], geometry: ShapeOrOp) => ShapeOrOp
    scale: (factors: number[], geometry: ShapeOrOp) => ShapeOrOp
    translate: (vector: number[], geometry: ShapeOrOp) => ShapeOrOp
  }
  extrusions: {
    extrudeLinear: (
      options: {
        height: number
        twistAngle?: number
        twistSteps?: number
      },
      geometry: ShapeOrOp,
    ) => ShapeOrOp
    extrudeRotate: (
      options: {
        angle?: number
        startAngle?: number
        segments?: number
      },
      geometry: ShapeOrOp,
    ) => ShapeOrOp
  }
  maths: {
    vec2: {
      create: (x: number, y: number) => number[]
      fromValues: (x: number, y: number) => number[]
    }
    vec3: {
      create: (x: number, y: number, z: number) => number[]
      fromValues: (x: number, y: number, z: number) => number[]
    }
  }
  geometries: {
    geom2: {
      create: (points: Vector2D[]) => ShapeOrOp
    }
    geom3: {
      create: (polygons: Vector3D[][]) => ShapeOrOp
    }
    path2: {
      create: (points: Vector2D[]) => ShapeOrOp
    }
  }
  measurements: {
    measureBoundingBox: (
      geometry: ShapeOrOp,
    ) => MeasurementT extends number ? number[][] : MeasurementT
    measureArea: (geometry: ShapeOrOp) => MeasurementT
    measureVolume: (geometry: ShapeOrOp) => MeasurementT
  }
  utils: {
    degToRad: (degrees: number) => number
    radToDeg: (radians: number) => number
  }
}
