import { Multicall } from '../abi/multicall';
import { TokenCollectionEntity } from '../model';
import { Context } from '../processor';
import { EntityRepository } from '../repositories/EntityRepository';
import { MULTICALL_CONTRACTS_BY_BLOCKCHAIN } from '../utils/constants';
import { CollectionData, TransferEvent } from '../utils/interfaces';
import { BlockService } from './BlockService';
import * as erc20 from '../abi/erc20';
import { filterNotFound } from '../utils/helpers';

export class TokenService {
  tokenCollectionStorage: EntityRepository<TokenCollectionEntity>;
  constructor(
    private ctx: Context,
    private blockService: BlockService,
  ) {
    this.tokenCollectionStorage = new EntityRepository(this.ctx, TokenCollectionEntity);
  }

  public getTokenCollectionId(contractAddress: string, blockchain: string): string {
    return `${contractAddress}_${blockchain}`;
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
    const multicall = MULTICALL_CONTRACTS_BY_BLOCKCHAIN.get(this.blockService.blockchain);
    if (!multicall) {
      this.ctx.log.error(`Multicall contract for ${this.blockService.blockchain} not defined`);
      return;
    }
    const calls = collections.map((collection) => [collection.address, []] as [string, any[]]);
    const latestBlockNumber = await this.blockService.getLatestBlockNumber();
    const multicallContract = new Multicall(this.ctx, { height: latestBlockNumber }, multicall.address);
    const nameResults = await multicallContract.tryAggregate(erc20.functions.name, calls, multicall.batchSize);
    const symbolResults = await multicallContract.tryAggregate(erc20.functions.symbol, calls, multicall.batchSize);
    const decimalsResults = await multicallContract.tryAggregate(erc20.functions.decimals, calls, multicall.batchSize);

    for (let i = 0; i < nameResults.length; i++) {
      if (nameResults[i].success) collections[i].name = nameResults[i].value;
      if (symbolResults[i].success) collections[i].symbol = symbolResults[i].value;
      if (decimalsResults[i].success) collections[i].decimals = decimalsResults[i].value;
    }
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
      await this.tokenCollectionStorage.createNewEntity(tokenCollectionEntity);
    }
  }
}
