import { In } from 'typeorm';
import { TypeormDatabase } from '@subsquid/typeorm-store';
import { v4 as uuidv4 } from 'uuid';
import * as erc721 from './abi/erc721';
import * as erc20 from './abi/erc20';
import * as erc1155 from './abi/erc1155';
import {
  ContractType,
  NftCollectionEntity,
  NftEntity,
  NftTransferEntity,
  Blockchain,
  TokenCollectionEntity,
  TokenTransferEntity,
} from './model';
import { Block, BLOCKCHAIN, Context, Log, Transaction, processor } from './processor';
import { fillNftsMetadata, fillNftCollectionsMetadata } from './utils/metadata';
import { CONTRACTS_TO_INDEX, MULTICALL_CONTRACTS_BY_BLOCKCHAIN } from './utils/constants';
import { TransferEvent, Cache } from './utils/interfaces';
import { Multicall } from './abi/multicall';
import { splitIntoBatches } from './utils/helpers';

const cache: Cache = {
  NftCollections: new Map(),
  TokenCollections: new Map(),
  Nfts: new Map(),
  NftTransfers: [],
  TokenTransfers: [],
};

processor.run(new TypeormDatabase({ supportHotBlocks: true }), async (ctx) => {
  const TransfersNfts: TransferEvent[] = [];
  const TransfersTokens: TransferEvent[] = [];
  _clearCache();

  const latestBlockNumber = parseInt(await ctx._chain.client.call('eth_blockNumber'));
  for (let block of ctx.blocks) {
    for (let log of block.logs) {
      if (
        CONTRACTS_TO_INDEX.some((contract) => contract.address == log.address) &&
        log.topics[0] === erc721.events.Transfer.topic &&
        log.topics.length === 4
      ) {
        const { from, to, tokenId } = erc721.events.Transfer.decode(log);
        TransfersNfts.push({
          id: uuidv4(),
          block: log.block,
          from: from,
          to: to,
          tokenId: tokenId,
          amount: BigInt(1),
          contractAddress: log.address,
          blockchain: BLOCKCHAIN,
          contractType: ContractType.erc721,
        });
      } else if (
        CONTRACTS_TO_INDEX.some((contract) => contract.address == log.address) &&
        log.topics[0] === erc20.events.Transfer.topic &&
        log.topics.length === 3
      ) {
        const { from, to, value } = erc20.events.Transfer.decode(log);
        TransfersTokens.push({
          id: uuidv4(),
          block: log.block,
          from: from,
          to: to,
          tokenId: BigInt(0),
          amount: value,
          contractAddress: log.address,
          blockchain: BLOCKCHAIN,
          contractType: ContractType.erc20,
        });
      } else if (
        CONTRACTS_TO_INDEX.some((contract) => contract.address == log.address) &&
        log.topics[0] === erc1155.events.TransferSingle.topic
      ) {
        const { from, to, id, value } = erc1155.events.TransferSingle.decode(log);
        TransfersNfts.push({
          id: uuidv4(),
          block: log.block,
          from: from,
          to: to,
          tokenId: id,
          amount: value,
          contractAddress: log.address,
          blockchain: BLOCKCHAIN,
          contractType: ContractType.erc1155,
        });
      } else if (
        CONTRACTS_TO_INDEX.some((contract) => contract.address == log.address) &&
        log.topics[0] === erc1155.events.TransferBatch.topic
      ) {
        const { from, to, ids, amounts } = erc1155.events.TransferBatch.decode(log);
        for (let i = 0; i < ids.length; i++) {
          TransfersNfts.push({
            id: uuidv4(),
            block: log.block,
            from: from,
            to: to,
            tokenId: ids[i],
            amount: amounts[i],
            contractAddress: log.address,
            blockchain: BLOCKCHAIN,
            contractType: ContractType.erc1155,
          });
        }
      }
    }
  }

  await processTransfersNfts(ctx, latestBlockNumber, cache, TransfersNfts);
  await processTransfersTokens(ctx, latestBlockNumber, cache, TransfersTokens);

  await ctx.store.upsert([...cache.NftCollections.values()]);
  await ctx.store.upsert([...cache.TokenCollections.values()]);
  await ctx.store.upsert([...cache.Nfts.values()]);
  await ctx.store.insert(cache.NftTransfers);
  await ctx.store.insert(cache.TokenTransfers);
});

export function _clearCache() {
  cache.NftCollections.clear();
  cache.Nfts.clear();
  cache.TokenCollections.clear();
  cache.NftTransfers = [];
  cache.TokenTransfers = [];
}

