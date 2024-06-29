// jscad-planner.js

const createOperation = (type, params) => ({ type, params });

const jscadPlanner = {
  booleans: {
    intersect: (...shapes) => createOperation('intersect', { shapes }),
    subtract: (...shapes) => createOperation('subtract', { shapes }),
    union: (...shapes) => createOperation('union', { shapes }),
  },
  colors: {
    colorize: (color, shape) => createOperation('colorize', { color, shape }),
  },
  primitives: {
    cube: (params) => createOperation('cube', params),
    sphere: (params) => createOperation('sphere', params),
  },
};

const executePlannedJscad = (plan, jscad) => {
  const executeOperation = (op) => {
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
        throw new Error(`Unknown operation: ${op.type}`);
    }
  };

  return Array.isArray(plan) ? plan.map(executeOperation) : executeOperation(plan);
};

module.exports = { jscadPlanner, executePlannedJscad };
