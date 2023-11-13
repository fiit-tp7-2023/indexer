import { In } from 'typeorm';
import { CollectionMapper } from '../mappers/CollectionMapper';
import { Blockchain, NftEntity, NftTransferEntity } from '../model';
import { Context } from '../processor';
import { splitIntoBatches } from '../utils/helpers';
import { TransferEvent, Cache } from '../utils/interfaces';
import { CollectionService } from './CollectionService';
import { fetchAllMetadata, mapTokenMetadata } from '../utils/metadata';
import { NftMapper } from '../mappers/NftMapper';

export class NftService {
  collectionService: CollectionService;
  ctx: Context;
  constructor(_ctx: Context) {
    this.ctx = _ctx;
    this.collectionService = new CollectionService(_ctx);
  }

  async processTransfersNfts(latestBlockNumber: number, cache: Cache, transfersData: TransferEvent[]) {
    let nftsData: Map<string, TransferEvent> = new Map();
    transfersData.forEach((transferData) => {
      nftsData.set(
        NftMapper.getNftEntityId(transferData.contractAddress, Blockchain.eth, transferData.tokenId),
        transferData,
      );
    });
    await this.getOrCreateNfts(latestBlockNumber, cache, nftsData);
    transfersData.forEach((transferData) => {
      const nftId = NftMapper.getNftEntityId(transferData.contractAddress, Blockchain.eth, transferData.tokenId);
      const nft = cache.Nfts.get(nftId);
      if (nft !== undefined) {
        cache.NftTransfers.push(
          new NftTransferEntity({
            id: transferData.id,
            fromAddress: transferData.from,
            toAddress: transferData.to,
            nft: nft,
            amount: transferData.amount,
            createdAtBlock: transferData.block.height,
          }),
        );
      } else {
        this.ctx.log.error(`NFT with id ${nftId} not found`);
      }
    });
  }

  async getOrCreateNfts(latestBlockNumber: number, cache: Cache, nftsData: Map<string, TransferEvent>) {
    for (let batch of splitIntoBatches([...nftsData.keys()])) {
      (await this.ctx.store.findBy(NftEntity, { id: In(batch) })).map((entity) => {
        cache.Nfts.set(entity.id, entity);
        nftsData.delete(entity.id);
      });
    }

    const collectionsData: Map<string, TransferEvent> = new Map();
    for (const nftData of nftsData.values()) {
      const collectionId = CollectionMapper.getCollectionEntityId(nftData.contractAddress, nftData.blockchain);
      if (!collectionsData.has(collectionId)) collectionsData.set(collectionId, nftData);
    }
    await this.collectionService.getOrCreateNftCollections(latestBlockNumber, cache, collectionsData);

    const newNfts = [];
    for (const [nftId, nftData] of nftsData) {
      const collectionId = CollectionMapper.getCollectionEntityId(nftData.contractAddress, nftData.blockchain);
      const nftCollenction = cache.NftCollections.get(collectionId);

      let nftEntity = new NftEntity({
        id: nftId,
        tokenId: nftData.tokenId,
        nftCollection: nftCollenction,
        createdAtBlock: nftData.block.height,
      });
      newNfts.push(nftEntity);
      cache.Nfts.set(nftId, nftEntity);
    }
    if (newNfts) {
      await this.collectionService.fillTokensUri(latestBlockNumber, newNfts);
      await this.fillNftsMetadata(newNfts);
    }
  }

  async fillNftsMetadata(nfts: NftEntity[], batchSize = 100, sleep = 3000) {
    for (const batch of splitIntoBatches(nfts, batchSize)) {
      const tokensWithUri = batch.map((obj) => obj.uri).filter((uri): uri is string => uri != null);
      this.ctx.log.info(`Fetching token metadata for ${tokensWithUri.length} NFTs`);
      const filledMetadata = await fetchAllMetadata(this.ctx, tokensWithUri);
      for (const nft of batch) {
        if (nft.uri) {
          Object.assign(nft, await mapTokenMetadata(filledMetadata.get(nft.uri)));
        }
      }
      await new Promise((f) => setTimeout(f, sleep));
    }
  }
}
