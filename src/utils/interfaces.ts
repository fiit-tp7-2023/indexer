import { Blockchain, ContractType } from '../model';
import { Block } from '../processor';

export interface IndexContract {
  address: string;
  type: ContractType;
  blockchain: Blockchain;
  name: string;
}

export interface TransferEvent {
  id: string;
  block: Block;
  from: string;
  to: string;
  tokenId: bigint;
  amount: bigint;
  contractAddress: string;
  blockchain: Blockchain;
  contractType: ContractType;
}

export interface NftOwnerData {
  id: string;
  ownerId: string;
  nftId: string;
}

export interface CollectionData {
  id: string;
  contractAddress: string;
  blockchain: Blockchain;
  contractType: ContractType;
  createdAtBlock: number;
}

export interface NftData {
  id: string;
  tokenId: bigint;
  contractAddress: string;
  blockchain: Blockchain;
  contractType: ContractType;
  createdAtBlock: number;
}

export interface ContractMetadata {
  name?: string;
  description?: string;
  image?: string;
  externalLink?: string;
}

export interface AccountData {
  id: string;
  createdAtBlock: number;
}

export interface TokenMetadata {
  name?: string;
  description?: string;
  image?: string;
  externalUrl?: string;
  animationUrl?: string;
  attributes?: JSON;
}

export interface ipfsUri {
  uri: string;
  gatewayQueue: Generator<{ gateway: string; isLast: boolean }>;
}

export interface UrisBySource {
  ipfsUris: ipfsUri[];
  nonIpfsUris: Map<string, string[]>;
}

export interface MulticallContract {
  address: string;
  blockchain: Blockchain;
  batchSize: number;
}

export interface ContractFilter {
  address: string;
  type: ContractType;
  blockchain: Blockchain;
  name: string;
}

export interface IndexChainConfig {
  block_range: { from: number; to?: number };
  finality_confirmation: number;
  filter_ERC20: boolean;
  filter_ERC721: boolean;
  filter_ERC1155: boolean;
  contract_filter: ContractFilter[];
}
