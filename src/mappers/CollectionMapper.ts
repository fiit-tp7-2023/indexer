export class CollectionMapper {
  static getCollectionEntityId(contractAddress: string, blockchain: string): string {
    return `${contractAddress}_${blockchain}`;
  }

  static getCollectionEntityIdFromNftId(NftId: string): string {
    return NftId.slice(0, NftId.indexOf('_', 43));
  }
}
