import { ContractType, NftCollectionEntity, NftEntity } from '../model';
import { Context } from '../processor';
import { CollectionData, NftData, TransferEvent } from '../utils/interfaces';
import { BlockService } from './BlockService';
import { MULTICALL_CONTRACTS_BY_BLOCKCHAIN } from '../utils/constants';
import * as erc721 from '../abi/erc721';
import * as erc1155 from '../abi/erc1155';
import { loadNftCollectionsMetadata, loadNftsMetadata } from '../utils/metadata';
import { EntityRepository } from '../repositories/EntityRepository';
import { filterNotFound, tryAggregate } from '../utils/helpers';
import { sanitizeString } from '../utils/helpers';

export class NftService {
  nftStorage: EntityRepository<NftEntity>;
  nftCollectionStorage: EntityRepository<NftCollectionEntity>;
  constructor(
    private ctx: Context,
    private blockService: BlockService,
  ) {
    this.nftStorage = new EntityRepository(this.ctx, NftEntity);
    this.nftCollectionStorage = new EntityRepository(this.ctx, NftCollectionEntity);
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
      if (nfts.has(nftId)) continue;
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
    const { notFound } = await this.nftStorage.loadEntitiesFromStorage(new Set(nfts.keys()));

    const notFoundNfts: NftData[] = filterNotFound<NftData>(nfts, notFound);

    await this.createNfts(notFoundNfts);
    await this.loadMetadataForNewCollections();
    await this.loadMetadataForNewNfts();
    await this.nftCollectionStorage.commit();
    await this.nftStorage.commit();
  }

  public async getCollectionsInNfts(nfts: NftData[]): Promise<Map<string, CollectionData>> {
    const collections = new Map();
    for (const nft of nfts) {
      const collectionId = this.getNftCollectionId(nft.contractAddress, nft.blockchain);
      if (collections.has(collectionId)) continue;
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
    const { notFound } = await this.nftCollectionStorage.loadEntitiesFromStorage(new Set(collections.keys()));

    const notFoundCollections: CollectionData[] = filterNotFound<CollectionData>(collections, notFound);

    await this.createNftCollections(notFoundCollections);

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
      await this.nftStorage.set(nftEntity);
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
      this.nftCollectionStorage.set(nftCollenctionEntity);
    }
  }

  public async loadMetadataForNewCollections(): Promise<undefined> {
    const newCollections = [...this.nftCollectionStorage.newEntities.values()];
    await this.loadCollectionUris(newCollections);
    // Fill collection Data only if collection does not contains ContractURI
    await this.loadCollectionData(newCollections.filter((collection) => collection.uri == null));
    // Fill collection metadata where uri is not null
    await loadNftCollectionsMetadata(this.ctx, newCollections);
  }

  public async loadMetadataForNewNfts(): Promise<undefined> {
    const newNfts = [...this.nftStorage.newEntities.values()];
    await this.loadTokensUri(this.ctx, newNfts);
    await loadNftsMetadata(this.ctx, newNfts);
  }

  private async loadCollectionUris(collections: NftCollectionEntity[]): Promise<undefined> {
    const calls = collections.map((collection) => [collection.address, []] as [string, any[]]);
    const latestBlockNumber = await this.blockService.getLatestBlockNumber();
    const contractUriResults = await tryAggregate(
      this.ctx,
      this.blockService.blockchain,
      latestBlockNumber,
      erc721.functions.contractURI,
      calls,
    );
    const baseUriResults = await tryAggregate(
      this.ctx,
      this.blockService.blockchain,
      latestBlockNumber,
      erc721.functions.baseURI,
      calls,
    );

    collections.forEach((collection, index) => {
      if (contractUriResults[index] && contractUriResults[index].success) {
        collection.uri = contractUriResults[index].value;
      }
      if (baseUriResults[index] && baseUriResults[index].success) {
        let baseUri = sanitizeString(baseUriResults[index].value);
        if (baseUri) {
          baseUri = baseUri.trim();
          if (!baseUri.includes('{id}')) {
            baseUri = baseUri + '{id}';
          }
        }
        collection.baseUri = baseUri;
      }
    });
  }

  private async loadCollectionData(collections: NftCollectionEntity[]): Promise<undefined> {
    const latestBlockNumber = await this.blockService.getLatestBlockNumber();
    const calls = collections.map((collection) => [collection.address, []] as [string, any[]]);
    const nameResults = await tryAggregate(
      this.ctx,
      this.blockService.blockchain,
      latestBlockNumber,
      erc721.functions.name,
      calls,
    );
    const symbolResults = await tryAggregate(
      this.ctx,
      this.blockService.blockchain,
      latestBlockNumber,
      erc721.functions.symbol,
      calls,
    );
    collections.forEach((collection, index) => {
      if (nameResults[index] && nameResults[index].success) {
        collection.name = sanitizeString(nameResults[index].value);
      }
      if (symbolResults[index] && symbolResults[index].success) {
        collection.symbol = sanitizeString(symbolResults[index].value);
      }
    });
  }

  private async loadTokensUri(ctx: Context, nfts: NftEntity[]): Promise<void> {
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
      let results;
      results = await tryAggregate(
        ctx,
        this.blockService.blockchain,
        latestBlockNumber,
        contractType === ContractType.ERC721 ? erc721.functions.tokenURI : erc1155.functions.uri,
        calls,
      );
      results.forEach((res, i) => {
        if (res && res.success) {
          nfts[i].uri = sanitizeString(res.value);
        } else {
          nfts[i].uri = null;
        }
      });
    }
  }
}
