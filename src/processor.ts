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
import * as erc20 from './abi/erc20'
import * as erc721 from './abi/erc721'
import { Blockchain } from './model'

export const CONTRACT_ADDRESS = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'.toLowerCase()
// export const CONTRACT_ADDRESS = '0x17eD38f5F519C6ED563BE6486e629041Bed3dfbC'.toLowerCase() // 13974723
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
        address: [CONTRACT_ADDRESS],
        topic0: [erc721.events.Transfer.topic]
    })
interface Cache{
    a: string
}
export type Fields = EvmBatchProcessorFields<typeof processor>
export type Context = DataHandlerContext<Store, Fields>
export type Block = BlockHeader<Fields>
export type Log = _Log<Fields>
export type Transaction = _Transaction<Fields>
