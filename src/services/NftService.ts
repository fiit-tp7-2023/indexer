import { ContractType, NftCollectionEntity, NftEntity } from '../model';
import { Context } from '../processor';
import { CollectionData, NftData, TransferEvent } from '../utils/interfaces';
import { BlockService } from './BlockService';
import { Multicall } from '../abi/multicall';
import { MULTICALL_CONTRACTS_BY_BLOCKCHAIN } from '../utils/constants';
import * as erc721 from '../abi/erc721';
import * as erc1155 from '../abi/erc1155';
import { fillNftCollectionsMetadata, fillNftsMetadata } from '../utils/metadata';
import { EntityRepository } from '../repositories/EntityRepository';

export class NftService {
  ctx: Context;
  blockService: BlockService;
  nftStorage: EntityRepository<NftEntity>;
  nftCollectionStorage: EntityRepository<NftCollectionEntity>;
  constructor(_ctx: Context, _blockService: BlockService) {
    this.ctx = _ctx;
    this.blockService = _blockService;
    this.nftStorage = new EntityRepository<NftEntity>(this.ctx, NftEntity);
    this.nftCollectionStorage = new EntityRepository<NftCollectionEntity>(this.ctx, NftCollectionEntity);
  }

  public getNftId(contractAddress: string, blockchain: string, tokenId: bigint): string {
    return `${contractAddress}_${blockchain}_${tokenId}`;
  }
  public getNftCollectionId(contractAddress: string, blockchain: string): string {
    return `${contractAddress}_${blockchain}`;
  }

  public async getNftsInTransferEvents(events: TransferEvent[]): Promise<Map<string, NftData>> {
    const nfts = new Map();
    for (const event of events) {
      const nftId = this.getNftId(event.contractAddress, event.blockchain, event.tokenId);
      nfts.set(nftId, {
        id: nftId,
        tokenId: event.tokenId,
        contractAddress: event.contractAddress,
        blockchain: event.blockchain,
        contractType: event.contractType,
        createdAtBlock: event.block.height,
      });
    }
    return nfts;
  }

  public async loadAndCreateNfts(nftsTransfers: TransferEvent[]): Promise<void> {
    const nfts = await this.getNftsInTransferEvents(nftsTransfers);
    const { notFound } = await this.nftStorage.loadEntitiesFromStorage(new Set([...nfts.keys()]));
    const notFoundNfts = new Map([...nfts].filter(([key, value]) => notFound.has(key)));
    await this.createNfts([...notFoundNfts.values()]);
    await this.fillMetadataForNewCollections();
    await this.fillMetadataForNewNfts();
    await this.nftCollectionStorage.saveNewIntoStorage();
    await this.nftStorage.saveNewIntoStorage();
  }

  public async getCollectionsInNfts(nfts: NftData[]): Promise<Map<string, CollectionData>> {
    const collections = new Map();
    for (const nft of nfts) {
      const collectionId = this.getNftCollectionId(nft.contractAddress, nft.blockchain);
      collections.set(collectionId, {
        id: collectionId,
        contractAddress: nft.contractAddress,
        blockchain: nft.blockchain,
        contractType: nft.contractType,
        createdAtBlock: nft.createdAtBlock,
      });
    }
    return collections;
  }

  private async createNfts(nfts: NftData[]): Promise<void> {
    // Get or create collections for nfts
    const collections = await this.getCollectionsInNfts(nfts);
    const { notFound } = await this.nftCollectionStorage.loadEntitiesFromStorage(new Set([...collections.keys()]));
    const notFoundCollections = new Map([...collections].filter(([key, value]) => notFound.has(key)));
    await this.createNftCollections([...notFoundCollections.values()]);

    // Create nfts
    for (const nft of nfts) {
      const nftEntity = new NftEntity({
        id: nft.id,
        tokenId: nft.tokenId,
        createdAtBlock: nft.createdAtBlock,
        nftCollection: await this.nftCollectionStorage.getOrFail(
          this.getNftCollectionId(nft.contractAddress, nft.blockchain),
        ),
      });
      await this.nftStorage.createNewEntity(nftEntity);
    }
  }

  private async createNftCollections(collectionsData: CollectionData[]): Promise<void> {
    for (const collectionData of collectionsData) {
      let nftCollenctionEntity = new NftCollectionEntity({
        id: collectionData.id,
        address: collectionData.contractAddress,
        blockchain: collectionData.blockchain,
        contractType: collectionData.contractType,
        createdAtBlock: collectionData.createdAtBlock,
      });
      this.nftCollectionStorage.createNewEntity(nftCollenctionEntity);
    }
  }

