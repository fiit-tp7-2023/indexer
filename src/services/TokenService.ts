import { TokenCollectionEntity } from '../model';
import { Context } from '../processor';
import { EntityRepository } from '../repositories/EntityRepository';
import { CollectionData, TransferEvent } from '../utils/interfaces';
import { BlockService } from './BlockService';
import * as erc20 from '../abi/erc20';
import { filterNotFound, tryAggregate } from '../utils/helpers';
import { sanitizeString } from '../utils/helpers';

export class TokenService {
  tokenCollectionStorage: EntityRepository<TokenCollectionEntity>;
  constructor(
    private ctx: Context,
    private blockService: BlockService,
  ) {
    this.tokenCollectionStorage = new EntityRepository(this.ctx, TokenCollectionEntity);
  }

  public getTokenCollectionId(contractAddress: string, blockchain: string): string {
    return `${contractAddress}_${blockchain}`.toLowerCase();
  }

  public getTokenCollectionsInTransferEvents(events: TransferEvent[]): Map<string, CollectionData> {
    const tokenCollections = new Map();
    for (const event of events) {
      const tokenCollectionId = this.getTokenCollectionId(event.contractAddress, event.blockchain);
      if (tokenCollections.has(tokenCollectionId)) continue;
      tokenCollections.set(tokenCollectionId, {
        id: tokenCollectionId,
        contractAddress: event.contractAddress,
        blockchain: event.blockchain,
        contractType: event.contractType,
        createdAtBlock: event.block.height,
      });
    }
    return tokenCollections;
  }

  public async loadAndCreateTokens(tokensTransfers: TransferEvent[]): Promise<void> {
    const tokenCollections = this.getTokenCollectionsInTransferEvents(tokensTransfers);
    const { notFound } = await this.tokenCollectionStorage.loadEntitiesFromStorage(new Set(tokenCollections.keys()));

    const notFoundTokenCollections: CollectionData[] = filterNotFound<CollectionData>(tokenCollections, notFound);

    await this.createTokenCollections(notFoundTokenCollections);
    await this.loadNewTokensMetadata();
    await this.tokenCollectionStorage.commit();
  }

  public async loadNewTokensMetadata(): Promise<void> {
    const collections = [...this.tokenCollectionStorage.newEntities.values()];
    const calls = collections.map((collection) => [collection.address, []] as [string, any[]]);
    const latestBlockNumber = await this.blockService.getLatestBlockNumber();
    const nameResults = await tryAggregate(
      this.ctx,
      this.blockService.blockchain,
      latestBlockNumber,
      erc20.functions.name,
      calls,
    );
    const symbolResults = await tryAggregate(
      this.ctx,
      this.blockService.blockchain,
      latestBlockNumber,
      erc20.functions.symbol,
      calls,
    );
    const decimalsResults = await tryAggregate(
      this.ctx,
      this.blockService.blockchain,
      latestBlockNumber,
      erc20.functions.decimals,
      calls,
    );
    collections.forEach((collection, index) => {
      if (nameResults[index] && nameResults[index].success) {
        collection.name = sanitizeString(nameResults[index].value);
      }
      if (symbolResults[index] && symbolResults[index].success) {
        collection.symbol = sanitizeString(symbolResults[index].value);
      }
      if (decimalsResults[index] && decimalsResults[index].success) {
        collection.decimals = decimalsResults[index].value;
      }
    });
  }

  public async createTokenCollections(tokenCollections: CollectionData[]): Promise<void> {
    for (const collectionData of tokenCollections) {
      const tokenCollectionEntity = new TokenCollectionEntity({
        id: collectionData.id,
        address: collectionData.contractAddress,
        blockchain: collectionData.blockchain,
        contractType: collectionData.contractType,
        createdAtBlock: collectionData.createdAtBlock,
      });
      await this.tokenCollectionStorage.set(tokenCollectionEntity);
    }
  }
}
