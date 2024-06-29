// jscad-planner.ts

// Type definitions
type Color = [number, number, number];

interface OperationBase {
  type: string;
}

interface IntersectOperation extends OperationBase {
  type: 'intersect';
  params: { shapes: JscadOperation[] };
}

interface SubtractOperation extends OperationBase {
  type: 'subtract';
  params: { shapes: JscadOperation[] };
}

interface UnionOperation extends OperationBase {
  type: 'union';
  params: { shapes: JscadOperation[] };
}

interface ColorizeOperation extends OperationBase {
  type: 'colorize';
  params: { color: Color; shape: JscadOperation };
}

interface CubeOperation extends OperationBase {
  type: 'cube';
  params: { size: number };
}

interface SphereOperation extends OperationBase {
  type: 'sphere';
  params: { radius: number };
}

type JscadOperation =
  | IntersectOperation
  | SubtractOperation
  | UnionOperation
  | ColorizeOperation
  | CubeOperation
  | SphereOperation;

// Helper function to create operations
const createOperation = <T extends JscadOperation>(type: T['type'], params: T['params']): T => ({
  type,
  params,
} as T);

// JSCAD Planner
const jscadPlanner = {
  booleans: {
    intersect: (...shapes: JscadOperation[]): IntersectOperation =>
      createOperation('intersect', { shapes }),
    subtract: (...shapes: JscadOperation[]): SubtractOperation =>
      createOperation('subtract', { shapes }),
    union: (...shapes: JscadOperation[]): UnionOperation =>
      createOperation('union', { shapes }),
  },
  colors: {
    colorize: (color: Color, shape: JscadOperation): ColorizeOperation =>
      createOperation('colorize', { color, shape }),
  },
  primitives: {
    cube: (params: { size: number }): CubeOperation =>
      createOperation('cube', params),
    sphere: (params: { radius: number }): SphereOperation =>
      createOperation('sphere', params),
  },
};

// Type for the real JSCAD module
interface RealJscad {
  booleans: {
    intersect: (...shapes: any[]) => any;
    subtract: (...shapes: any[]) => any;
    union: (...shapes: any[]) => any;
  };
  colors: {
    colorize: (color: Color, shape: any) => any;
  };
  primitives: {
    cube: (params: { size: number }) => any;
    sphere: (params: { radius: number }) => any;
  };
}

// Function to execute the planned JSCAD operations
const executePlannedJscad = (plan: JscadOperation | JscadOperation[], jscad: RealJscad): any => {
  const executeOperation = (op: JscadOperation): any => {
    switch (op.type) {
      case 'intersect':
        return jscad.booleans.intersect(...op.params.shapes.map(executeOperation));
      case 'subtract':
        return jscad.booleans.subtract(...op.params.shapes.map(executeOperation));
      case 'union':
        return jscad.booleans.union(...op.params.shapes.map(executeOperation));
      case 'colorize':
        return jscad.colors.colorize(op.params.color, executeOperation(op.params.shape));
      case 'cube':
        return jscad.primitives.cube(op.params);
      case 'sphere':
        return jscad.primitives.sphere(op.params);
      default:
        throw new Error(`Unknown operation: ${(op as JscadOperation).type}`);
    }
  };

  return Array.isArray(plan) ? plan.map(executeOperation) : executeOperation(plan);
};

export { jscadPlanner, executePlannedJscad, JscadOperation, RealJscad };
