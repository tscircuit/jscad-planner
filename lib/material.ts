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
function applyMaterial<T extends object>(
  material: MaterialOptions,
  shapes: T[],
): Array<T & { material: MaterialOptions }>
function applyMaterial<T extends object>(
  material: MaterialOptions,
  shape: T,
): T & { material: MaterialOptions }
function applyMaterial(material: MaterialOptions, shape: object): object {
  if (Array.isArray(shape)) {
    return shape.map((item) => applyMaterial(material, item))
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
  return applyMaterial(source.material, result)
}

/** Native material implementation for object geometry and geometry arrays. */
export const materials = { applyMaterial }
