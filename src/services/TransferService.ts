import { NftTransferEntity, TokenTransferEntity } from '../model';
import { Context } from '../processor';
import { TransferEvent } from '../utils/interfaces';
import { AccountService } from './AccountService';
import { NftService } from './NftService';
import { TokenService } from './TokenService';

export class TransferService {
  constructor(
    private ctx: Context,
    private accuntService: AccountService,
    private nftService: NftService,
    private tokenService: TokenService,
  ) {}

  async processNftTransfers(nftsTransfers: TransferEvent[]): Promise<void> {
    const nftTransferEntities = [];
    for (const transfer of nftsTransfers) {
      const nftId = this.nftService.getNftId(transfer.contractAddress, transfer.blockchain, transfer.tokenId);
      const nft = await this.nftService.nftStorage.get(nftId);
      if (nft) {
        nftTransferEntities.push(
          new NftTransferEntity({
            id: transfer.id,
            fromAddress: await this.accuntService.accountStorage.getOrFail(transfer.from),
            toAddress: await this.accuntService.accountStorage.getOrFail(transfer.to),
            nft: nft,
            amount: transfer.amount,
            createdAtBlock: transfer.block.height,
          }),
        );
      } else {
        throw new Error(`NFT with id ${nftId} not found`);
      }
    }
    await this.ctx.store.insert(nftTransferEntities);
  }

  async processTokenTransfers(tokensTransfers: TransferEvent[]): Promise<void> {
    const tokenTransferEntities = [];
    for (const transfer of tokensTransfers) {
      const tokenId = this.tokenService.getTokenCollectionId(transfer.contractAddress, transfer.blockchain);
      const token = await this.tokenService.tokenCollectionStorage.get(tokenId);
      if (token) {
        tokenTransferEntities.push(
          new TokenTransferEntity({
            id: transfer.id,
            fromAddress: await this.accuntService.accountStorage.getOrFail(transfer.from),
            toAddress: await this.accuntService.accountStorage.getOrFail(transfer.to),
            token: token,
            amount: transfer.amount,
            createdAtBlock: transfer.block.height,
          }),
        );
      } else {
        throw new Error(`Token with id ${tokenId} not found`);
      }
    }
    await this.ctx.store.insert(tokenTransferEntities);
  }
}
