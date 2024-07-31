export interface JscadImplementation {
  booleans: {
    intersect: (...geometries: any[]) => any
    subtract: (...geometries: any[]) => any
    union: (...geometries: any[]) => any
  }
  colors: {
    colorize: (color: any, ...geometries: any[]) => any
  }
  primitives: {
    cube: (options?: { size?: number | number[]; center?: boolean }) => any
    sphere: (options?: {
      radius?: number
      center?: boolean
      resolution?: number
    }) => any
    cylinder: (options?: {
      radius?: number
      height?: number
      center?: boolean
      resolution?: number
    }) => any
  }
  transformations: {
    rotate: (angles: number[], geometry: any) => any
    scale: (factors: number[], geometry: any) => any
    translate: (vector: number[], geometry: any) => any
  }
  extrusions: {
    extrudeLinear: (options: any, geometry: any) => any
    extrudeRotate: (options: any, geometry: any) => any
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
      create: (points: number[][]) => any
    }
    geom3: {
      create: (polygons: any[]) => any
    }
    path2: {
      create: (points: number[][]) => any
    }
  }
  measurements: {
    measureBoundingBox: (geometry: any) => number[][]
    measureArea: (geometry: any) => number
    measureVolume: (geometry: any) => number
  }
  utils: {
    degToRad: (degrees: number) => number
    radToDeg: (radians: number) => number
  }
}
