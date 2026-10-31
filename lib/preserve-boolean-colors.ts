type RgbaColor = number[]

interface Polygon3Like {
  vertices: [number, number, number][]
  plane?: number[]
  color?: RgbaColor
}

interface Geom3Like {
  polygons: Polygon3Like[]
  transforms?: ArrayLike<number>
  color?: RgbaColor
  isRetesselated?: boolean
}

interface FaceBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

interface ColoredSourceFace {
  vertices: [number, number, number][]
  plane: [number, number, number, number]
  color: RgbaColor
  bounds: FaceBounds
  dominantAxis: 0 | 1 | 2
}

const IDENTITY_MATRIX = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

const isGeom3Like = (shape: unknown): shape is Geom3Like =>
  Boolean(
    shape &&
      typeof shape === "object" &&
      Array.isArray((shape as Geom3Like).polygons),
  )

const isIdentityMatrix = (matrix?: ArrayLike<number>): boolean => {
  if (!matrix || matrix.length !== 16) return true
  for (let i = 0; i < 16; i++) {
    if (Math.abs((matrix[i] ?? 0) - IDENTITY_MATRIX[i]!) > 1e-12) return false
  }
  return true
}

const isMirroringMatrix = (matrix?: ArrayLike<number>): boolean => {
  if (!matrix || matrix.length !== 16) return false
  const m0 = matrix[0] ?? 1
  const m1 = matrix[1] ?? 0
  const m2 = matrix[2] ?? 0
  const m4 = matrix[4] ?? 0
  const m5 = matrix[5] ?? 1
  const m6 = matrix[6] ?? 0
  const m8 = matrix[8] ?? 0
  const m9 = matrix[9] ?? 0
  const m10 = matrix[10] ?? 1
  const crossX = m4 * m9 - m8 * m5
  const crossY = m8 * m1 - m0 * m9
  const crossZ = m0 * m5 - m4 * m1
  return crossX * m2 + crossY * m6 + crossZ * m10 < 0
}

const transformPoint = (
  [x, y, z]: [number, number, number],
  matrix?: ArrayLike<number>,
): [number, number, number] => {
  if (!matrix || matrix.length !== 16 || isIdentityMatrix(matrix)) {
    return [x, y, z]
  }
  const weight =
    (matrix[3] ?? 0) * x +
      (matrix[7] ?? 0) * y +
      (matrix[11] ?? 0) * z +
      (matrix[15] ?? 1) || 1
  return [
    ((matrix[0] ?? 1) * x +
      (matrix[4] ?? 0) * y +
      (matrix[8] ?? 0) * z +
      (matrix[12] ?? 0)) /
      weight,
    ((matrix[1] ?? 0) * x +
      (matrix[5] ?? 1) * y +
      (matrix[9] ?? 0) * z +
      (matrix[13] ?? 0)) /
      weight,
    ((matrix[2] ?? 0) * x +
      (matrix[6] ?? 0) * y +
      (matrix[10] ?? 1) * z +
      (matrix[14] ?? 0)) /
      weight,
  ]
}

const computePolygonPlane = (
  vertices: [number, number, number][],
): [number, number, number, number] | undefined => {
  if (vertices.length < 3) return undefined
  let nx = 0
  let ny = 0
  let nz = 0
  for (let i = 0; i < vertices.length; i++) {
    const current = vertices[i]!
    const next = vertices[(i + 1) % vertices.length]!
    nx += (current[1] - next[1]) * (current[2] + next[2])
    ny += (current[2] - next[2]) * (current[0] + next[0])
    nz += (current[0] - next[0]) * (current[1] + next[1])
  }
  const length = Math.hypot(nx, ny, nz)
  if (length <= 1e-12) return undefined
  const unitX = nx / length
  const unitY = ny / length
  const unitZ = nz / length
  const first = vertices[0]!
  const offset = unitX * first[0] + unitY * first[1] + unitZ * first[2]
  return [unitX, unitY, unitZ, offset]
}

const computePolygonCentroid = (
  vertices: [number, number, number][],
): [number, number, number] => {
  let sumX = 0
  let sumY = 0
  let sumZ = 0
  for (const [x, y, z] of vertices) {
    sumX += x
    sumY += y
    sumZ += z
  }
  const count = vertices.length || 1
  return [sumX / count, sumY / count, sumZ / count]
}

const computeFaceBounds = (
  vertices: [number, number, number][],
): FaceBounds => {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY
  for (const [x, y, z] of vertices) {
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
    if (z < minZ) minZ = z
    if (z > maxZ) maxZ = z
  }
  return { minX, maxX, minY, maxY, minZ, maxZ }
}

const getDominantAxis = (
  plane: [number, number, number, number],
): 0 | 1 | 2 => {
  const absX = Math.abs(plane[0])
  const absY = Math.abs(plane[1])
  const absZ = Math.abs(plane[2])
  if (absX >= absY && absX >= absZ) return 0
  if (absY >= absZ) return 1
  return 2
}

const extractColoredSourceFaces = (params: {
  shapes: unknown[]
  invertToolNormals?: boolean
}): ColoredSourceFace[] => {
  const faces: ColoredSourceFace[] = []
  for (let shapeIndex = 0; shapeIndex < params.shapes.length; shapeIndex++) {
    const shape = params.shapes[shapeIndex]
    if (!isGeom3Like(shape)) continue
    const mirrored = isMirroringMatrix(shape.transforms)
    const flipNormal = Boolean(params.invertToolNormals && shapeIndex > 0)
    const shouldReverse = mirrored !== flipNormal
    for (const polygon of shape.polygons) {
      const color = polygon.color ?? shape.color
      if (!Array.isArray(color) || !Array.isArray(polygon.vertices)) continue
      const worldVertices = polygon.vertices.map((vertex) =>
        transformPoint(vertex, shape.transforms),
      )
      if (shouldReverse) worldVertices.reverse()
      const plane = computePolygonPlane(worldVertices)
      if (!plane) continue
      faces.push({
        vertices: worldVertices,
        plane,
        color: [...color],
        bounds: computeFaceBounds(worldVertices),
        dominantAxis: getDominantAxis(plane),
      })
    }
  }
  return faces
}

