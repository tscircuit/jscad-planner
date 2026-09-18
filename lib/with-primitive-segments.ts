export const withPrimitiveSegments = <
  Options extends { segments?: number; resolution?: number },
>(
  options: Options,
): Options => {
  if (options.segments !== undefined || options.resolution === undefined) {
    return options
  }
  return { ...options, segments: options.resolution }
}
