// Type definitions
export type Color = [number, number, number]
export type Vector2D = [number, number]
export type Vector3D = [number, number, number]

export interface OperationBase {
  type: string
}

// Boolean operations
export interface IntersectOperation extends OperationBase {
  type: "intersect"
  shapes: JscadOperation[]
}

export interface SubtractOperation extends OperationBase {
  type: "subtract"
  shapes: JscadOperation[]
}

export interface UnionOperation extends OperationBase {
  type: "union"
  shapes: JscadOperation[]
}

// Color operation
export interface ColorizeOperation extends OperationBase {
  type: "colorize"
  color: Color
  shape: JscadOperation
}

// Primitive operations
export interface CubeOperation extends OperationBase {
  type: "cube"
  size?: number | number[]
  center?: boolean
}

export interface SphereOperation extends OperationBase {
  type: "sphere"
  radius?: number
  center?: boolean
  resolution?: number
}

export interface CylinderOperation extends OperationBase {
  type: "cylinder"
  radius?: number
  height?: number
  center?: boolean
  resolution?: number
}

// Transformation operations
export interface RotateOperation extends OperationBase {
  type: "rotate"
  angles: number[]
  shape: JscadOperation
}

export interface ScaleOperation extends OperationBase {
  type: "scale"
  factors: number[]
  shape: JscadOperation
}

export interface TranslateOperation extends OperationBase {
  type: "translate"
  vector: number[]
  shape: JscadOperation
}

// Extrusion operations
export interface ExtrudeLinearOperation extends OperationBase {
  type: "extrudeLinear"
  options: {
    height: number
    twistAngle?: number
    twistSteps?: number
  }
  shape: JscadOperation
}

export interface ExtrudeRotateOperation extends OperationBase {
  type: "extrudeRotate"
  options: {
    angle?: number
    startAngle?: number
    segments?: number
  }
  shape: JscadOperation
}

// Geometry creation operations
export interface CreateGeom2Operation extends OperationBase {
  type: "createGeom2"
  points: Vector2D[]
}

export interface CreateGeom3Operation extends OperationBase {
  type: "createGeom3"
  polygons: any[]
}

export interface CreatePath2Operation extends OperationBase {
  type: "createPath2"
  points: Vector2D[]
}

// Measurement operations
export interface MeasureBoundingBoxOperation extends OperationBase {
  type: "measureBoundingBox"
  shape: JscadOperation
}

export interface MeasureAreaOperation extends OperationBase {
  type: "measureArea"
  shape: JscadOperation
}

export interface MeasureVolumeOperation extends OperationBase {
  type: "measureVolume"
  shape: JscadOperation
}

// Utility operations
export interface DegToRadOperation extends OperationBase {
  type: "degToRad"
  degrees: number
}

export interface RadToDegOperation extends OperationBase {
  type: "radToDeg"
  radians: number
}

export type JscadOperation =
  | IntersectOperation
  | SubtractOperation
  | UnionOperation
  | ColorizeOperation
  | CubeOperation
  | SphereOperation
  | CylinderOperation
  | RotateOperation
  | ScaleOperation
  | TranslateOperation
  | ExtrudeLinearOperation
  | ExtrudeRotateOperation
  | CreateGeom2Operation
  | CreateGeom3Operation
  | CreatePath2Operation
  | MeasureBoundingBoxOperation
  | MeasureAreaOperation
  | MeasureVolumeOperation
  | DegToRadOperation
  | RadToDegOperation