const projectPoint2D = (
  point: [number, number, number],
  dominantAxis: 0 | 1 | 2,
): [number, number] => {
  if (dominantAxis === 0) return [point[1], point[2]]
  if (dominantAxis === 1) return [point[0], point[2]]
  return [point[0], point[1]]
}

const isPointInProjectedPolygon = (
  point: [number, number, number],
  face: ColoredSourceFace,
): boolean => {
  const [px, py] = projectPoint2D(point, face.dominantAxis)
  let inside = false
  const count = face.vertices.length
  for (let i = 0, j = count - 1; i < count; j = i++) {
    const [xi, yi] = projectPoint2D(face.vertices[i]!, face.dominantAxis)
    const [xj, yj] = projectPoint2D(face.vertices[j]!, face.dominantAxis)
    const dx = xj - xi
    const dy = yj - yi
    const segLenSq = dx * dx + dy * dy
    const t =
      segLenSq > 0
        ? Math.max(0, Math.min(1, ((px - xi) * dx + (py - yi) * dy) / segLenSq))
        : 0
    if (Math.hypot(px - (xi + t * dx), py - (yi + t * dy)) <= 1e-4) {
      return true
    }
    const intersects =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }
  return inside
}

const distanceSquaredToBounds = (
  [x, y, z]: [number, number, number],
  bounds: FaceBounds,
): number => {
  const dx =
    x < bounds.minX ? bounds.minX - x : x > bounds.maxX ? x - bounds.maxX : 0
  const dy =
    y < bounds.minY ? bounds.minY - y : y > bounds.maxY ? y - bounds.maxY : 0
  const dz =
    z < bounds.minZ ? bounds.minZ - z : z > bounds.maxZ ? z - bounds.maxZ : 0
  return dx * dx + dy * dy + dz * dz
}

const findMatchingFaceColor = (
  polygon: Polygon3Like,
  sourceFaces: ColoredSourceFace[],
): RgbaColor | undefined => {
  if (!Array.isArray(polygon.vertices)) return undefined
  const plane = computePolygonPlane(polygon.vertices)
  if (!plane) return undefined
  const centroid = computePolygonCentroid(polygon.vertices)
  let bestFallbackColor: RgbaColor | undefined
  let bestFallbackDistance = Number.POSITIVE_INFINITY

  for (const face of sourceFaces) {
    const normalDot =
      plane[0] * face.plane[0] +
      plane[1] * face.plane[1] +
      plane[2] * face.plane[2]
    if (normalDot < 1 - 1e-4) continue
    if (Math.abs(plane[3] - face.plane[3]) > 1e-3) continue

    const boundsDistSq = distanceSquaredToBounds(centroid, face.bounds)
    if (boundsDistSq <= 1e-6 && isPointInProjectedPolygon(centroid, face)) {
      return [...face.color]
    }
    if (boundsDistSq < bestFallbackDistance) {
      bestFallbackDistance = boundsDistSq
      bestFallbackColor = face.color
    }
  }

  return bestFallbackColor ? [...bestFallbackColor] : undefined
}

export const preserveBooleanColors = <T>(params: {
  shapes: unknown[]
  result: T
  invertToolNormals?: boolean
}): T => {
  if (!isGeom3Like(params.result)) return params.result
  const sourceFaces = extractColoredSourceFaces({
    shapes: params.shapes,
    invertToolNormals: params.invertToolNormals,
  })
  if (sourceFaces.length === 0) return params.result

  let hasColoredPolygon = false
  const polygons = params.result.polygons.map((polygon) => {
    const color = Array.isArray(polygon.color)
      ? [...polygon.color]
      : findMatchingFaceColor(polygon, sourceFaces)
    if (!color) return polygon
    hasColoredPolygon = true
    return { ...polygon, color }
  })

  if (!hasColoredPolygon) return params.result
  return {
    ...params.result,
    polygons,
  }
}

export const bakeTransformsWithPolygonColors = <T>(
  shape: unknown,
  transformed: T,
): T => {
  if (!isGeom3Like(shape) || !isGeom3Like(transformed)) return transformed
  if (!shape.polygons.some((polygon) => Array.isArray(polygon.color))) {
    return transformed
  }
  if (isIdentityMatrix(transformed.transforms)) return transformed

  const mirrored = isMirroringMatrix(transformed.transforms)
  const polygons = transformed.polygons.map((polygon) => {
    const vertices = polygon.vertices.map((vertex) =>
      transformPoint(vertex, transformed.transforms),
    )
    if (mirrored) vertices.reverse()
    const nextPolygon: Polygon3Like = {
      ...polygon,
      vertices,
      ...(Array.isArray(polygon.color) ? { color: [...polygon.color] } : {}),
    }
    if (polygon.plane) {
      const plane = computePolygonPlane(vertices)
      if (plane) nextPolygon.plane = plane
    }
    return nextPolygon
  })

  return {
    ...transformed,
    polygons,
    transforms: [...IDENTITY_MATRIX],
  }
}
