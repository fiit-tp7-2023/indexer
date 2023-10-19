import Axios from 'axios'
import {Context} from '../processor'
export const GATEWAY_URL = "https://nftstorage.link/QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq"
export const GATEWAY_NUMBER_OF_RETRIES = 6


export interface ContractMetadata {
    name?: string
    description?: string
    image?: string
    external_link?: string
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


export async function parseContractMetadata(ctx: Context, contractURI: string): Promise<ContractMetadata|null>{
    try{
        const { status, data } = await api.get(replaceIpfsUrl(contractURI))
        if (status < 400) {
            return data
        }
        return null
    } catch (e) {
        ctx.log.warn(`ContractMetadata ERROR ${contractURI}  ${(e as Error).message}`)
        return null
    }
}
   
