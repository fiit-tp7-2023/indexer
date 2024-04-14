import { lookupArchive } from '@subsquid/archive-registry';
import {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
} from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import * as erc721 from './abi/erc721';
import * as erc1155 from './abi/erc1155';
import * as erc20 from './abi/erc20';
import { Blockchain, ContractType } from './model';
import { INDEX_CONFIG } from './utils/constants';
export const BLOCKCHAIN = Blockchain.ETH;

export const config = INDEX_CONFIG.ETH;

export const processor = new EvmBatchProcessor()
  .setDataSource({
    archive: lookupArchive('eth-mainnet'),
    chain: process.env.ETH_RPC_URL || 'https://rpc.ankr.com/eth',
  })
  .setFinalityConfirmation(config.finality_confirmation)
  .setBlockRange(config.block_range)
  .setFields({
    log: {
      topics: true,
      data: true,
    },
  })
  .addLog({
    address: config.filter_ERC721
      ? config.contract_filter
          .filter((contract) => contract.type === ContractType.ERC721)
          .map((contract) => contract.address)
      : undefined,
    topic0: [erc721.events.Transfer.topic],
  })
  .addLog({
    address: config.filter_ERC20
      ? config.contract_filter
          .filter((contract) => contract.type === ContractType.ERC20)
          .map((contract) => contract.address)
      : undefined,
    topic0: [erc20.events.Transfer.topic],
  })
  .addLog({
    address: config.filter_ERC1155
      ? config.contract_filter
          .filter((contract) => contract.type === ContractType.ERC1155)
          .map((contract) => contract.address)
      : undefined,
    topic0: [erc1155.events.TransferSingle.topic, erc1155.events.TransferBatch.topic],
  });

export type Fields = EvmBatchProcessorFields<typeof processor>;
export type Context = DataHandlerContext<Store, Fields>;
export type Block = BlockHeader<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
