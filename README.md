# jscad-planner

jscad-planner is a TypeScript library that allows you to serialize JSCAD operations into a JSON plan, which can be executed later. This is particularly useful for storing JSCAD operations and executing them on demand.

## Features

- Serialize complex JSCAD operations into JSON
- Execute serialized operations using a JSCAD implementation

## Installation

You can install jscad-planner using npm or yarn:

```bash
npm install jscad-planner
```

## Usage

Here's a basic example of how to use jscad-planner:

```typescript
import { jscadPlanner, executeJscadOperations } from "jscad-planner"
import jscad from "@jscad/modeling"

// Create a JSCAD plan
const plan = jscadPlanner.booleans.intersect(
  jscadPlanner.primitives.cube({ size: 10, center: [10, 0, 0] }),
  jscadPlanner.primitives.sphere({ radius: 10, center: [0, 0, 0] })
)

// The plan can be serialized to JSON and stored if needed
const serializedPlan = JSON.stringify(plan)

// Later, the plan can be deserialized and executed
const deserializedPlan = JSON.parse(serializedPlan)
const myUnionObject = executeJscadOperations(jscad, deserializedPlan)
// myUnionObject is now a JSCAD object representing the union of the two shapes
```

## API Reference

### jscadPlanner

The `jscadPlanner` object provides all the methods to create JSCAD operations that `jscad` has. It includes:

- `booleans`: Methods for boolean operations (union, subtract, intersect)
- `colors`: Methods for colorizing shapes
- `primitives`: Methods for creating primitive shapes (cube, sphere, cylinder)
- `transforms`: Methods for transforming shapes (transform, rotate, scale, translate)
- `extrusions`: Methods for extruding shapes
- `geometries`: Methods for creating custom geometries
- `measurements`: Methods for measuring shapes
- `utils`: Utility methods (degree/radian conversion)

### Matrix transforms

`jscadPlanner.transforms.transform(matrix, shape)` creates a serializable
`{ type: "transform", matrix, shape }` operation. `matrix` is a `Matrix4` tuple
of exactly 16 finite numbers in **column-major** order, matching JSCAD's mat4
convention (translation occupies indices 12, 13, and 14). The planner and
interpreter reject malformed matrices. Use a plain array, not a typed array,
so the plan can round-trip through JSON.

```typescript
const { mat4 } = jscad.maths
const rotation = mat4.fromRotation(mat4.create(), Math.PI / 3, [1, 2, 3])
const translation = mat4.fromTranslation(mat4.create(), [10, 20, 30])
const matrix = mat4.multiply(mat4.create(), translation, rotation)
const plan = jscadPlanner.transforms.transform(
  matrix,
  jscadPlanner.primitives.cuboid({ size: [2, 4, 6] }),
)
```

This applies rotation first, then translation. Nested transforms execute from
the innermost shape outward. The interpreter forwards the matrix unchanged to
`jscad.transforms.transform`; it does not decompose rotations or convert
coordinate frames. Both 3D solids and 2D geometries are supported by JSCAD.
Existing `rotate`, `rotateX/Y/Z`, `scale`, and `translate` APIs are unchanged.
`transforms.transform` is optional on custom `JscadImplementation` adapters.
Adapters without it can still execute legacy operations, including the existing
rotation, scale, and translation operations. Executing a `transform` operation
on such an adapter throws an explicit capability error before executing its
child shape; matrices are not lowered into legacy operations. Adapters that
provide the method receive the matrix unchanged. The concrete `jscadPlanner`
export always provides a callable `transforms.transform` method.

Use this operation when a placement matrix is already known, for example a
part-local to assembly-local placement. Its source and destination frames belong
to the caller; the planner does not infer them from the geometry. Nested
rotate/translate/scale operations remain useful for constructing solids and are
not replaced or automatically flattened. This API does not add matrix metadata
to those existing operations.

Plans containing `transform` require a matrix-capable interpreter. Older planner
versions reject the new operation even when their native JSCAD implementation
supports matrices. Update readers before emitting matrix operations to them.

`toTransformMatrix(matrix: ArrayLike<number>): Matrix4` validates and copies
numeric arrays, `Float32Array`, or `Float64Array` into a fresh serializable
tuple. It preserves every numeric entry without rounding or reordering:

```typescript
import { toTransformMatrix } from "jscad-planner"

const plan = jscadPlanner.transforms.transform(
  toTransformMatrix(externalMat4),
  shape,
)
```

For numeric arrays or a copied `Float32Array` (such as gl-matrix's default
`mat4`), `assertTransformMatrix` validates and narrows the array to `Matrix4`
without a type assertion:

```typescript
import { assertTransformMatrix, type TransformOperation } from "jscad-planner"

const matrix = [...externalMat4]
assertTransformMatrix(matrix)
const plan: TransformOperation = { type: "transform", matrix, shape }
```

### Custom 3D geometry

`jscadPlanner.geometries.geom3.create(polygons)` accepts `JscadPolygon3[]`,
matching the polygon objects returned by `jscad.geometries.geom3.toPolygons`.
Each polygon contains `vertices: Vector3D[]` and may include RGB/RGBA `color`
and a four-number `plane`. Raw vertex arrays are not polygon objects; use
`jscad.geometries.poly3.create(vertices)` to construct them. The plan preserves
these serializable polygon objects unchanged, including when nested in a
matrix transform.

### executeJscadOperations

This function takes a JSCAD implementation and a serialized operation, and executes it.

```typescript
executeJscadOperations(jscad, operation)
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details.

## Acknowledgments

- This project is designed to work with [JSCAD](https://github.com/jscad/OpenJSCAD.org), an open-source project for programmatic 3D modeling.