export function getNftEntityId(contractAddress: string, blockchain: string, tokenId: bigint): string {
  return `${contractAddress}_${blockchain}_${tokenId}`;
}

export function getCollectionEntityId(contractAddress: string, blockchain: string): string {
  return `${contractAddress}_${blockchain}`;
}

export function getCollectionEntityIdFromNftId(NftId: string): string {
  return NftId.slice(0, NftId.indexOf('_', 43));
}

async function processTransfersNfts(
  ctx: Context,
  latestBlockNumber: number,
  cache: Cache,
  transfersData: TransferEvent[],
) {
  let nftsData: Map<string, TransferEvent> = new Map();
  transfersData.forEach((transferData) => {
    nftsData.set(getNftEntityId(transferData.contractAddress, Blockchain.eth, transferData.tokenId), transferData);
  });
  await getOrCreateNfts(ctx, latestBlockNumber, cache, nftsData);
  transfersData.forEach((transferData) => {
    const nftId = getNftEntityId(transferData.contractAddress, Blockchain.eth, transferData.tokenId);
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
      ctx.log.error(`NFT with id ${nftId} not found`);
    }
  });
}

async function processTransfersTokens(
  ctx: Context,
  latestBlockNumber: number,
  cache: Cache,
  transfersData: TransferEvent[],
) {
  let tokensData: Map<string, TransferEvent> = new Map();
  transfersData.forEach((transferData) => {
    tokensData.set(getCollectionEntityId(transferData.contractAddress, Blockchain.eth), transferData);
  });
  await getOrCreateTokenCollections(ctx, latestBlockNumber, cache, tokensData);
  transfersData.forEach((transferData) => {
    const collectionId = getCollectionEntityId(transferData.contractAddress, Blockchain.eth);
    const collections = cache.TokenCollections.get(collectionId);
    if (collections !== undefined) {
      cache.TokenTransfers.push(
        new TokenTransferEntity({
          id: transferData.id,
          fromAddress: transferData.from,
          toAddress: transferData.to,
          amount: transferData.amount,
          createdAtBlock: transferData.block.height,
        }),
      );
    } else {
      ctx.log.error(`Token Collection with id ${collectionId} not found`);
    }
  });
}

export async function getOrCreateNfts(
  ctx: Context,
  latestBlockNumber: number,
  cache: Cache,
  nftsData: Map<string, TransferEvent>,
) {
  for (let batch of splitIntoBatches([...nftsData.keys()])) {
    (await ctx.store.findBy(NftEntity, { id: In(batch) })).map((entity) => {
      cache.Nfts.set(entity.id, entity);
      nftsData.delete(entity.id);
    });
  }

  const collectionsData: Map<string, TransferEvent> = new Map();
  for (const nftData of nftsData.values()) {
    const collectionId = getCollectionEntityId(nftData.contractAddress, nftData.blockchain);
    if (!collectionsData.has(collectionId)) collectionsData.set(collectionId, nftData);
  }
  await getOrCreateNftCollections(ctx, latestBlockNumber, cache, collectionsData);

  const newNfts = [];
  for (const [nftId, nftData] of nftsData) {
    const collectionId = getCollectionEntityId(nftData.contractAddress, nftData.blockchain);
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
    await fillTokensUri(ctx, latestBlockNumber, newNfts);
    await fillNftsMetadata(ctx, newNfts);
  }
}

