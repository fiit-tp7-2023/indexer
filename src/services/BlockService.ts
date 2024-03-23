import { BLOCKCHAIN, Context, Log } from '../processor';
import { TransferEvent } from '../utils/interfaces';
import * as erc1155 from '../abi/erc1155';
import * as erc20 from '../abi/erc20';
import * as erc721 from '../abi/erc721';
import { v4 as uuidv4 } from 'uuid';
import { ContractType } from '../model';

export class BlockService {
  nftsTransfers: TransferEvent[] = [];
  tokenTransfers: TransferEvent[] = [];
  latestBlockNumber: number = 0;
  constructor(
    private ctx: Context,
    public blockchain: string,
  ) {}

  async processBatchOfBlocks(): Promise<{ nftsTransfers: TransferEvent[]; tokensTransfers: TransferEvent[] }> {
    this.nftsTransfers = [];
    this.tokenTransfers = [];
    this.latestBlockNumber = parseInt(await this.ctx._chain.client.call('eth_blockNumber'));

    for (let block of this.ctx.blocks) {
      for (let log of block.logs) {
        switch (log.topics[0]) {
          case erc721.events.Transfer.topic:
            if (log.topics.length === 4) {
              this.handleTransferEvent(log, ContractType.ERC721);
            } else if (log.topics.length === 3) {
              this.handleTransferEvent(log, ContractType.ERC20);
            }
            break;
          case erc1155.events.TransferSingle.topic:
            this.handleTransferEvent(log, ContractType.ERC1155);
            break;
          case erc1155.events.TransferBatch.topic:
            this.handleERC1155BatchTransfer(log);
            break;
        }
      }
    }
    return { nftsTransfers: this.nftsTransfers, tokensTransfers: this.tokenTransfers };
  }

  public async getLatestBlockNumber(refresh = false): Promise<number> {
    if (this.latestBlockNumber == 0 || refresh)
      this.latestBlockNumber = await this.ctx._chain.client.call('eth_blockNumber');
    return this.latestBlockNumber;
  }

  private handleTransferEvent(log: Log, contractType: ContractType) {
    try {
      switch (contractType) {
        case ContractType.ERC20: {
          const { from, to, value } = erc20.events.Transfer.decode(log);
          this.addTransferEvent(log, from, to, BigInt(0), value, ContractType.ERC20);
          break;
        }
        case ContractType.ERC721: {
          const { from, to, tokenId } = erc721.events.Transfer.decode(log);
          this.addTransferEvent(log, from, to, tokenId, BigInt(1), ContractType.ERC721);
          break;
        }
        case ContractType.ERC1155: {
          const { from, to, id, value } = erc1155.events.TransferSingle.decode(log);
          this.addTransferEvent(log, from, to, id, value, ContractType.ERC1155);
          break;
        }
      }
    } catch (error: any) {
      this.ctx.log.error(`Error decoding transfer event: ${error.message}`);
    }
  }

  private handleERC1155BatchTransfer(log: Log) {
    try {
      const { from, to, ids, amounts } = erc1155.events.TransferBatch.decode(log);
      ids.forEach((id, index) => {
        this.addTransferEvent(log, from, to, id, amounts[index], ContractType.ERC1155);
      });
    } catch (error: any) {
      this.ctx.log.error(`Error decoding ERC1155 batch transfer event: ${error.message}`);
    }
  }

  private addTransferEvent(
    log: Log,
    from: string,
    to: string,
    tokenId: bigint,
    amount: bigint,
    contractType: ContractType,
  ) {
    const transfer = {
      id: uuidv4(),
      block: log.block,
      from: from,
      to: to,
      tokenId: tokenId,
      amount: amount,
      contractAddress: log.address,
      blockchain: BLOCKCHAIN,
      contractType: contractType,
    };
    if (contractType === ContractType.ERC721 || contractType === ContractType.ERC1155) {
      this.nftsTransfers.push(transfer);
    } else {
      this.tokenTransfers.push(transfer);
    }
  }
}
