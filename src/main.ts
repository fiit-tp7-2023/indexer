import {In} from 'typeorm'
import {assertNotNull} from '@subsquid/evm-processor'
import {TypeormDatabase} from '@subsquid/typeorm-store'
import * as erc20 from './abi/erc20'
import { v4 as uuidv4 } from 'uuid';
import * as erc721 from './abi/erc721'
import {ContractType, NftCollectionEntity, NftEntity, NftTransferEntity, Blockchain} from './model'
import {Block, CONTRACT_ADDRESS, BLOCKCHAIN, Context, Log, Transaction, processor} from './processor'
import {parseContractMetadata, ContractMetadata}from './utils/metadata'
import { parse } from 'path';



interface TransferEvent {
    id: string,
    block: Block,
    from: string,
    to: string,
    tokenIds: bigint[]
    amounts: bigint[]
    contractAddress: string
    blockchain: Blockchain
    contractType: ContractType
}

interface Cache {
    NftCollections: Map<string, NftCollectionEntity>,
    Nfts: Map<string, NftEntity>,
    NftTransfers: NftTransferEntity[]
}




const cache: Cache = {
    NftCollections: new Map(),
    Nfts: new Map(),
    NftTransfers: []
}

processor.run(new TypeormDatabase({supportHotBlocks: true}), async (ctx) => {
    let TransfersERC721: TransferEvent[] = []

    cache.NftCollections.clear()
    cache.Nfts.clear()
    cache.NftTransfers = []

    const latestBlockNumber =  parseInt(await ctx._chain.client.call('eth_blockNumber'))
    console.log(latestBlockNumber)
    for (let block of ctx.blocks) {
        for (let log of block.logs) {
            if (log.address === CONTRACT_ADDRESS && log.topics[0] === erc721.events.Transfer.topic && log.topics.length === 4) {
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
        }
    }
    await processTransfersERC721(ctx, latestBlockNumber, cache, TransfersERC721)
    await ctx.store.upsert([...cache.NftCollections.values()])
    await ctx.store.upsert([...cache.Nfts.values()])
    await ctx.store.insert(cache.NftTransfers)
})


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

    for(const[nftId, nftData] of nftsData){
       const collectionId = getCollectionEntityId(nftData.contractAddress, nftData.blockchain)
       const nftCollenction = cache.NftCollections.get(collectionId)
       let nftEntity = new NftEntity({
            id: nftId,
            tokenId: nftData.tokenIds[0],
            nftCollection: nftCollenction
       });
       cache.Nfts.set(nftId, nftEntity);
    }
}


export async function getOrCreateNftCollections(ctx: Context, latestBlockNumber: number, cache: Cache, collectionsData: Map<string, TransferEvent>){
    for (let batch of splitIntoBatches([...collectionsData.keys()])){
        (await ctx.store.findBy(NftCollectionEntity, { id: In(batch) })).map((entity) => {
            cache.NftCollections.set(entity.id, entity)
            cache.NftCollections.delete(entity.id)
        });
    }

    for(const[collectionId, collectionData] of collectionsData){
       let nftCollenctionEntity = new NftCollectionEntity({
            id: collectionId,
            address: collectionData.contractAddress,
            blockchain: collectionData.blockchain,
            contractType: collectionData.contractType
       });
       await fillCollectionMetadata(ctx, latestBlockNumber, nftCollenctionEntity)
       cache.NftCollections.set(collectionId, nftCollenctionEntity);
    }
}

export async function fillCollectionMetadata(ctx: Context, latestBlockNumber: number, collection: NftCollectionEntity){
    const contract = new erc721.Contract(ctx, {height: latestBlockNumber}, collection.address);

    // const contract = new erc721.Contract(ctx, block, collection.address);
    let contractUri = null
    try{
        contractUri = await contract.contractURI();
    } catch{
        contractUri = null
    }
    if (contractUri !== null){
        collection.uri = contractUri
        Object.assign(collection, await parseContractMetadata(ctx, contractUri))
        
    } else {
        collection.name = await contract.name()
        collection.symbol = await contract.symbol()
    }

    try{
        collection.baseUri = await contract.baseURI()
        collection.baseUri = collection.baseUri.trim()
        if(!collection.baseUri.includes('{id}')){
            collection.baseUri = collection.baseUri + '{id}'
        }

    } catch {
        collection.baseUri = null
    }
}






