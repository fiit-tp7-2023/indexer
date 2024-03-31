import { TypeormDatabase } from '@subsquid/typeorm-store';
import { BLOCKCHAIN, processor, config } from './processor';
import { BlockService } from './services/BlockService';
import { NftService } from './services/NftService';
import { TokenService } from './services/TokenService';
import { TransferService } from './services/TransferService';
import { AccountService } from './services/AccountService';
import { MockService } from './services/MockService';

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
  const blockService = new BlockService(ctx, BLOCKCHAIN);
  const nftService = new NftService(ctx, blockService);
  const tokenService = new TokenService(ctx, blockService);
  const accountService = new AccountService(ctx);
  const transferService = new TransferService(ctx, accountService, nftService, tokenService);
  const mockService = new MockService(ctx, transferService);

  const { nftsTransfers, tokensTransfers } = await blockService.processBatchOfBlocks();
  if (config.block_range.from === ctx.blocks[0].header.height) {
    nftsTransfers.push(...(await mockService.getMockedNftTransfers()));
  }

  await accountService.loadAndCreateAccounts([...nftsTransfers, ...tokensTransfers]);
  await nftService.loadAndCreateNfts(nftsTransfers);
  await tokenService.loadAndCreateTokens(tokensTransfers);
  await transferService.processNftTransfers(nftsTransfers);
  await transferService.processTokenTransfers(tokensTransfers);
});
