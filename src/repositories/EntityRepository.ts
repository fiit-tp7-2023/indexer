import { Entity, EntityClass } from '@subsquid/typeorm-store';
import { Context } from '../processor';
import { splitIntoBatches } from '../utils/helpers';
import { NftEntity } from '../model';
import { FindOptionsWhere, In } from 'typeorm';

export class EntityRepository<T extends Entity> {
  private entityClass: new () => T;
  existingEntities: Map<string, T>;
  newEntities: Map<string, T>;
  ctx: Context;

  constructor(_ctx: Context, entityClass: new () => T) {
    this.ctx = _ctx;
    this.entityClass = entityClass;
    this.existingEntities = new Map();
    this.newEntities = new Map();
  }

  async loadEntitiesFromStorage(ids: Set<string>): Promise<{ nftById: Map<string, T>; notFound: Set<string> }> {
    const notFound = new Set(ids);
    for (let batch of splitIntoBatches([...ids])) {
      (await this.ctx.store.findBy(this.entityClass, { id: In(batch) } as FindOptionsWhere<T>)).map((entity) => {
        this.existingEntities.set(entity.id, entity);
        notFound.delete(entity.id);
      });
    }
    return { nftById: this.existingEntities, notFound };
  }

  async createNewEntity(entity: T): Promise<void> {
    this.newEntities.set(entity.id, entity);
  }

  async get(id: string): Promise<T | undefined> {
    return this.existingEntities.get(id) || this.newEntities.get(id);
  }

  async getOrFail(id: string): Promise<T | undefined> {
    const entity = await this.get(id);
    if (!entity) throw new Error(`Entity ${this.entityClass.name} with id ${id} not found`);
    return entity;
  }

  async saveNewIntoStorage(): Promise<void> {
    await this.ctx.store.insert([...this.newEntities.values()]);
  }
}
