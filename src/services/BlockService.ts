import { BLOCKCHAIN, Context } from '../processor';
import { CONTRACTS_TO_INDEX } from '../utils/constants';
import { TransferEvent } from '../utils/interfaces';
import * as erc1155 from '../abi/erc1155';
import * as erc20 from '../abi/erc20';
import * as erc721 from '../abi/erc721';
import { v4 as uuidv4 } from 'uuid';
import { ContractType } from '../model';

export class BlockService {
  ctx: Context;
  constructor(_ctx: Context) {
    this.ctx = _ctx;
  }

  async processBlocks() {
    const transfersNfts: TransferEvent[] = [];

    const latestBlockNumber = parseInt(await this.ctx._chain.client.call('eth_blockNumber'));
    for (let block of this.ctx.blocks) {
      for (let log of block.logs) {
        if (
          CONTRACTS_TO_INDEX.some((contract) => contract.address == log.address) &&
          log.topics[0] === erc721.events.Transfer.topic &&
          log.topics.length === 4
        ) {
          const { from, to, tokenId } = erc721.events.Transfer.decode(log);
          transfersNfts.push({
            id: uuidv4(),
            block: log.block,
            from: from,
            to: to,
            tokenId: tokenId,
            amount: BigInt(1),
            contractAddress: log.address,
            blockchain: BLOCKCHAIN,
            contractType: ContractType.erc721,
          });
        } else if (
          CONTRACTS_TO_INDEX.some((contract) => contract.address == log.address) &&
          log.topics[0] === erc20.events.Transfer.topic &&
          log.topics.length === 3
        ) {
          // TODO Handle ERC20 Transfer event
        } else if (
          CONTRACTS_TO_INDEX.some((contract) => contract.address == log.address) &&
          log.topics[0] === erc1155.events.TransferSingle.topic
        ) {
          const { from, to, id, value } = erc1155.events.TransferSingle.decode(log);
          transfersNfts.push({
            id: uuidv4(),
            block: log.block,
            from: from,
            to: to,
            tokenId: id,
            amount: value,
            contractAddress: log.address,
            blockchain: BLOCKCHAIN,
            contractType: ContractType.erc1155,
          });
        } else if (
          CONTRACTS_TO_INDEX.some((contract) => contract.address == log.address) &&
          log.topics[0] === erc1155.events.TransferBatch.topic
        ) {
          const { from, to, ids, amounts } = erc1155.events.TransferBatch.decode(log);
          for (let i = 0; i < ids.length; i++) {
            transfersNfts.push({
              id: uuidv4(),
              block: log.block,
              from: from,
              to: to,
              tokenId: ids[i],
              amount: amounts[i],
              contractAddress: log.address,
              blockchain: BLOCKCHAIN,
              contractType: ContractType.erc1155,
            });
          }
        }
      }
    }

    return [latestBlockNumber, transfersNfts] as [number, TransferEvent[]];
  }
}
