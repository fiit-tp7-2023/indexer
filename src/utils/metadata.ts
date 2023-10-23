import Axios from 'axios'
import {Context} from '../processor'
export const GATEWAY_URL = "https://nftstorage.link/"
export const GATEWAY_NUMBER_OF_RETRIES = 6


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


const api = Axios.create({
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
})

export function replaceIpfsUrl(url: string): string{
    if (/^ipfs:\/\/ipfs/.test(url)) {
        return url.replace('ipfs://', GATEWAY_URL)
    } else if (/^ipfs:\/\//.test(url)){
        return url.replace('ipfs://', GATEWAY_URL+'ipfs/')
    }
    return url
  }


export async function parseContractMetadata(ctx: Context, contractUri: string): Promise<ContractMetadata|null>{
    try{
        const { status, data } = await api.get(replaceIpfsUrl(contractUri))
        if (status < 400) {
            return data
        }
        ctx.log.warn(`ContractMetadata ERROR ${contractUri} status: ${status}, data: ${data}`)
        return null
    } catch (e) {
        ctx.log.warn(`ContractMetadata ERROR ${contractUri}  ${(e as Error).message}`)
        return null
    }
}

export async function parseTokenMetadata(ctx: Context, tokenUri: string): Promise<TokenMetadata|null>{
    try{
        const { status, data } = await api.get(replaceIpfsUrl(tokenUri))
        if (status < 400) {
            return data
        }
        ctx.log.warn(`TokenMetadata ERROR ${tokenUri} status: ${status}, data: ${data}`)
        return null
    } catch (e) {
        ctx.log.warn(`TokenMetadata ERROR ${tokenUri}  ${(e as Error).message}`)
        return null
    }
}
   
