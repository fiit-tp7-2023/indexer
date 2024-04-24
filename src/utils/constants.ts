import { Blockchain, ContractType } from '../model';
import { MulticallContract } from './interfaces';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const INDEX_CONFIG = {
  ETH: {
    block_range: { from: 0 },
    finality_confirmation: 10,
    filter_ERC20: true,
    filter_ERC721: false,
    filter_ERC1155: true,
    contract_filter: [
      {
        address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D'.toLowerCase(), // 12287507
        type: ContractType.ERC721,
        blockchain: Blockchain.ETH,
        name: 'Bored-apes',
      },
      {
        address: '0x17eD38f5F519C6ED563BE6486e629041Bed3dfbC'.toLowerCase(), // 13974723
        type: ContractType.ERC721,
        blockchain: Blockchain.ETH,
        name: 'PXQuest',
      },
      // {
      //   address: '0x76BE3b62873462d2142405439777e971754E8E77'.toLowerCase(), // 11930426
      //   type: ContractType.ERC1155,
      //   blockchain: Blockchain.ETH,
      //   name: 'Parallel Alpha',
      // }, // {
      //   address: '0xdAC17F958D2ee523a2206206994597C13D831ec7'.toLowerCase(), // 463474
      //   type: ContractType.ERC20,
      //   blockchain: Blockchain.ETH,
      //   name: 'USDT',
      // },
    ],
  },
};

export const MULTICALL_CONTRACTS_BY_BLOCKCHAIN: Map<string, MulticallContract> = new Map([
  [
    Blockchain.ETH,
    { address: '0xcA11bde05977b3631167028862bE2a173976CA11', blockchain: Blockchain.ETH, batchSize: 100 },
  ],
]);
