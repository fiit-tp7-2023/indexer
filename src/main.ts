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

async function processNftTransfers(nftService: NftService, nftsTransfers: TransferEvent[]) {
  const nftTransferEntities = [];
  for (const transfer of nftsTransfers) {
    const nftId = nftService.getNftId(transfer.contractAddress, transfer.blockchain, transfer.tokenId);
    const nft = await nftService.nftStorage.get(nftId);
    if (nft) {
      nftTransferEntities.push(
        new NftTransferEntity({
          id: transfer.id,
          fromAddress: transfer.from,
          toAddress: transfer.to,
          nft: nft,
          amount: transfer.amount,
          createdAtBlock: transfer.block.height,
        }),
      );
    } else {
      throw new Error(`NFT with id ${nftId} not found`);
    }
  }
  return nftTransferEntities;
}

async function processTokenTransfers(tokenService: TokenService, tokensTransfers: TransferEvent[]) {
  const tokenTransferEntities = [];
  for (const transfer of tokensTransfers) {
    const tokenId = tokenService.getTokenCollectionId(transfer.contractAddress, transfer.blockchain);
    const token = await tokenService.tokenCollectionStorage.get(tokenId);
    if (token) {
      tokenTransferEntities.push(
        new TokenTransferEntity({
          id: transfer.id,
          fromAddress: transfer.from,
          toAddress: transfer.to,
          token: token,
          amount: transfer.amount,
          createdAtBlock: transfer.block.height,
        }),
      );
    } else {
      throw new Error(`Token with id ${tokenId} not found`);
    }
  }
  return tokenTransferEntities;
}

async function processTransfers(
  ctx: Context,
  nftService: NftService,
  tokenService: TokenService,
  nftsTransfers: TransferEvent[],
  tokensTransfers: TransferEvent[],
) {
  try {
    const nftTransferEntities = await processNftTransfers(nftService, nftsTransfers);
    const tokenTransferEntities = await processTokenTransfers(tokenService, tokensTransfers);

    await ctx.store.insert(nftTransferEntities);
    await ctx.store.insert(tokenTransferEntities);
  } catch (error) {
    if (error instanceof Error) {
      ctx.log.error(error.message);
    } else {
      ctx.log.error('An unknown error occurred');
    }
  }
}
