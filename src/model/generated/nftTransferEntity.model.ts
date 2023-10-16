import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {NftEntity} from "./nftEntity.model"

@Entity_()
export class NftTransferEntity {
    constructor(props?: Partial<NftTransferEntity>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => NftEntity, {nullable: true})
    nft!: NftEntity

    @Index_()
    @Column_("text", {nullable: false})
    fromAddress!: string

    @Index_()
    @Column_("text", {nullable: false})
    toAddress!: string

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount!: bigint
}
