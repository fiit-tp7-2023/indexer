import { TypeormDatabase } from '@subsquid/typeorm-store';
import { Context, processor } from './processor';
import { Cache } from './utils/interfaces';
import { NftService } from './services/NftService';
import { BlockService } from './services/BlockService';

const cache: Cache = {
  NftCollections: new Map(),
  TokenCollections: new Map(),
  Nfts: new Map(),
  NftTransfers: [],
  TokenTransfers: [],
};

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx: Context) => {
  const blockService = new BlockService(ctx);
  const nftService = new NftService(ctx);

  _clearCache();

  const [latestBlockNumber, transfersNfts] = await blockService.processBlocks();

  await nftService.processTransfersNfts(latestBlockNumber, cache, transfersNfts);

  await ctx.store.upsert([...cache.NftCollections.values()]);
  await ctx.store.upsert([...cache.TokenCollections.values()]);
  await ctx.store.upsert([...cache.Nfts.values()]);
  await ctx.store.insert(cache.NftTransfers);
  await ctx.store.insert(cache.TokenTransfers);
});

export function _clearCache() {
  cache.NftCollections.clear();
  cache.Nfts.clear();
  cache.TokenCollections.clear();
  cache.NftTransfers = [];
  cache.TokenTransfers = [];
}
