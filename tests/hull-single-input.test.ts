import { expect, it } from "bun:test"
import jscad from "@jscad/modeling"
import {
  executeJscadOperations,
  jscadPlanner as p,
  resolveReferencePlanes,
  type JscadOperation,
  type Vector2D,
} from "../lib"

const points: Vector2D[] = [
  [0, 0],
  [2, 0],
  [2, 1],
  [1, 1],
  [1, 2],
  [0, 2],
]

const execute = (plan: JscadOperation) => {
  // @ts-expect-error JSCAD overloads differ from the existing adapter interface.
  return executeJscadOperations(jscad, plan)
}

const withReference = (shape: JscadOperation, includeReference: boolean) =>
  p.hulls.hull(
    shape,
    ...(includeReference
      ? [
          p.primitives.rectangle({
            size: [10, 10],
            name: "mount",
            reference: true,
          }),
        ]
      : []),
  )

for (const includeReference of [false, true]) {
  it(`hulls a single concave 2D profile (reference: ${includeReference})`, () => {
    const plan = withReference(
      p.primitives.polygon({ points }),
      includeReference,
    )
    const serialized = JSON.stringify(plan)
    const result = execute(JSON.parse(serialized))
    const expected = jscad.hulls.hull(jscad.primitives.polygon({ points }))

    expect(jscad.measurements.measureArea(result)).toBeCloseTo(3.5)
    expect(jscad.measurements.measureArea(result)).toBeCloseTo(
      jscad.measurements.measureArea(expected),
    )
    expect(resolveReferencePlanes(plan).referencePlanes).toHaveLength(
      includeReference ? 1 : 0,
    )
    expect(JSON.stringify(plan)).toBe(serialized)
  })

  it(`hulls a single concave 3D solid (reference: ${includeReference})`, () => {
    const plan = withReference(
      p.extrusions.extrudeLinear(
        { height: 2 },
        p.primitives.polygon({ points }),
      ),
      includeReference,
    )
    const result = execute(JSON.parse(JSON.stringify(plan)))
    const expected = jscad.hulls.hull(
      jscad.extrusions.extrudeLinear(
        { height: 2 },
        jscad.primitives.polygon({ points }),
      ),
    )

    expect(jscad.measurements.measureVolume(result)).toBeCloseTo(7)
    expect(jscad.measurements.measureVolume(result)).toBeCloseTo(
      jscad.measurements.measureVolume(expected),
    )
  })
}
