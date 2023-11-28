import { TypeormDatabase } from '@subsquid/typeorm-store';
import { BLOCKCHAIN, processor } from './processor';
import { BlockService } from './services/BlockService';
import { NftService } from './services/NftService';
import { TokenService } from './services/TokenService';
import { TransferService } from './services/TransferService';

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
  const blockService = new BlockService(ctx, BLOCKCHAIN);
  const nftService = new NftService(ctx, blockService);
  const tokenService = new TokenService(ctx, blockService);
  const transferService = new TransferService(ctx, nftService, tokenService);

  const { nftsTransfers, tokensTransfers } = await blockService.processBatchOfBlocks();

  await nftService.loadAndCreateNfts(nftsTransfers);
  await tokenService.loadAndCreateTokens(tokensTransfers);
  await transferService.processNftTransfers(nftsTransfers);
  await transferService.processTokenTransfers(tokensTransfers);
});
