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
  jscadPlanner.primitives.cube({ size: 10, center: [0, 0, 0] }),
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
- `transformations`: Methods for transforming shapes (rotate, scale, translate)
- `extrusions`: Methods for extruding shapes
- `geometries`: Methods for creating custom geometries
- `measurements`: Methods for measuring shapes
- `utils`: Utility methods (degree/radian conversion)

### executeJscadOperations

This function takes a JSCAD implementation and a serialized operation, and executes it.

```typescript
executeJscadOperations(jscad, operation)
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details.

## Acknowledgments

- This project is designed to work with [JSCAD](https://github.com/jscad/OpenJSCAD.org), an open-source project for programmatic 3D modeling.
