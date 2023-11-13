import { ContractMetadata } from '../utils/interfaces';

export class MetadataMapper {
  static async mapCollectionMetadata(rawMetadata: any): Promise<ContractMetadata> {
    return {
      name: typeof rawMetadata?.name === 'string' ? rawMetadata.name : undefined,
      description: typeof rawMetadata?.description === 'string' ? rawMetadata.description : undefined,
      image:
        typeof rawMetadata?.image === 'string'
          ? rawMetadata.image
          : typeof rawMetadata?.thumbnailUri === 'string'
            ? rawMetadata.thumbnailUri
            : typeof rawMetadata?.mediaUri === 'string'
              ? rawMetadata.mediaUri
              : undefined,
      externalLink: typeof rawMetadata?.external_link === 'string' ? rawMetadata.external_link : undefined,
    };
  }
}
