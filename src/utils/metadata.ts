import Axios from 'axios'
import {Context} from '../processor'
export const GATEWAY_NUMBER_OF_RETRIES = 10
export const IPFS_GATEWAYS = [
    "https://nftstorage.link/", "https://ipfs.io/" , "https://gateway.ipfs.io/", "https://ipfs.apillon.io/", "https://ipfs2.rmrk.link/", "https://infura-ipfs.io", "https://kodadot1.infura-ipfs.io", 
]
import { $obtain, ipfsProviders, sanitize } from '@kodadot1/minipfs'
import { utimes } from 'fs'
import { NftEntity } from '../model'

class IpfsGatewayQueue {
    private queue: string[];
    private index: number;
    private currentRepeatNumber: number;
    private maxRepeats: number;

    constructor(ipfsGateways: string[], priorityGatewayIndex: number, maxRepeats = 5) {
        if (ipfsGateways.length === 0) {
            throw new Error("Initial ipfs elements array cannot be empty.");
          }
        this.maxRepeats = maxRepeats;
        this.currentRepeatNumber = 0;
        this.queue = ipfsGateways.slice(priorityGatewayIndex, ipfsGateways.length).concat(ipfsGateways.slice(0, priorityGatewayIndex)) 
        this.index = 0;
    }

    next(): {gateway: string|null, isLast: boolean|null} {
        const gateway = this.queue[this.index];
        this.index ++;
        const isLast = true ? this.index == this.queue.length-1 : false;
        if(this.index >= this.queue.length){
            this.index = 0;
            this.currentRepeatNumber ++;
            if(this.currentRepeatNumber >= this.maxRepeats){
               return {gateway: null, isLast: null}
            }
        }
        return {gateway, isLast};
      }
}


export interface ContractMetadata {
    name?: string
    description?: string
    image?: string
    external_link?: string
}


export interface TokenMetadata {
    name?: string
    description?: string
    image?: string
    external_url?: string,
    animation_url?: string
    attributes?: JSON
}

export interface ipfsUri{
    uri: string
    priorityGatewayQueue: IpfsGatewayQueue
}

export interface UrisBySource {
    ipfsUris: ipfsUri[],
    nonIpfsUris: Map<string, string>
}

const api = Axios.create({
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
})

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
    let ipfsGatewayIndex = 0;
    for (const uri of uris){
        if(isIpfsUrl(uri)){
            separatedUris.ipfsUris.push({
                uri: uri,
                priorityGatewayQueue: new IpfsGatewayQueue(IPFS_GATEWAYS, ipfsGatewayIndex%IPFS_GATEWAYS.length)
            });
            ipfsGatewayIndex++;
        } else{
            separatedUris.nonIpfsUris.set(new URL(uri).origin, uri);
        }
    }
    return separatedUris;
}

export async function fetchAllMetadata(ctx: Context, uris: string[]): Promise<Map<string, JSON>>{
    const separatedUris = await splitUrisBySource(uris);
    return await fetchIpfsMetadata(ctx, separatedUris.ipfsUris);
}

export async function fetchIpfsMetadata(ctx: Context, ipfsUris: ipfsUri[]): Promise<Map<string, JSON>>{
    const result: Map<string, JSON> = new Map()
    await Promise.all(ipfsUris.map(async(uri) => {
        let {gateway, isLast} = uri.priorityGatewayQueue.next()
        while(gateway){
            const replacedUri = replaceIpfsUrl(uri.uri, gateway)
            try{
                
                const response = await api.get(replacedUri, {timeout: 10000});
                if (response && response.status < 400){
                    ctx.log.info(`FETCH SUCEED ${replacedUri}`);
                    result.set(uri.uri, response.data)
                    return
                }
                ctx.log.info(`ERoor ${replacedUri}`);
            }
            catch (e) {
                ctx.log.info(`ERoor ${e} ${replacedUri}`);
            }
            if(isLast){
                await new Promise(f => setTimeout(f, 5000));
            }
            const r = uri.priorityGatewayQueue.next()
            gateway = r.gateway
            isLast = r.isLast
        }
        
        ctx.log.error(`FAILED to fetch metadata for URI: ${uri.uri}`)
    }))
    return result
}

export async function parseContractMetadata(ctx: Context, contractUri: string): Promise<ContractMetadata|null>{
    let errorMsg
    for (let i = 0; i <= GATEWAY_NUMBER_OF_RETRIES; i++) {
        try{
            const response = isIpfsUrl(contractUri) ? await obtainIpfsData(contractUri) : await api.get(contractUri);
            if (response && response.status < 400){
                return response.data;
            }
            errorMsg = `ContractMetadata ERROR ${contractUri} status: ${response?.status}, data: ${response?.data}`
        }
        catch (e) {
            errorMsg = `ContractMetadata ERROR ${contractUri}  ${(e as Error).message}`
        }
        await new Promise(f => setTimeout(f, 10000));
    }
    if(errorMsg){
        ctx.log.warn(errorMsg)
    }
    return null;
}

export async function obtainIpfsData(uri: string){
    let response
    for (const gateway of IPFS_GATEWAYS){
        try{
            response =await api.get(replaceIpfsUrl(uri, gateway), {timeout: 10000})
            if (response.status < 400) {
            return response
            }
        }
        catch (e) {
            continue
        }
    }
    return response
}

export async function fillNftsMetadata(ctx: Context, nfts: NftEntity[]){
    const filledMetadata = await fetchAllMetadata(ctx, nfts.map(obj => obj.uri).filter((uri): uri is string => uri !== undefined));
    for(const nft of nfts){
        if (nft.uri)
            nft.raw = filledMetadata.get(nft.uri)
    }
}

   
