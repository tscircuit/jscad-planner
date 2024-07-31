// Helper function to create operations
const createOperation = <T extends JscadOperation>(
  type: T["type"],
  params: Omit<T, "params">,
): T =>
  ({
    type,
    params,
  }) as T

// JSCAD Planner
const jscadPlanner = {
  booleans: {
    intersect: (...shapes: JscadOperation[]): IntersectOperation =>
      createOperation("intersect", { shapes }),
    subtract: (...shapes: JscadOperation[]): SubtractOperation =>
      createOperation("subtract", { shapes }),
    union: (...shapes: JscadOperation[]): UnionOperation =>
      createOperation("union", { shapes }),
  },
  colors: {
    colorize: (color: Color, shape: JscadOperation): ColorizeOperation =>
      createOperation("colorize", { color, shape }),
  },
  primitives: {
    cube: (params: { size: number }): CubeOperation =>
      createOperation("cube", params),
    sphere: (params: { radius: number }): SphereOperation =>
      createOperation("sphere", params),
  },
}

// Function to execute the planned JSCAD operations
const executePlannedJscad = (
  plan: JscadOperation | JscadOperation[],
  jscad: RealJscad,
): any => {
  const executeOperation = (op: JscadOperation): any => {
    switch (op.type) {
      case "intersect":
        return jscad.booleans.intersect(
          ...op.params.shapes.map(executeOperation),
        )
      case "subtract":
        return jscad.booleans.subtract(
          ...op.params.shapes.map(executeOperation),
        )
      case "union":
        return jscad.booleans.union(...op.params.shapes.map(executeOperation))
      case "colorize":
        return jscad.colors.colorize(
          op.params.color,
          executeOperation(op.params.shape),
        )
      case "cube":
        return jscad.primitives.cube(op.params)
      case "sphere":
        return jscad.primitives.sphere(op.params)
      default:
        throw new Error(`Unknown operation: ${(op as JscadOperation).type}`)
    }
  }

  return Array.isArray(plan)
    ? plan.map(executeOperation)
    : executeOperation(plan)
}

export { jscadPlanner, executePlannedJscad, JscadOperation, RealJscad }
