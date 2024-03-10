import { Func } from '../abi/abi.support';
import { Multicall, MulticallResult } from '../abi/multicall';
import { Context } from '../processor';
import { MULTICALL_CONTRACTS_BY_BLOCKCHAIN } from './constants';

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

export async function tryAggregate<Args extends any[], R>(
  ctx: Context,
  blockchain: string,
  latestBlockNumber: number,
  func: Func<Args, {}, R>,
  calls: [address: string, args: Args][],
  retries = 3,
): Promise<MulticallResult<R>[]> {
  const multicall = MULTICALL_CONTRACTS_BY_BLOCKCHAIN.get(blockchain);
  if (!multicall) {
    ctx.log.error(`Multicall contract for ${blockchain} not defined`);
    return [];
  }
  const multicallContract = new Multicall(ctx, { height: latestBlockNumber }, multicall.address);
  for (let i = 0; i < retries; i++) {
    try {
      const results = await multicallContract.tryAggregate(func, calls, multicall.batchSize);
      return results;
    } catch (error: any) {
      ctx.log.warn(`Error fetching data from multicall contract: ${error.message} - retrying...`);
    }
  }
  ctx.log.error(`Failed to fetch data from multicall contract after ${retries} retries`);
  return [];
}
