import { NftCollectionEntity, Blockchain, ContractType } from '../model';

export const mockNftCollections: NftCollectionEntity[] = [
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
  new NftCollectionEntity({
    id: '0x0000000000000000000000000000000000000002_ETH',
    address: '0x0000000000000000000000000000000000000002'.toLowerCase(),
    name: 'Mock NFT Collection 2',
    blockchain: Blockchain.ETH,
    contractType: ContractType.ERC1155,
    owner: '0x0000000000000000000000000000000000000001'.toLowerCase(),
    description: 'Mock NFT Collection 1 Description',
    image: 'https://moralis.io/wp-content/uploads/2023/03/erc1155.png',
    externalLink: '',
    uri: '',
    baseUri: '',
    createdAtBlock: 0,
  }),
];
