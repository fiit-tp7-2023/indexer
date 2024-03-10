import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {AccountEntity} from "./accountEntity.model"
import {NftEntity} from "./nftEntity.model"

@Entity_()
export class NftOwnerEntity {
    constructor(props?: Partial<NftOwnerEntity>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => AccountEntity, {nullable: true})
    owner!: AccountEntity

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount!: bigint

    @Index_()
    @ManyToOne_(() => NftEntity, {nullable: true})
    nft!: NftEntity
}
