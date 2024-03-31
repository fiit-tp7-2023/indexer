import { Blockchain, ContractType } from '../model';
import { MulticallContract } from './interfaces';
import { NftCollectionEntity, NftEntity } from '../model';

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
      {
        address: '0x76BE3b62873462d2142405439777e971754E8E77'.toLowerCase(), // 11930426
        type: ContractType.ERC1155,
        blockchain: Blockchain.ETH,
        name: 'Parallel Alpha',
      }, // {
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

export const mockNftCollections = [
  new NftCollectionEntity({
    id: '0x0000000000000000000000000000000000000001_ETH',
    address: '0x0000000000000000000000000000000000000001'.toLowerCase(),
    name: 'Mock NFT Collection 1',
    blockchain: Blockchain.ETH,
    contractType: ContractType.ERC721,
    owner: '0x0000000000000000000000000000000000000001'.toLowerCase(),
    symbol: 'MNC1',
    description: 'Mock NFT Collection 1 Description',
    image: 'https://nftplazas.com/wp-content/uploads/2023/02/All-You-Need-to-Know-About-the-Checks-NFT-Collection.png',
    externalLink: '',
    uri: '',
    baseUri: '',
    createdAtBlock: 0,
  }),
];

export const mockNfts = [
  new NftEntity({
    id: '0x0000000000000000000000000000000000000001_ETH_1',
    tokenId: BigInt(1),
    name: 'Mock NFT 1',
    description: 'Mock NFT 1 Description',
    image: 'https://logowik.com/content/uploads/images/nft-icon4363.logowik.com.webp',
    animationUrl:
      'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.behance.net%2Fgallery%2F149452517%2FMystics-Animating-A-NFT-Collection&psig=AOvVaw1M3fgzugK1D0EvIi11824G&ust=1711966790470000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCODQg7WjnoUDFQAAAAAdAAAAABAE',
    externalUrl: '',
    attributes: [
      {
        trait_type: 'Background',
        value: 'Green',
      },
      {
        trait_type: 'Eyes',
        value: 'Blue',
      },
      {
        trait_type: 'Mouth',
        value: 'Smile',
      },
    ],
    uri: '',
    nftCollection: mockNftCollections[0],
    createdAtBlock: 0,
  }),
];

export const mockNftTransfers = [
  {
    mockNftCollectionIndex: 0,
    mockNftIndex: 0,
    amount: BigInt(1),
    to: '0x0000000000000000000000000000000000000001'.toLowerCase(),
  },
];
