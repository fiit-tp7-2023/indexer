import {In} from 'typeorm'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import { v4 as uuidv4 } from 'uuid';
import * as erc721 from './abi/erc721'
import * as erc20 from './abi/erc20'
import * as erc1155 from './abi/erc1155'
import {ContractType, NftCollectionEntity, NftEntity, NftTransferEntity, Blockchain, TokenCollectionEntity, TokenTransferEntity} from './model'
import {Block, BLOCKCHAIN, Context, Log, Transaction, processor} from './processor'
import {fillNftsMetadata, fillNftCollectionsMetadata}from './utils/metadata'
import { CONTRACTS_TO_INDEX, MULTICALL_CONTRACTS_BY_BLOCKCHAIN } from './utils/constants';
import { TransferEvent, Cache } from './utils/interfaces';
import { Multicall } from './abi/multicall';



const cache: Cache = {
    NftCollections: new Map(),
    TokenCollections: new Map(),
    Nfts: new Map(),
    NftTransfers: [],
    TokenTransfers: []
}

processor.run(new TypeormDatabase({supportHotBlocks: true}), async (ctx) => {
    let TransfersERC721: TransferEvent[] = []
    _clearCache();
   
    const latestBlockNumber =  parseInt(await ctx._chain.client.call('eth_blockNumber'))
    for (let block of ctx.blocks) {
        for (let log of block.logs) {
            if (
                CONTRACTS_TO_INDEX.some(contract => contract.address == log.address) &&
                log.topics[0] === erc721.events.Transfer.topic &&
                log.topics.length === 4
            ) {
                const {from, to, tokenId} = erc721.events.Transfer.decode(log);
                TransfersERC721.push({
                    id: uuidv4(),
                    block: log.block,
                    from: from,
                    to: to,
                    tokenIds: [tokenId],
                    amounts: [BigInt(1)],
                    contractAddress: log.address,
                    blockchain: BLOCKCHAIN,
                    contractType: ContractType.erc721
                })
            }
            else if(
                CONTRACTS_TO_INDEX.some(contract => contract.address == log.address) &&
                log.topics[0] === erc20.events.Transfer.topic &&
                log.topics.length === 3
            ) {
                // TODO Handle ERC20 Transfer event
            }
            else if(
                CONTRACTS_TO_INDEX.some(contract => contract.address == log.address) &&
                 log.topics[0] === erc1155.events.TransferSingle.topic
            ) {
                // TODO Handle ERC1155 TransferSingle event
            }
            else if(
                CONTRACTS_TO_INDEX.some(contract => contract.address == log.address) &&
                 log.topics[0] === erc1155.events.TransferBatch.topic
            ) {
                // TODO handle ERC1155 TransferBatch event
            }
        }
    }

    
    await processTransfersERC721(ctx, latestBlockNumber, cache, TransfersERC721)


    await ctx.store.upsert([...cache.NftCollections.values()])
    await ctx.store.upsert([...cache.TokenCollections.values()])
    await ctx.store.upsert([...cache.Nfts.values()])
    await ctx.store.insert(cache.NftTransfers)
    await ctx.store.insert(cache.TokenTransfers)
})

export function _clearCache(){
    cache.NftCollections.clear()
    cache.Nfts.clear()
    cache.TokenCollections.clear()
    cache.NftTransfers = []
    cache.TokenTransfers = []
}


export function* splitIntoBatches<T>(list: T[], maxBatchSize: number = 15000): Generator<T[]> {
    if (list.length <= maxBatchSize) {
        yield list
    } else {
        let offset = 0
        while (list.length - offset > maxBatchSize) {
            yield list.slice(offset, offset + maxBatchSize)
            offset += maxBatchSize
        }
        yield list.slice(offset)
    }
}

export function getNftEntityId(contractAddress: string, blockchain: string, tokenId: bigint): string {
    return `${contractAddress}_${blockchain}_${tokenId}`
}

export function getCollectionEntityId(contractAddress: string, blockchain: string): string {
    return `${contractAddress}_${blockchain}`
}

export function getCollectionEntityIdFromNftId(NftId: string): string {
    return NftId.slice(0, NftId.indexOf('_', 43));
}

async function processTransfersERC721(ctx: Context, latestBlockNumber: number, cache: Cache, transfersData: TransferEvent[]) {
    let nftsData: Map<string, TransferEvent> = new Map()
    transfersData.forEach(transferData => {
        nftsData.set(
            getNftEntityId(transferData.contractAddress, Blockchain.eth, transferData.tokenIds[0]),
            transferData
        )
    });
    await getOrCreateNfts(ctx, latestBlockNumber, cache, nftsData);
    transfersData.forEach(transferData => {
        const nftId = getNftEntityId(transferData.contractAddress, Blockchain.eth, transferData.tokenIds[0])
        const nft = cache.Nfts.get(nftId)
        if(nft !== undefined){
            cache.NftTransfers.push(new NftTransferEntity({
                id: transferData.id,
                fromAddress: transferData.from,
                toAddress: transferData.to,
                nft: nft,
                amount: BigInt(1)
            }))
        } else {
            ctx.log.error(`NFT with id ${nftId} not found`)
        }
        
    })
}


