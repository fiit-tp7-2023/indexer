import Axios from 'axios'
import {Context} from '../processor'
export const GATEWAY_NUMBER_OF_RETRIES = 10
export const IPFS_GATEWAYS = [
    "https://nftstorage.link/", "https://ipfs.io/" , "https://gateway.ipfs.io/", "https://ipfs.apillon.io/", "https://ipfs2.rmrk.link/", "https://infura-ipfs.io", "https://kodadot1.infura-ipfs.io", 
]
import { NftEntity } from '../model'
import { NftCollectionEntity } from '../model'


export interface ContractMetadata {
    name?: string
    description?: string
    image?: string
    externalLink?: string
}


export interface TokenMetadata {
    name?: string
    description?: string
    image?: string
    externalUrl?: string,
    animationUrl?: string
    attributes?: JSON
}

export interface ipfsUri{
    uri: string
    gatewayQueue: Generator<{gateway: string, isLast: boolean}>
}

export interface UrisBySource {
    ipfsUris: ipfsUri[],
    nonIpfsUris: Map<string, string[]>
}

const api = Axios.create({
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
})


function *ipfsQueue(ipfsGateways: string[], priorityGatewayIndex: number, maxRepeats = 5): Generator<{gateway: string, isLast: boolean}>{
    const queue = [...ipfsGateways.slice(priorityGatewayIndex), ...ipfsGateways.slice(0, priorityGatewayIndex)];
    let  currentRepeatNumber = 0
    let index = 0
    while (true) {
        if (currentRepeatNumber >= maxRepeats) {
            return;
        }
        yield { gateway: queue[index], isLast: index === queue.length - 1};

        index++;
        if (index >= queue.length) {
            index = 0;
            currentRepeatNumber++;
        }
    }
}

export function replaceIpfsUrl(url: string, ipfsGateway: string): string{
    if (/^ipfs:\/\/ipfs/.test(url)) {
        return url.replace('ipfs://', ipfsGateway)
    } else if (/^ipfs:\/\//.test(url)){
        return url.replace('ipfs://', ipfsGateway+'ipfs/')
    }
    return url
  }

export function isIpfsUrl(url: string): boolean {
    const ipfsPattern = /^ipfs:\/\/\b[A-Za-z0-9]{46}\b/;
    return ipfsPattern.test(url);
}

export async function splitUrisBySource(uris: string[]): Promise<UrisBySource>{
    let separatedUris: UrisBySource = {ipfsUris: [], nonIpfsUris: new Map()}
    let ipfsGatewayIndex = 0
    for (const uri of uris){
        if(isIpfsUrl(uri)){
            separatedUris.ipfsUris.push({
                uri: uri,
                gatewayQueue: ipfsQueue(IPFS_GATEWAYS, ipfsGatewayIndex%IPFS_GATEWAYS.length)
            });
            ipfsGatewayIndex++;
        } else{
            const origin = new URL(uri).origin
            const sameOriginUris = separatedUris.nonIpfsUris.get(origin) ?? [];
            sameOriginUris.push(uri)
            separatedUris.nonIpfsUris.set(origin, sameOriginUris)
        }
    }
    return separatedUris;
}

export async function fetchAllMetadata(ctx: Context, uris: string[]): Promise<Map<string, JSON>>{
    const separatedUris = await splitUrisBySource(uris)
    const ipfsMetadata = await fetchIpfsMetadata(ctx, separatedUris.ipfsUris)
    const nonIpfsMetadata = await fetchNonIpfsMetadata(ctx, separatedUris.nonIpfsUris)
    return new Map([...ipfsMetadata.entries(), ...nonIpfsMetadata.entries()])
}


async function fetchData(ctx: Context, uri: string, timeout: number): Promise<[string, JSON | null]> {
    try {
        const response = await api.get(uri, { timeout: timeout });
        if (response && response.status < 400) {
            return [uri, response.data];
        }
    } catch (error) {}
    return [uri, null];
}

