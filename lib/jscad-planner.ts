import type { JscadImplementation } from "./jscad-implementation-types"
import type {
  JscadOperation,
  Color,
  Vector2D,
  Vector3D,
} from "./jscad-operations-types"

export const jscadPlanner: JscadImplementation<JscadOperation, JscadOperation> =
  {
    booleans: {
      intersect: (...shapes: JscadOperation[]): JscadOperation => ({
        type: "intersect",
        shapes,
      }),
      subtract: (...shapes: JscadOperation[]): JscadOperation => ({
        type: "subtract",
        shapes,
      }),
      union: (...shapes: JscadOperation[]): JscadOperation => ({
        type: "union",
        shapes,
      }),
    },
    hulls: {
      hull: (...shapes: JscadOperation[]): JscadOperation => ({
        type: "hull",
        shapes,
      }),
      hullChain: (...shapes: JscadOperation[]): JscadOperation => ({
        type: "hullChain",
        shapes,
      }),
    },
    colors: {
      colorize: (color: Color, shape: JscadOperation): JscadOperation => ({
        type: "colorize",
        color,
        shape,
      }),
    },
    primitives: {
      cube: (options?: {
        size?: number | number[]
        center?: Vector3D
      }): JscadOperation => ({
        type: "cube",
        ...options,
      }),
      sphere: (options?: {
        radius?: number
        center?: Vector3D
        resolution?: number
      }): JscadOperation => ({
        type: "sphere",
        ...options,
      }),
      cylinder: (options?: {
        radius?: number
        height?: number
        center?: Vector3D
        resolution?: number
      }): JscadOperation => ({
        type: "cylinder",
        ...options,
      }),
      polygon: (options: {
        points: Vector2D[] | Vector2D[][]
        paths?: number[] | number[][]
      }): JscadOperation => ({
        type: "polygon" as const,
        ...options,
      }),
      cuboid: (options: { size: [number, number, number] }): JscadOperation => ({
        type: "cuboid",
        ...options,
      }),
      roundedCuboid: (options: {
        size: [number, number, number]
        roundRadius: number
        segments?: number
      }): JscadOperation => ({
        type: "roundedCuboid",
        ...options,
      }),
    },
    transforms: {
      rotate: (angles: number[], shape: JscadOperation): JscadOperation => ({
        type: "rotate",
        angles,
        shape,
      }),
      scale: (factors: number[], shape: JscadOperation): JscadOperation => ({
        type: "scale",
        factors,
        shape,
      }),
      translate: (vector: number[], shape: JscadOperation): JscadOperation => ({
        type: "translate",
        vector,
        shape,
      }),
    },
    extrusions: {
      extrudeLinear: (options: any, shape: JscadOperation): JscadOperation => ({
        type: "extrudeLinear",
        options,
        shape,
      }),
      extrudeRotate: (options: any, shape: JscadOperation): JscadOperation => ({
        type: "extrudeRotate",
        options,
        shape,
      }),
    },
    maths: {
      vec2: {
        create: (x: number, y: number): Vector2D => [x, y],
        fromValues: (x: number, y: number): Vector2D => [x, y],
      },
      vec3: {
        create: (x: number, y: number, z: number): Vector3D => [x, y, z],
        fromValues: (x: number, y: number, z: number): Vector3D => [x, y, z],
      },
    },
    geometries: {
      geom2: {
        create: (points: Vector2D[]): JscadOperation => ({
          type: "createGeom2",
          points,
        }),
      },
      geom3: {
        create: (polygons: any[]): JscadOperation => ({
          type: "createGeom3",
          polygons,
        }),
      },
      path2: {
        create: (points: Vector2D[]): JscadOperation => ({
          type: "createPath2",
          points,
        }),
      },
    },

    measurements: {
      measureBoundingBox: (shape: JscadOperation): JscadOperation => ({
        type: "measureBoundingBox",
        shape,
      }),
      measureArea: (shape: JscadOperation): JscadOperation => ({
        type: "measureArea",
        shape,
      }),
      measureVolume: (shape: JscadOperation): JscadOperation => ({
        type: "measureVolume",
        shape,
      }),
    },
    utils: {
      degToRad: (degrees: number) => (degrees * Math.PI) / 180,
      radToDeg: (radians: number) => (radians * 180) / Math.PI,
    },
  }
