import { ContractType, NftEntity } from '../model';
import { Context } from '../processor';
import { ZERO_ADDRESS } from '../utils/constants';
import { mockNftTransfers } from '../mock/transfer-mock';
import { mockNfts } from '../mock/nft-mock';
import { mockNftCollections } from '../mock/collection-mock';
import { MockNftTransfer, TransferEvent } from '../utils/interfaces';
import { TransferService } from './TransferService';
import { v4 as uuid } from 'uuid';

export class MockService {
  constructor(
    private ctx: Context,
    private transferService: TransferService,
  ) {}

  public async getMockedNftTransfers(): Promise<TransferEvent[]> {
    await this.ctx.store.upsert(mockNftCollections);
    await this.ctx.store.upsert(mockNfts);
    return this.generateMockedNftTransfers(mockNftTransfers, mockNfts);
  }

  private generateMockedNftTransfers(mockedTrasfers: MockNftTransfer[], mockedNfts: NftEntity[]): TransferEvent[] {
    const emptyMockBlock = {
      height: 0,
      id: '',
      hash: '',
      parentHash: '',
      timestamp: 0,
    };
    const transferEvents: TransferEvent[] = [];
    for (const transfer of mockedTrasfers) {
      transferEvents.push({
        id: uuid(),
        from: ZERO_ADDRESS.toLowerCase(),
        to: transfer.to.toLowerCase(),
        contractAddress: mockedNfts[transfer.mockNftIndex].nftCollection.address.toLowerCase(),
        tokenId: mockedNfts[transfer.mockNftIndex].tokenId,
        amount: transfer.amount,
        blockchain: mockedNfts[transfer.mockNftIndex].nftCollection.blockchain,
        contractType: mockedNfts[transfer.mockNftIndex].nftCollection.contractType ?? ContractType.ERC721,
        block: emptyMockBlock,
      });
    }
    return transferEvents;
  }
}
