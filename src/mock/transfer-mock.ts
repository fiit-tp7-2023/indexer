import { MockNftTransfer } from '../utils/interfaces';

export const mockNftTransfers: MockNftTransfer[] = [
  {
    mockNftIndex: 0,
    amount: BigInt('1'),
    to: '0xFa85ef821C17BD3C4c02298DF335b8187088363F'.toLowerCase(),
  },
  {
    mockNftIndex: 1,
    amount: BigInt('1'),
    to: '0x1804947E08e37eE0966Cc28EE169b4c6F7E42ae2'.toLowerCase(),
  },
  {
    mockNftIndex: 2,
    amount: BigInt('10'),
    to: '0x1804947E08e37eE0966Cc28EE169b4c6F7E42ae2'.toLowerCase(),
  },
  {
    mockNftIndex: 2,
    amount: BigInt('5'),
    to: '0xFa85ef821C17BD3C4c02298DF335b8187088363F'.toLowerCase(),
  },
];
