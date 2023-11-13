import { In } from 'typeorm';
import { ContractType, NftCollectionEntity, NftEntity } from '../model';
import { BLOCKCHAIN, Context } from '../processor';
import { splitIntoBatches } from '../utils/helpers';
import { Cache, TransferEvent } from '../utils/interfaces';
import { MULTICALL_CONTRACTS_BY_BLOCKCHAIN } from '../utils/constants';
import { Multicall } from '../abi/multicall';
import { fetchAllMetadata } from '../utils/metadata';
import { MetadataMapper } from '../mappers/MetadataMapper';

import * as erc1155 from '../abi/erc1155';
import * as erc20 from '../abi/erc20';
import * as erc721 from '../abi/erc721';

export class CollectionService {
  ctx: Context;
  constructor(_ctx: Context) {
    this.ctx = _ctx;
  }

  async getOrCreateNftCollections(
    latestBlockNumber: number,
    cache: Cache,
    collectionsData: Map<string, TransferEvent>,
  ) {
    for (let batch of splitIntoBatches([...collectionsData.keys()])) {
      (await this.ctx.store.findBy(NftCollectionEntity, { id: In(batch) })).map((entity) => {
        cache.NftCollections.set(entity.id, entity);
        collectionsData.delete(entity.id);
      });
    }

    const newCollections = [];
    for (const [collectionId, collectionData] of collectionsData) {
      let nftCollenctionEntity = new NftCollectionEntity({
        id: collectionId,
        address: collectionData.contractAddress,
        blockchain: collectionData.blockchain,
        contractType: collectionData.contractType,
        createdAtBlock: collectionData.block.height,
      });
      cache.NftCollections.set(collectionId, nftCollenctionEntity);
      newCollections.push(nftCollenctionEntity);
    }
    if (newCollections) {
      await this.fillCollectionUris(latestBlockNumber, newCollections);
      // Get Collection metadata only for collections which does not contains ContractURI
      await this.fillCollectionData(
        latestBlockNumber,
        newCollections.filter((collection) => collection.uri == null),
      );
      await this.fillNftCollectionsMetadata(newCollections);
    }
  }

  async fillTokensUri(latestBlockNumber: number, tokens: NftEntity[]): Promise<void> {
    const tokensToFetchUri: NftEntity[] = tokens.filter((token) => !token.nftCollection.baseUri);
    tokens.forEach((token) => {
      if (token.nftCollection.baseUri) {
        token.uri = token.nftCollection.baseUri.replace('{id}', token.tokenId.toString());
      }
    });

    const multicall = MULTICALL_CONTRACTS_BY_BLOCKCHAIN.get(BLOCKCHAIN);
    if (!multicall) {
      this.ctx.log.error(`Multicall contract for ${BLOCKCHAIN} not defined`);
      return;
    }

    for (const contractType of [ContractType.erc721, ContractType.erc1155]) {
      const nfts = tokensToFetchUri.filter((token) => token.nftCollection.contractType == contractType);
      if (!nfts.length) continue;
      const calls = nfts.map((token) => [token.nftCollection.address, [token.tokenId]] as [string, any[]]);
      const multicallContract = new Multicall(this.ctx, { height: latestBlockNumber }, multicall.address);
      let results;
      if (contractType == ContractType.erc721) {
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

  async fillCollectionData(latestBlockNumber: number, collections: NftCollectionEntity[]): Promise<undefined> {
    const multicall = MULTICALL_CONTRACTS_BY_BLOCKCHAIN.get(BLOCKCHAIN);
    if (!multicall) {
      this.ctx.log.error(`Multicall contract for ${BLOCKCHAIN} not defined`);
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

  async fillCollectionUris(latestBlockNumber: number, collections: NftCollectionEntity[]): Promise<undefined> {
    const multicall = MULTICALL_CONTRACTS_BY_BLOCKCHAIN.get(BLOCKCHAIN);
    if (!multicall) {
      this.ctx.log.error(`Multicall contract for ${BLOCKCHAIN} not defined`);
      return;
    }
    const calls = collections.map((collection) => [collection.address, []] as [string, any[]]);
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

  async fillNftCollectionsMetadata(collections: NftCollectionEntity[]) {
    const collectionsWithUri = collections.map((obj) => obj.uri).filter((uri): uri is string => uri != null);
    this.ctx.log.info(`Fetching collection metadata from contract uri for ${collectionsWithUri.length} collections`);
    const filledMetadata = await fetchAllMetadata(this.ctx, collectionsWithUri);
    for (const collection of collections) {
      if (collection.uri) {
        Object.assign(collection, await MetadataMapper.mapCollectionMetadata(filledMetadata.get(collection.uri)));
      }
    }
  }
}
