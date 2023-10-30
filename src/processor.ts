import {lookupArchive} from '@subsquid/archive-registry'
import {
    BlockHeader,
    DataHandlerContext,
    EvmBatchProcessor,
    EvmBatchProcessorFields,
    Log as _Log,
    Transaction as _Transaction,
} from '@subsquid/evm-processor'
import {Store} from '@subsquid/typeorm-store'
import * as erc721 from './abi/erc721'
import * as erc1155 from './abi/erc1155'
import { Blockchain } from './model'


export const CONTRACT_ADDRESSES: Map<string, string> = new Map([
    ['0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'.toLowerCase(), 'Bored-apes'], //12287507
    ['0x17eD38f5F519C6ED563BE6486e629041Bed3dfbC'.toLowerCase(), 'PXQuest'] // 13974723
])

export const BLOCKCHAIN = Blockchain.eth



export const processor = new EvmBatchProcessor()
    .setDataSource({
        archive: lookupArchive('eth-mainnet'),
        chain: `https://rpc.ankr.com/eth/${process.env.ANKR_KEY}`,
    })
    .setFinalityConfirmation(10)
    .setBlockRange({from: 12287507})
    .setFields({
        log: {
            topics: true,
            data: true,
        }
    })
    .addLog({
        address:[...CONTRACT_ADDRESSES.keys()],
        topic0: [erc721.events.Transfer.topic]
    })
    .addLog({
        address:[...CONTRACT_ADDRESSES.keys()],
        topic0: [erc1155.events.TransferSingle.topic, erc1155.events.TransferBatch.topic]
    })


export type Fields = EvmBatchProcessorFields<typeof processor>
export type Context = DataHandlerContext<Store, Fields>
export type Block = BlockHeader<Fields>
export type Log = _Log<Fields>
export type Transaction = _Transaction<Fields>
