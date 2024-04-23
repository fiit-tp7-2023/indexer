import { NftEntity } from '../model';
import { mockNftCollections } from './collection-mock';

export const mockNfts: NftEntity[] = [
  new NftEntity({
    id: '0x0000000000000000000000000000000000000001_eth_1',
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
    id: '0x0000000000000000000000000000000000000001_eth_2',
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
    id: '0x0000000000000000000000000000000000000001_eth_3',
    tokenId: BigInt(3),
    name: 'Azuki #3138 MOCK',
    image: 'ipfs://QmYDvPAXtiJg7s8JdRBSLWdgSphQdac8j1YuQNNxcGE1hg/3138.png',
    attributes: [
      {
        trait_type: 'Type',
        value: 'Human',
      },
      {
        trait_type: 'Hair',
        value: 'Powder Blue Disheveled',
      },
      {
        trait_type: 'Clothing',
        value: 'Light Kimono',
      },
      {
        trait_type: 'Eyes',
        value: 'White',
      },
      {
        trait_type: 'Mouth',
        value: 'Relaxed',
      },
      {
        trait_type: 'Offhand',
        value: 'Bean Juice',
      },
      {
        trait_type: 'Background',
        value: 'Off White D',
      },
    ],
    uri: '',
    nftCollection: mockNftCollections[0],
    createdAtBlock: 0,
  }),
  new NftEntity({
    id: '0x0000000000000000000000000000000000000001_eth_4',
    tokenId: BigInt(4),
    name: 'Azuki #3500 MOCK',
    image: 'ipfs://QmYDvPAXtiJg7s8JdRBSLWdgSphQdac8j1YuQNNxcGE1hg/3500.png',
    attributes: [
      {
        trait_type: 'Type',
        value: 'Human',
      },
      {
        trait_type: 'Hair',
        value: 'Buzzcut',
      },
      {
        trait_type: 'Headgear',
        value: 'Frog Baseball Cap',
      },
      {
        trait_type: 'Ear',
        value: 'Ear Cuffs',
      },
      {
        trait_type: 'Face',
        value: 'Reading Glasses',
      },
      {
        trait_type: 'Clothing',
        value: 'Kimono with Jacket',
      },
      {
        trait_type: 'Eyes',
        value: 'Closed',
      },
      {
        trait_type: 'Mouth',
        value: 'Sleep Bubble',
      },
      {
        trait_type: 'Background',
        value: 'Dark Blue',
      },
    ],
    uri: '',
    nftCollection: mockNftCollections[0],
    createdAtBlock: 0,
  }),
  new NftEntity({
    id: '0x0000000000000000000000000000000000000001_eth_5',
    tokenId: BigInt(5),
    name: 'Pudgy Penguin #151 MOCK',
    description: 'A collection 8888 Cute Chubby Pudgy Penquins sliding around on the freezing ETH blockchain.',
    image: 'ipfs://QmNf1UsmdGaMbpatQ6toXSkzDpizaGmC9zfunCyoz1enD5/penguin/151.png',
    attributes: [
      {
        trait_type: 'Background',
        value: 'Purple',
      },
      {
        trait_type: 'Skin',
        value: 'Light Gray',
      },
      {
        trait_type: 'Body',
        value: 'Apron',
      },
      {
        trait_type: 'Face',
        value: 'Circle Glasses',
      },
      {
        trait_type: 'Head',
        value: 'Afro With Pick',
      },
    ],
    uri: '',
    nftCollection: mockNftCollections[0],
    createdAtBlock: 0,
  }),
  new NftEntity({
    id: '0x0000000000000000000000000000000000000001_eth_6',
    tokenId: BigInt(6),
    name: 'Pudgy Penguin #200 MOCK',
    description: 'A collection 8888 Cute Chubby Pudgy Penquins sliding around on the freezing ETH blockchain.',
    image: 'ipfs://QmNf1UsmdGaMbpatQ6toXSkzDpizaGmC9zfunCyoz1enD5/penguin/200.png',
    attributes: [
      {
        trait_type: 'Background',
        value: 'Yellow',
      },
      {
        trait_type: 'Skin',
        value: 'Dark Gray',
      },
      {
        trait_type: 'Body',
        value: 'Crop Top',
      },
      {
        trait_type: 'Face',
        value: 'Circle Glasses',
      },
      {
        trait_type: 'Head',
        value: 'Backwards Hat Blue',
      },
    ],
    uri: '',
    nftCollection: mockNftCollections[0],
    createdAtBlock: 0,
  }),
  new NftEntity({
    id: '0x0000000000000000000000000000000000000002_eth_1',
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
  new NftEntity({
    id: '0x0000000000000000000000000000000000000002_eth_2',
    tokenId: BigInt(2),
    name: 'Prismatic Key MOCK',
    description: 'Change is a constant. The prismatic colors last only for a matter of moments',
    image: 'https://nftmedia.parallelnft.com/parallel-alpha/QmPBM3hvi8dZ2CFwDSeJHTSWPkr3au7unMDSEckBaLwMHR/image.gif',
    animationUrl:
      'https://nftmedia.parallelnft.com/parallel-alpha/QmPBM3hvi8dZ2CFwDSeJHTSWPkr3au7unMDSEckBaLwMHR/animation.mp4',
    externalUrl: 'https://rarible.com/token/0x76be3b62873462d2142405439777e971754e8e77:10933',
    attributes: [
      {
        key: 'Rarity',
        trait_type: 'Rarity',
        value: 'Prime',
      },
      {
        key: 'Class',
        trait_type: 'Class',
        value: 'Asset',
      },
      {
        key: 'Parallel',
        trait_type: 'Parallel',
        value: 'Universal',
      },
      {
        key: 'Artist',
        trait_type: 'Artist',
        value: 'Oscar Mar',
      },
    ],
    uri: '',
    nftCollection: mockNftCollections[1],
    createdAtBlock: 0,
  }),
  new NftEntity({
    id: '0x0000000000000000000000000000000000000002_eth_3',
    tokenId: BigInt(3),
    name: 'TE4 Interceptor [SE] MOCK',
    description:
      'Ships come in many shapes & sizes. Interceptor-class vessels are designed as hunter-killers, far outmaneuvering larger craft.',
    image: 'https://nftmedia.parallelnft.com/parallel-alpha/QmSJB3rokhG9fmWpiP2pV2b2hCFQP3EzbMfP6wVLgqK5PC/image.png',
    externalUrl: 'https://rarible.com/token/0x76be3b62873462d2142405439777e971754e8e77:10567',
    attributes: [
      {
        key: 'Artist',
        trait_type: 'Artist',
        value: 'Oscar Cafaro',
      },
      {
        key: 'Parallel',
        trait_type: 'Parallel',
        value: 'Universal',
      },
      {
        key: 'Rarity',
        trait_type: 'Rarity',
        value: 'Common',
      },
      {
        key: 'Class',
        trait_type: 'Class',
        value: 'SE',
      },
    ],
    uri: '',
    nftCollection: mockNftCollections[1],
    createdAtBlock: 0,
  }),
  new NftEntity({
    id: '0x0000000000000000000000000000000000000002_eth_4',
    tokenId: BigInt(4),
    name: 'Unstable Drone [SE] MOCK',
    description:
      'Many an enemy of Mars has managed to take down such a machine, only to learn of the immediately fatal consequences.',
    image: 'https://nftmedia.parallelnft.com/parallel-alpha/QmNPjarRfLsNU2DS4iMme2nSfWuQKSSB6sGHeuijT6viZh/image.png',
    externalUrl: 'https://rarible.com/token/0x76be3b62873462d2142405439777e971754e8e77:10337',
    attributes: [
      {
        key: 'Artist',
        trait_type: 'Artist',
        value: 'Oscar Mar',
      },
      {
        key: 'Parallel',
        trait_type: 'Parallel',
        value: 'Marcolian',
      },
      {
        key: 'Rarity',
        trait_type: 'Rarity',
        value: 'Common',
      },
      {
        key: 'Class',
        trait_type: 'Class',
        value: 'SE',
      },
    ],
    uri: '',
    nftCollection: mockNftCollections[1],
    createdAtBlock: 0,
  }),
];
