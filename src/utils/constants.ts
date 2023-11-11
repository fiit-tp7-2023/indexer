import { Blockchain, ContractType } from "../model";
import { IndexContract, MulticallContract } from "./interfaces";

export const ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;

export const CONTRACTS_TO_INDEX: IndexContract[] = [
    {
        address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'.toLowerCase(),
        type: ContractType.erc721,
        blockchain: Blockchain.eth,
        name:'Bored-apes'
    },
    {
        address: '0x17eD38f5F519C6ED563BE6486e629041Bed3dfbC'.toLowerCase(),
        type: ContractType.erc721,
        blockchain: Blockchain.eth,
        name:'PXQuest'
    },

]

export const MULTICALL_CONTRACTS_BY_BLOCKCHAIN: Map<string, MulticallContract> = new Map([
    [Blockchain.eth, {address: '0xcA11bde05977b3631167028862bE2a173976CA11', blockchain: Blockchain.eth, batchSize: 100}]
])