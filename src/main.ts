import { TypeormDatabase } from '@subsquid/typeorm-store';
import { NftTransferEntity, TokenTransferEntity } from './model';
import { BLOCKCHAIN, Context, processor } from './processor';
import { TransferEvent } from './utils/interfaces';
import { BlockService } from './services/BlockService';
import { NftService } from './services/NftService';
import { TokenService } from './services/TokenService';

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
  const blockService = new BlockService(ctx, BLOCKCHAIN);
  const nftService = new NftService(ctx, blockService);
  const tokenService = new TokenService(ctx, blockService);
  const { nftsTransfers, tokensTransfers } = await blockService.processBatchOfBlocks();

  await nftService.loadAndCreateNfts(nftsTransfers);
  await tokenService.loadAndCreateTokens(tokensTransfers);
  await processTransfers(ctx, nftService, tokenService, nftsTransfers, tokensTransfers);
});

async function processTransfers(
  ctx: Context,
  nftService: NftService,
  tokenService: TokenService,
  nftsTransfers: TransferEvent[],
  tokensTransfers: TransferEvent[],
) {
  const nftTransferEntities = [];
  const tokenTransferEntities = [];
  for (const nftTransfer of nftsTransfers) {
    const nftId = nftService.getNftId(nftTransfer.contractAddress, nftTransfer.blockchain, nftTransfer.tokenId);
    const nft = await nftService.nftStorage.get(nftId);
    if (nft !== undefined) {
      nftTransferEntities.push(
        new NftTransferEntity({
          id: nftTransfer.id,
          fromAddress: nftTransfer.from,
          toAddress: nftTransfer.to,
          nft: nft,
          amount: nftTransfer.amount,
          createdAtBlock: nftTransfer.block.height,
        }),
      );
    } else {
      ctx.log.error(`NFT with id ${nftId} not found`);
    }
  }
  for (const tokenTransfer of tokensTransfers) {
    const tokenId = tokenService.getTokenCollectionId(tokenTransfer.contractAddress, tokenTransfer.blockchain);
    const token = await tokenService.tokenCollectionStorage.get(tokenId);
    if (token !== undefined) {
      tokenTransferEntities.push(
        new TokenTransferEntity({
          id: tokenTransfer.id,
          fromAddress: tokenTransfer.from,
          toAddress: tokenTransfer.to,
          token: token,
          amount: tokenTransfer.amount,
          createdAtBlock: tokenTransfer.block.height,
        }),
      );
    } else {
      ctx.log.error(`Token with id ${tokenId} not found`);
    }
  }

  await ctx.store.insert(nftTransferEntities);
  await ctx.store.insert(tokenTransferEntities);
}