export async function getOrCreateNfts(ctx: Context, latestBlockNumber: number, cache: Cache, nftsData: Map<string, TransferEvent>){
    for (let batch of splitIntoBatches([...nftsData.keys()])){
        (await ctx.store.findBy(NftEntity, { id: In(batch) })).map((entity) => {
            cache.Nfts.set(entity.id, entity)
            nftsData.delete(entity.id)
        });
    }

    const collectionsData: Map<string, TransferEvent> = new Map()
    for(const nftData of nftsData.values()){
        collectionsData.set(
            getCollectionEntityId(nftData.contractAddress, nftData.blockchain),
            nftData
        )
    }
    await getOrCreateNftCollections(ctx, latestBlockNumber, cache, collectionsData)
    for (let batch of splitIntoBatches([...nftsData.entries()], 100)){
        const batchNfts = [];
        for(const [nftId, nftData] of batch){
            const collectionId = getCollectionEntityId(nftData.contractAddress, nftData.blockchain)
            const nftCollenction = cache.NftCollections.get(collectionId)

            let nftEntity = new NftEntity({
                id: nftId,
                tokenId: nftData.tokenIds[0],
                nftCollection: nftCollenction
           });
           nftEntity.uri = await getTokenUri(ctx, latestBlockNumber, nftEntity);
           batchNfts.push(nftEntity);
           cache.Nfts.set(nftId, nftEntity);
        }
        await fillNftsMetadata(ctx, batchNfts);
        await new Promise(f => setTimeout(f, 3000));
    }
}


export async function getOrCreateNftCollections(ctx: Context, latestBlockNumber: number, cache: Cache, collectionsData: Map<string, TransferEvent>){
    for (let batch of splitIntoBatches([...collectionsData.keys()])){
        (await ctx.store.findBy(NftCollectionEntity, { id: In(batch) })).map((entity) => {
            cache.NftCollections.set(entity.id, entity)
            cache.NftCollections.delete(entity.id)
        });
    }

    const batchCollections = [];
    for(const[collectionId, collectionData] of collectionsData){
       let nftCollenctionEntity = new NftCollectionEntity({
            id: collectionId,
            address: collectionData.contractAddress,
            blockchain: collectionData.blockchain,
            contractType: collectionData.contractType
       });
       
       batchCollections.push(nftCollenctionEntity)
       cache.NftCollections.set(collectionId, nftCollenctionEntity);
    }
    await fillContractUris(ctx, latestBlockNumber, batchCollections)
    await fillNftCollectionsMetadata(ctx, batchCollections);
}

export async function getTokenUri(ctx: Context, latestBlockNumber: number, token: NftEntity): Promise<string|undefined>{
    let tokenUri = token.nftCollection.baseUri 
      ? token.nftCollection.baseUri.replace('{id}', token.tokenId.toString()) 
      : null;
  
    if (!tokenUri) {
      try {
        const contract = new erc721.Contract(ctx, { height: latestBlockNumber }, token.nftCollection.address);
        tokenUri = await contract.tokenURI(token.tokenId);
        if (tokenUri.includes('{id}')) {
          token.nftCollection.baseUri = tokenUri;
          tokenUri = tokenUri.replace('{id}', token.tokenId.toString());
        }
      } catch (e) {
        ctx.log.warn(`Failed to get tokenURI for token ${token.id} ${(e as Error).message}`);
        return;
      }
    }
    return tokenUri
}

export async function getCollectionData(ctx: Context, latestBlockNumber: number, collection: NftCollectionEntity): Promise<{name: string|null, symbol: string|null}>{
    const contract = new erc721.Contract(ctx, {height: latestBlockNumber}, collection.address);
    try{
        const [name, symbol] = await Promise.all([contract.name(), contract.symbol()])
        return {name: name, symbol: symbol}
    } catch (e){
        ctx.log.warn(`ContractMetadata (name, symbol) ERROR ${collection.address}  ${(e as Error).message}`)
        return {name: null, symbol: null}
    }
}

export async function fillContractUris(ctx: Context, latestBlockNumber: number, collections: NftCollectionEntity[]) {
    const multicall = MULTICALL_CONTRACTS_BY_BLOCKCHAIN.get(BLOCKCHAIN)
    if(!multicall){
        ctx.log.error(`Multicall contract for ${BLOCKCHAIN} not defined`)
        return null
    }
    const calls = collections.map(collection => ([
        collection.address, []
    ] as [string, any[]]))
    const multicallContract = new Multicall(ctx, {height: latestBlockNumber}, multicall.address)
    const results = await multicallContract.tryAggregate(
        erc721.functions.contractURI,
        calls,
        multicall.batchSize
    )
    results.forEach((res, i) => {
        if(res.success){
            collections[i].uri = res.value
        } else{
            collections[i].uri = null
        }
    }) 
    
}