export async function getOrCreateNftCollections(
  ctx: Context,
  latestBlockNumber: number,
  cache: Cache,
  collectionsData: Map<string, TransferEvent>,
) {
  for (let batch of splitIntoBatches([...collectionsData.keys()])) {
    (await ctx.store.findBy(NftCollectionEntity, { id: In(batch) })).map((entity) => {
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
    await fillCollectionUris(ctx, latestBlockNumber, newCollections);
    // Get Collection metadata only for collections which does not contains ContractURI
    await fillCollectionData(
      ctx,
      latestBlockNumber,
      newCollections.filter((collection) => collection.uri == null),
    );
    await fillNftCollectionsMetadata(ctx, newCollections);
  }
}

export async function getOrCreateTokenCollections(
  ctx: Context,
  latestBlockNumber: number,
  cache: Cache,
  collectionsData: Map<string, TransferEvent>,
) {
  for (let batch of splitIntoBatches([...collectionsData.keys()])) {
    (await ctx.store.findBy(TokenCollectionEntity, { id: In(batch) })).map((entity) => {
      cache.TokenCollections.set(entity.id, entity);
      collectionsData.delete(entity.id);
    });
  }

  const newCollections = [];
  for (const [collectionId, collectionData] of collectionsData) {
    let tokenCollectionEntity = new TokenCollectionEntity({
      id: collectionId,
      address: collectionData.contractAddress,
      blockchain: collectionData.blockchain,
      contractType: collectionData.contractType,
      createdAtBlock: collectionData.block.height,
    });
    cache.TokenCollections.set(collectionId, tokenCollectionEntity);
    newCollections.push(tokenCollectionEntity);
  }
  if (newCollections) {
    await fillTokenData(ctx, latestBlockNumber, newCollections);
  }
}

export async function fillTokensUri(ctx: Context, latestBlockNumber: number, tokens: NftEntity[]): Promise<void> {
  const tokensToFetchUri: NftEntity[] = tokens.filter((token) => !token.nftCollection.baseUri);
  tokens.forEach((token) => {
    if (token.nftCollection.baseUri) {
      token.uri = token.nftCollection.baseUri.replace('{id}', token.tokenId.toString());
    }
  });

  const multicall = MULTICALL_CONTRACTS_BY_BLOCKCHAIN.get(BLOCKCHAIN);
  if (!multicall) {
    ctx.log.error(`Multicall contract for ${BLOCKCHAIN} not defined`);
    return;
  }

  for (const contractType of [ContractType.erc721, ContractType.erc1155]) {
    const nfts = tokensToFetchUri.filter((token) => token.nftCollection.contractType == contractType);
    if (!nfts.length) continue;
    const calls = nfts.map((token) => [token.nftCollection.address, [token.tokenId]] as [string, any[]]);
    const multicallContract = new Multicall(ctx, { height: latestBlockNumber }, multicall.address);
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

export async function fillCollectionData(
  ctx: Context,
  latestBlockNumber: number,
  collections: NftCollectionEntity[],
): Promise<undefined> {
  const multicall = MULTICALL_CONTRACTS_BY_BLOCKCHAIN.get(BLOCKCHAIN);
  if (!multicall) {
    ctx.log.error(`Multicall contract for ${BLOCKCHAIN} not defined`);
    return;
  }
  const calls = collections.map((collection) => [collection.address, []] as [string, any[]]);

  const multicallContract = new Multicall(ctx, { height: latestBlockNumber }, multicall.address);
  const nameResults = await multicallContract.tryAggregate(erc721.functions.name, calls, multicall.batchSize);
  const symbolResults = await multicallContract.tryAggregate(erc721.functions.symbol, calls, multicall.batchSize);
  for (let i = 0; i < nameResults.length; i++) {
    if (nameResults[i].success) collections[i].name = nameResults[i].value;
    if (symbolResults[i].success) collections[i].symbol = symbolResults[i].value;
  }
}

export async function fillTokenData(
  ctx: Context,
  latestBlockNumber: number,
  collections: TokenCollectionEntity[],
): Promise<undefined> {
  const multicall = MULTICALL_CONTRACTS_BY_BLOCKCHAIN.get(BLOCKCHAIN);
  if (!multicall) {
    ctx.log.error(`Multicall contract for ${BLOCKCHAIN} not defined`);
    return;
  }
  const calls = collections.map((collection) => [collection.address, []] as [string, any[]]);

  const multicallContract = new Multicall(ctx, { height: latestBlockNumber }, multicall.address);
  const nameResults = await multicallContract.tryAggregate(erc20.functions.name, calls, multicall.batchSize);
  const symbolResults = await multicallContract.tryAggregate(erc20.functions.symbol, calls, multicall.batchSize);
  const decimalsResults = await multicallContract.tryAggregate(erc20.functions.decimals, calls, multicall.batchSize);

  for (let i = 0; i < nameResults.length; i++) {
    if (nameResults[i].success) collections[i].name = nameResults[i].value;
    if (symbolResults[i].success) collections[i].symbol = symbolResults[i].value;
    if (decimalsResults[i].success) collections[i].decimals = decimalsResults[i].value;
  }
}

export async function fillCollectionUris(
  ctx: Context,
  latestBlockNumber: number,
  collections: NftCollectionEntity[],
): Promise<undefined> {
  const multicall = MULTICALL_CONTRACTS_BY_BLOCKCHAIN.get(BLOCKCHAIN);
  if (!multicall) {
    ctx.log.error(`Multicall contract for ${BLOCKCHAIN} not defined`);
    return;
  }
  const calls = collections.map((collection) => [collection.address, []] as [string, any[]]);
  const multicallContract = new Multicall(ctx, { height: latestBlockNumber }, multicall.address);

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
