import { NftEntity } from '../model';
import { mockNftCollections } from './collection-mock';

export const mockNfts: NftEntity[] = [
  new NftEntity({
    id: '0x0000000000000000000000000000000000000001_ETH_1',
    tokenId: BigInt(1),
    name: 'BlockGames Dice MOCK',
    description:
      'BlockGames Dice holders get early access to the Player Network. Holders also benefit from full use of $BLOCK, the token that represents the full value of the network.',
    image: 'https://nft.blockgames.com/dice/dices_multiplier_4.gif',
    externalUrl: '',
    attributes: [
      {
        trait_type: 'Background',
        value: 'Purple',
      },
      {
        trait_type: 'Type',
        value: 'Square',
      },
      {
        trait_type: 'Mouth',
        value: 'Smile',
      },
      {
        trait_type: 'Action',
        value: 'High Five',
      },
    ],
    uri: '',
    nftCollection: mockNftCollections[0],
    createdAtBlock: 0,
  }),

  new NftEntity({
    id: '0x0000000000000000000000000000000000000001_ETH_2',
    tokenId: BigInt(2),
    name: 'RTFKT - MNLTH 🗿 MOCK',
    description:
      'Behold a mysterious MNLTH, etched with Nike & RTFKT markings. It seems to be sentient . . . What does it do? 👁‍🗨\n\nDigital Collectible terms and condition apply, see https://rtfkt.com/legal-2D',
    image: 'https://ipfs.io/ipfs/QmaBKpKJBnde8fMd1H5Qa1c9QndoTU4bbS79zP7VPccJDD',
    animationUrl: 'https://ipfs.io/ipfs/QmZdSkRo9ZXfR25gmiAiQ2Hmr1tL4kM7zgrkHYi6T5qYbE',
    externalUrl: 'https://rtfkt.com',
    attributes: [
      {
        trait_type: 'Background',
        value: 'Blue',
      },
      {
        trait_type: 'Type',
        value: 'Square',
      },
      {
        trait_type: 'Style',
        value: 'Future',
      },
      {
        trait_type: 'TECH',
        value: 'DART X',
      },
      {
        trait_type: 'QUEST MODE',
        value: 'COMPLETED',
      },
    ],
    uri: '',
    nftCollection: mockNftCollections[0],
    createdAtBlock: 0,
  }),
  new NftEntity({
    id: '0x0000000000000000000000000000000000000002_ETH_1',
    tokenId: BigInt(1),
    name: 'Seers Stone [PL] MOCK',
    description: 'Do not discard the traditions of old, for sometimes they illuminate the path ahead.',
    image: 'https://nftmedia.parallelnft.com/parallel-alpha/QmXTBDfbktc5i8nhsQksh6tmtkpDuU64rj1fAUSdygb9qX/image.gif',
    animationUrl:
      'https://nftmedia.parallelnft.com/parallel-alpha/QmXTBDfbktc5i8nhsQksh6tmtkpDuU64rj1fAUSdygb9qX/animation.mp4',
    externalUrl: 'https://rarible.com/token/0x76be3b62873462d2142405439777e971754e8e77:10467',
    attributes: [
      {
        key: 'Artist',
        trait_type: 'Artist',
        value: 'Oscar Mar',
      },
      {
        key: 'Parallel',
        trait_type: 'Parallel',
        value: 'Universal',
      },
      {
        key: 'Rarity',
        trait_type: 'Rarity',
        value: 'Rare',
      },
      {
        key: 'Class',
        trait_type: 'Class',
        value: 'PL',
      },
    ],
    uri: '',
    nftCollection: mockNftCollections[1],
    createdAtBlock: 0,
  }),
];
