import { NftTransferEntity, TokenTransferEntity, NftOwnerEntity } from '../model';
import { EntityRepository } from '../repositories/EntityRepository';
import { Context } from '../processor';
import { TransferEvent, NftOwnerData } from '../utils/interfaces';
import { AccountService } from './AccountService';
import { NftService } from './NftService';
import { TokenService } from './TokenService';
import { ZERO_ADDRESS } from '../utils/constants';

export class TransferService {
  nftOwnerStorage: EntityRepository<NftOwnerEntity>;
  constructor(
    private ctx: Context,
    private accountService: AccountService,
    private nftService: NftService,
    private tokenService: TokenService,
  ) {
    this.nftOwnerStorage = new EntityRepository(this.ctx, NftOwnerEntity);
  }

  private getNftOwnerId(ownerId: string, nftId: string): string {
    return `${ownerId}_${nftId}`;
  }

  async getNftOwnersInTransferEvents(events: TransferEvent[]): Promise<Map<string, NftOwnerData>> {
    const nftOwners = new Map<string, NftOwnerData>();
    events.forEach((event) => {
      const nftId = this.nftService.getNftId(event.contractAddress, event.blockchain, event.tokenId);
      const fromOwnerKey = this.getNftOwnerId(event.from, nftId);
      const toOwnerKey = this.getNftOwnerId(event.to, nftId);
      if (!nftOwners.has(fromOwnerKey)) {
        nftOwners.set(fromOwnerKey, { id: fromOwnerKey, ownerId: event.from, nftId });
      }
      if (!nftOwners.has(toOwnerKey)) {
        nftOwners.set(toOwnerKey, { id: toOwnerKey, ownerId: event.to, nftId });
      }
    });
    return nftOwners;
  }

  async processNftTransfers(nftsTransfers: TransferEvent[]): Promise<void> {
    await this.loadNftOwners(nftsTransfers);
    const nftTransferEntities = [];
    for (const transfer of nftsTransfers) {
      try {
        const nftId = this.nftService.getNftId(transfer.contractAddress, transfer.blockchain, transfer.tokenId);
        const nft = await this.nftService.nftStorage.get(nftId);
        const fromAccount = await this.accountService.accountStorage.getOrFail(transfer.from);
        const toAccount = await this.accountService.accountStorage.getOrFail(transfer.to);
        if (!nft) {
          throw new Error(`NFT with id ${nftId} not found`);
        }
        nftTransferEntities.push(
          new NftTransferEntity({
            id: transfer.id,
            fromAddress: fromAccount,
            toAddress: toAccount,
            nft,
            amount: transfer.amount,
            createdAtBlock: transfer.block.height,
          }),
        );
        await this.updateNftOwners(nftId, transfer);
      } catch (error: any) {
        console.error(`Error processing transfer: ${error.message}`);
      }
    }
    await Promise.all([this.ctx.store.insert(nftTransferEntities), this.nftOwnerStorage.commit()]);
  }

  private async updateNftOwners(nftId: string, transfer: TransferEvent): Promise<void> {
    const fromOwnerKey = this.getNftOwnerId(transfer.from, nftId);
    const toOwnerKey = this.getNftOwnerId(transfer.to, nftId);

    const [fromOwner, toOwner] = await Promise.all([
      this.nftOwnerStorage.get(fromOwnerKey),
      this.nftOwnerStorage.get(toOwnerKey),
    ]);

    if (fromOwner) {
      fromOwner.amount -= transfer.amount;
      await this.nftOwnerStorage.createNewEntity(fromOwner);
    }
    if (toOwner) {
      toOwner.amount += transfer.amount;
      await this.nftOwnerStorage.createNewEntity(toOwner);
    }
  }

  async loadNftOwners(nftsTransfers: TransferEvent[]): Promise<void> {
    const nftOwners = await this.getNftOwnersInTransferEvents(nftsTransfers);
    const { notFound } = await this.nftOwnerStorage.loadEntitiesFromStorage(new Set(nftOwners.keys()));
    for (const [nftOwnerId, owner] of nftOwners) {
      if (notFound.has(nftOwnerId)) {
        const nftOwnerEntity = new NftOwnerEntity({
          id: nftOwnerId,
          nft: await this.nftService.nftStorage.getOrFail(owner.nftId),
          owner: await this.accountService.accountStorage.getOrFail(owner.ownerId),
          amount: BigInt(0),
        });
        await this.nftOwnerStorage.createNewEntity(nftOwnerEntity);
      }
    }
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
            fromAddress: await this.accountService.accountStorage.getOrFail(transfer.from),
            toAddress: await this.accountService.accountStorage.getOrFail(transfer.to),
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
