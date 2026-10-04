/** Serializable appearance settings. Interpreting them belongs to the viewer. */
export interface MaterialOptions {
  /** CSS color, hexadecimal number, or RGB values in the range 0–1. */
  color?: string | number | [number, number, number]
  metalness?: number
  roughness?: number
  opacity?: number
  transparent?: boolean
  emissive?: string | number | [number, number, number]
  emissiveIntensity?: number
  flatShading?: boolean
  wireframe?: boolean
}

export interface MaterialProps {
  material?: MaterialOptions
}

/** Attach appearance metadata without mutating an operation or geometry. */
export function withMaterial<T extends object>(
  shapes: T[],
  material: MaterialOptions,
): Array<T & { material: MaterialOptions }>
export function withMaterial<T extends object>(
  shape: T,
  material: MaterialOptions,
): T & { material: MaterialOptions }
export function withMaterial(shape: object, material: MaterialOptions): object {
  if (Array.isArray(shape)) {
    return shape.map((item) => withMaterial(item, material))
  }
  return {
    ...shape,
    material: {
      ...material,
      ...(Array.isArray(material.color) ? { color: [...material.color] } : {}),
      ...(Array.isArray(material.emissive)
        ? { emissive: [...material.emissive] }
        : {}),
    },
  }
}

/** Carry material metadata through implementations that rebuild geometry. */
export function preserveMaterial<T>(source: MaterialProps, result: T): T {
  if (!source.material) return result
  if (Array.isArray(result)) {
    return result.map((shape) => preserveMaterial(source, shape)) as T
  }
  if (!result || typeof result !== "object") {
    throw new Error("Material metadata requires object geometry")
  }
  return withMaterial(result, source.material)
}
