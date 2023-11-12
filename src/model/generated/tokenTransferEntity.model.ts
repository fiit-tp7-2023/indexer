import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {TokenCollectionEntity} from "./tokenCollectionEntity.model"

@Entity_()
export class TokenTransferEntity {
    constructor(props?: Partial<TokenTransferEntity>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @ManyToOne_(() => TokenCollectionEntity, {nullable: true})
    token!: TokenCollectionEntity

    @Index_()
    @Column_("text", {nullable: false})
    fromAddress!: string

    @Index_()
    @Column_("text", {nullable: false})
    toAddress!: string

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    amount!: bigint

    @Index_()
    @Column_("int4", {nullable: false})
    createdAtBlock!: number
}
