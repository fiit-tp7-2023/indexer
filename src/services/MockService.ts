import { ContractType, NftEntity, NftTransferEntity } from '../model';
import { Context } from '../processor';
import { ZERO_ADDRESS, mockNftCollections, mockNftTransfers, mockNfts } from '../utils/constants';
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
        from: ZERO_ADDRESS,
        to: transfer.to,
        contractAddress: mockedNfts[transfer.mockNftIndex].nftCollection.address,
        tokenId: mockedNfts[transfer.mockNftIndex].tokenId,
        amount: BigInt(1),
        blockchain: mockedNfts[transfer.mockNftIndex].nftCollection.blockchain,
        contractType: mockedNfts[transfer.mockNftIndex].nftCollection.contractType ?? ContractType.ERC721,
        block: emptyMockBlock,
      });
    }
    return transferEvents;
  }
}
