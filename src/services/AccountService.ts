import { Entity } from '@subsquid/typeorm-store';
import { EntityRepository } from '../repositories/EntityRepository';
import { AccountEntity } from '../model';
import { Context } from '../processor';
import { AccountData, TransferEvent } from '../utils/interfaces';
import { filterNotFound } from '../utils/helpers';

export class AccountService {
  accountStorage: EntityRepository<AccountEntity>;
  constructor(ctx: Context) {
    this.accountStorage = new EntityRepository(ctx, AccountEntity);
  }

  async getAccountsInTransferEvents(transfers: TransferEvent[]): Promise<Map<string, AccountData>> {
    const accounts: Map<string, AccountData> = new Map();
    for (const transfer of transfers) {
      if (!accounts.has(transfer.to)) {
        accounts.set(transfer.to, { id: transfer.to, createdAtBlock: transfer.block.height });
      }
      if (!accounts.has(transfer.from)) {
        accounts.set(transfer.from, { id: transfer.from, createdAtBlock: transfer.block.height });
      }
    }
    return accounts;
  }

  async loadAndCreateAccounts(transfers: TransferEvent[]): Promise<void> {
    const accounts = await this.getAccountsInTransferEvents(transfers);
    const { notFound } = await this.accountStorage.loadEntitiesFromStorage(new Set(accounts.keys()));
    const notFoundAccounts: AccountData[] = filterNotFound<AccountData>(accounts, notFound);
    await this.createAccounts(notFoundAccounts);
    await this.accountStorage.commit();
  }

  async createAccounts(accounts: AccountData[]): Promise<void> {
    for (const account of accounts) {
      await this.accountStorage.createNewEntity(new AccountEntity(account));
    }
  }
}