async function fetchWithRetries(ctx: Context, uri: string, retries: number, timeout: number): Promise<[string, JSON | null]> {
    let attempt = 0;
    while (attempt <= retries) {
        const [fetchedUri, data] = await fetchData(ctx, uri, timeout);
        if (data) return [fetchedUri, data];
        attempt++;
    }
    ctx.log.warn(`Failed to fetch metadata for URI: ${uri} after ${retries} retries`);
    return [uri, null];
}

export async function fetchNonIpfsMetadata(ctx: Context, nonIpfsUris: Map<string, string[]>): Promise<Map<string, JSON>> {
    const result = new Map<string, JSON>();
    const retries = 3;
    const batchSize = 5;

    await Promise.all([...nonIpfsUris.values()].map(async (sameOriginUris) => {
        for (let i = 0; i < sameOriginUris.length; i += batchSize) {
            const batch = sameOriginUris.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(uri => fetchWithRetries(ctx, uri, retries, 10000)));
            batchResults.forEach(([uri, data]) => {
                if (data) result.set(uri, data);
            });
        }
    }));

    return result;
}

export async function fetchIpfsMetadata(ctx: Context, ipfsUris: ipfsUri[]): Promise<Map<string, JSON>> {
    const result = new Map<string, JSON>();
    await Promise.all(ipfsUris.map(async (uri) => {
        for (const { gateway, isLast } of uri.gatewayQueue) {
            const replacedUri = replaceIpfsUrl(uri.uri, gateway);
            const [fetchedUri, data] = await fetchData(ctx, replacedUri, 10000);
            if (data) {
                result.set(uri.uri, data);
                return;
            }
            if (isLast) {
                await new Promise(f => setTimeout(f, 5000));
            }
        }
        ctx.log.error(`Failed to fetch metadata for URI: ${uri.uri}`);
    }));
    return result;
}

export async function fillNftCollectionsMetadata(ctx: Context, collections: NftCollectionEntity[]){
    const filledMetadata = await fetchAllMetadata(ctx, collections.map(obj => obj.uri).filter((uri): uri is string => uri !== null));
    for(const collection of collections){
        if (collection.uri){
            Object.assign(collection, await mapCollectionMetadata(filledMetadata.get(collection.uri)))
        }
    }
}

export async function fillNftsMetadata(ctx: Context, nfts: NftEntity[]){
    const filledMetadata = await fetchAllMetadata(ctx, nfts.map(obj => obj.uri).filter((uri): uri is string => uri !== null));
    for(const nft of nfts){
        if (nft.uri){
            Object.assign(nft, await mapTokenMetadata(filledMetadata.get(nft.uri)))
        }
    }
}


export async function mapCollectionMetadata(rawMetadata: any): Promise<ContractMetadata> {
    return {
        name: typeof rawMetadata.name === 'string' ? rawMetadata.name : undefined,
        description: typeof rawMetadata.description === 'string' ? rawMetadata.description : undefined,
        image: typeof rawMetadata.image === 'string' ? rawMetadata.image 
                : typeof rawMetadata.thumbnailUri === 'string' ? rawMetadata.thumbnailUri 
                : typeof rawMetadata.mediaUri === 'string' ? rawMetadata.mediaUri 
                : undefined,
        externalLink: typeof rawMetadata.external_link === 'string' ? rawMetadata.external_link : undefined
    }
}

export async function mapTokenMetadata(rawMetadata: any): Promise<TokenMetadata> {
    return {
        name: typeof rawMetadata.name === 'string' ? rawMetadata.name : undefined,
        description: typeof rawMetadata.description === 'string' ? rawMetadata.description : undefined,
        image: typeof rawMetadata.image === 'string' ? rawMetadata.image 
            : typeof rawMetadata.thumbnailUri === 'string' ? rawMetadata.thumbnailUri 
            : typeof rawMetadata.mediaUri === 'string' ? rawMetadata.mediaUri 
            : undefined,
        externalUrl: typeof rawMetadata.external_url === 'string' ? rawMetadata.external_url : undefined,
        animationUrl: typeof rawMetadata.animation_url === 'string' ? rawMetadata.animation_url : undefined,
        attributes: typeof rawMetadata.attributes === 'object' && rawMetadata.attributes !== null ? rawMetadata.attributes : undefined
    }
}

   
