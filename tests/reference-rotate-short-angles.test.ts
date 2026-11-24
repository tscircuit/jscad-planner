import { expect, test } from "bun:test"
import { jscadPlanner as p, resolveReferencePlanes } from "../lib"

const closeVector = (actual: number[], expected: number[]) =>
  actual.forEach((n, i) => expect(n).toBeCloseTo(expected[i], 8))

test("reference planes support JSCAD rotate angles with omitted trailing zeroes", () => {
  const marker = p.primitives.rectangle({
    size: [2, 4],
    center: [3, 5],
    name: "short-rotate",
    reference: true,
  })
  const angleX = Math.PI / 2
  const angleY = Math.PI / 4

  const oneAngle = resolveReferencePlanes(p.transforms.rotate([angleX], marker))
    .referencePlanes[0]
  const explicitOneAngle = resolveReferencePlanes(
    p.transforms.rotate([angleX, 0, 0], {
      ...marker,
      name: "explicit-one-angle",
    }),
  ).referencePlanes[0]
  closeVector(oneAngle.origin, explicitOneAngle.origin)
  closeVector(oneAngle.normal, explicitOneAngle.normal)
  closeVector(oneAngle.xAxis, explicitOneAngle.xAxis)

  const twoAngles = resolveReferencePlanes(
    p.transforms.rotate([angleX, angleY], marker),
  ).referencePlanes[0]
  const explicitTwoAngles = resolveReferencePlanes(
    p.transforms.rotate([angleX, angleY, 0], {
      ...marker,
      name: "explicit-two-angles",
    }),
  ).referencePlanes[0]
  closeVector(twoAngles.origin, explicitTwoAngles.origin)
  closeVector(twoAngles.normal, explicitTwoAngles.normal)
  closeVector(twoAngles.xAxis, explicitTwoAngles.xAxis)
})
