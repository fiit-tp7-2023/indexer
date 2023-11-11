import { Blockchain, ContractType, NftCollectionEntity, NftEntity, NftTransferEntity, TokenCollectionEntity, TokenTransferEntity } from "../model"
import { Block } from "../processor"


export interface IndexContract {
    address: string
    type: ContractType
    blockchain: Blockchain
    name: string
}

export interface TransferEvent {
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

export interface Cache {
    NftCollections: Map<string, NftCollectionEntity>,
    TokenCollections: Map<string, TokenCollectionEntity>,
    Nfts: Map<string, NftEntity>,
    NftTransfers: NftTransferEntity[],
    TokenTransfers: TokenTransferEntity[]
}


export interface ContractMetadata {
    name?: string
    description?: string
    image?: string
    externalLink?: string
}

export interface TokenMetadata {
    name?: string
    description?: string
    image?: string
    externalUrl?: string,
    animationUrl?: string
    attributes?: JSON
}

export interface ipfsUri{
    uri: string
    gatewayQueue: Generator<{gateway: string, isLast: boolean}>
}

export interface UrisBySource {
    ipfsUris: ipfsUri[],
    nonIpfsUris: Map<string, string[]>
}

export interface MulticallContract {
    address: string
    blockchain: Blockchain
    batchSize: number
}