// OLD use zod instead

// Type definitions
export type Color = [number, number, number]

export interface OperationBase {
  type: string
}

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

export interface ColorizeOperation extends OperationBase {
  type: "colorize"
  color: Color
  shape: JscadOperation
}

export interface CubeOperation extends OperationBase {
  type: "cube"
  size: number
}

export interface SphereOperation extends OperationBase {
  type: "sphere"
  radius: number
}

type JscadOperation =
  | IntersectOperation
  | SubtractOperation
  | UnionOperation
  | ColorizeOperation
  | CubeOperation
  | SphereOperation
