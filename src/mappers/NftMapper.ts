export class NftMapper {
  static getNftEntityId(contractAddress: string, blockchain: string, tokenId: bigint): string {
    return `${contractAddress}_${blockchain}_${tokenId}`;
  }
}
