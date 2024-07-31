import type { Color, Vector2D } from "./jscad-operations-types"

export interface JscadImplementation<ShapeOrOp = any> {
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
      center?: boolean
    }) => ShapeOrOp
    sphere: (options?: {
      radius?: number
      center?: boolean
      resolution?: number
    }) => ShapeOrOp
    cylinder: (options?: {
      radius?: number
      height?: number
      center?: boolean
      resolution?: number
    }) => ShapeOrOp
  }
  transformations: {
    rotate: (angles: number[], geometry: ShapeOrOp) => ShapeOrOp
    scale: (factors: number[], geometry: ShapeOrOp) => ShapeOrOp
    translate: (vector: number[], geometry: ShapeOrOp) => ShapeOrOp
  }
  extrusions: {
    extrudeLinear: (
      options: {
        // TODO
      },
      geometry: ShapeOrOp,
    ) => ShapeOrOp
    extrudeRotate: (
      options: {
        // TODO
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
      // TODO add proper type
      create: (polygons: any[]) => ShapeOrOp
    }
    path2: {
      create: (points: Vector2D[]) => ShapeOrOp
    }
  }
  // TODO we might support measurements for jscadPlanner in the future,
  // if this returned operations, the operations could be executed with
  // executeJscadOperations
  measurements: {
    measureBoundingBox: (geometry: ShapeOrOp) => number[][]
    measureArea: (geometry: ShapeOrOp) => number
    measureVolume: (geometry: ShapeOrOp) => number
  }
  utils: {
    degToRad: (degrees: number) => number
    radToDeg: (radians: number) => number
  }
}