  public async fillMetadataForNewCollections(): Promise<undefined> {
    const newCollections = [...this.nftCollectionStorage.newEntities.values()];
    await this.fillCollectionUris(newCollections);
    // Fill collection Data only if collection does not contains ContractURI
    await this.fillCollectionData(newCollections.filter((collection) => collection.uri == null));
    // Fill collection metadata where uri is not null
    await fillNftCollectionsMetadata(this.ctx, newCollections);
  }

  public async fillMetadataForNewNfts(): Promise<undefined> {
    const newNfts = [...this.nftStorage.newEntities.values()];
    await this.fillTokensUri(this.ctx, newNfts);
    await fillNftsMetadata(this.ctx, newNfts);
  }

  private async fillCollectionUris(collections: NftCollectionEntity[]): Promise<undefined> {
    const multicall = MULTICALL_CONTRACTS_BY_BLOCKCHAIN.get(this.blockService.blockchain);
    if (!multicall) {
      this.ctx.log.error(`Multicall contract for ${this.blockService.blockchain} not defined`);
      return;
    }
    const calls = collections.map((collection) => [collection.address, []] as [string, any[]]);
    const latestBlockNumber = await this.blockService.getLatestBlockNumber();
    const multicallContract = new Multicall(this.ctx, { height: latestBlockNumber }, multicall.address);

    const contractUriResults = await multicallContract.tryAggregate(
      erc721.functions.contractURI,
      calls,
      multicall.batchSize,
    );
    const baseUriResults = await multicallContract.tryAggregate(erc721.functions.baseURI, calls, multicall.batchSize);

    for (let i = 0; i < contractUriResults.length; i++) {
      if (contractUriResults[i].success) collections[i].uri = contractUriResults[i].value;
      if (baseUriResults[i].success) {
        let baseUri = baseUriResults[i].value;
        if (baseUri) {
          baseUri = baseUri.trim();
          if (!baseUri.includes('{id}')) {
            baseUri = baseUri + '{id}';
          }
        }
        collections[i].baseUri = baseUri;
      }
    }
  }

  private async fillCollectionData(collections: NftCollectionEntity[]): Promise<undefined> {
    const latestBlockNumber = await this.blockService.getLatestBlockNumber();
    const multicall = MULTICALL_CONTRACTS_BY_BLOCKCHAIN.get(this.blockService.blockchain);
    if (!multicall) {
      this.ctx.log.error(`Multicall contract for ${this.blockService.blockchain} not defined`);
      return;
    }
    const calls = collections.map((collection) => [collection.address, []] as [string, any[]]);

    const multicallContract = new Multicall(this.ctx, { height: latestBlockNumber }, multicall.address);
    const nameResults = await multicallContract.tryAggregate(erc721.functions.name, calls, multicall.batchSize);
    const symbolResults = await multicallContract.tryAggregate(erc721.functions.symbol, calls, multicall.batchSize);
    for (let i = 0; i < nameResults.length; i++) {
      if (nameResults[i].success) collections[i].name = nameResults[i].value;
      if (symbolResults[i].success) collections[i].symbol = symbolResults[i].value;
    }
  }

  private async fillTokensUri(ctx: Context, nfts: NftEntity[]): Promise<void> {
    const tokensToFetchUri: NftEntity[] = nfts.filter((nft) => !nft.nftCollection.baseUri);
    nfts.forEach((nft) => {
      if (nft.nftCollection.baseUri) {
        nft.uri = nft.nftCollection.baseUri.replace('{id}', nft.tokenId.toString());
      }
    });
    const latestBlockNumber = await this.blockService.getLatestBlockNumber();
    const multicall = MULTICALL_CONTRACTS_BY_BLOCKCHAIN.get(this.blockService.blockchain);
    if (!multicall) {
      this.ctx.log.error(`Multicall contract for ${this.blockService.blockchain} not defined`);
      return;
    }

    for (const contractType of [ContractType.ERC721, ContractType.ERC1155]) {
      const nfts = tokensToFetchUri.filter((token) => token.nftCollection.contractType == contractType);
      if (!nfts.length) continue;
      const calls = nfts.map((token) => [token.nftCollection.address, [token.tokenId]] as [string, any[]]);
      const multicallContract = new Multicall(ctx, { height: latestBlockNumber }, multicall.address);
      let results;
      if (contractType == ContractType.ERC721) {
        results = await multicallContract.tryAggregate(erc721.functions.tokenURI, calls, multicall.batchSize);
      } else {
        results = await multicallContract.tryAggregate(erc1155.functions.uri, calls, multicall.batchSize);
      }
      results.forEach((res, i) => {
        if (res.success) {
          nfts[i].uri = res.value;
        } else {
          nfts[i].uri = null;
        }
      });
    }
  }
}
