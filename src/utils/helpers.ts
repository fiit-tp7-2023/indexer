export function* splitIntoBatches<T>(list: T[], maxBatchSize: number = 15000): Generator<T[]> {
  if (list.length <= maxBatchSize) {
    yield list;
  } else {
    let offset = 0;
    while (list.length - offset > maxBatchSize) {
      yield list.slice(offset, offset + maxBatchSize);
      offset += maxBatchSize;
    }
    yield list.slice(offset);
  }
}

export function filterNotFound<T>(entities: Map<string, T>, notFound: Set<string>): T[] {
  return Array.from(entities).reduce((acc: T[], [id, entity]: [string, T]) => {
    if (notFound.has(id)) acc.push(entity);
    return acc;
  }, []);
}
