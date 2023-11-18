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
import { CONTRACTS_TO_INDEX } from './utils/constants';

export const BLOCKCHAIN = Blockchain.eth;

export const processor = new EvmBatchProcessor()
  .setDataSource({
    archive: lookupArchive('eth-mainnet'),
    chain: `https://rpc.ankr.com/eth/${process.env.ANKR_KEY}`,
  })
  .setFinalityConfirmation(10)
  .setBlockRange({ from: 12287507 })
  .setFields({
    log: {
      topics: true,
      data: true,
    },
  })
  .addLog({
    address: CONTRACTS_TO_INDEX.filter((contract) => contract.type === ContractType.erc721).map(
      (contract) => contract.address,
    ),
    topic0: [erc721.events.Transfer.topic],
  })
  .addLog({
    address: CONTRACTS_TO_INDEX.filter((contract) => contract.type === ContractType.erc20).map(
      (contract) => contract.address,
    ),
    topic0: [erc20.events.Transfer.topic],
  })
  .addLog({
    address: CONTRACTS_TO_INDEX.filter((contract) => contract.type === ContractType.erc1155).map(
      (contract) => contract.address,
    ),
    topic0: [erc1155.events.TransferSingle.topic, erc1155.events.TransferBatch.topic],
  });

export type Fields = EvmBatchProcessorFields<typeof processor>;
export type Context = DataHandlerContext<Store, Fields>;
export type Block = BlockHeader<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
