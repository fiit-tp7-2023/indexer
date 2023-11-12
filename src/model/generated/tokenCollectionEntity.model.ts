import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {Blockchain} from "./_blockchain"
import {ContractType} from "./_contractType"
import {TokenTransferEntity} from "./tokenTransferEntity.model"

@Entity_()
export class TokenCollectionEntity {
    constructor(props?: Partial<TokenCollectionEntity>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("text", {nullable: false})
    address!: string

    @Index_()
    @Column_("varchar", {length: 7, nullable: false})
    blockchain!: Blockchain

    @Column_("varchar", {length: 7, nullable: true})
    contractType!: ContractType | undefined | null

    @Column_("text", {nullable: true})
    owner!: string | undefined | null

    @Column_("text", {nullable: true})
    symbol!: string | undefined | null

    @Column_("text", {nullable: true})
    name!: string | undefined | null

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: true})
    decimals!: bigint | undefined | null

    @Column_("text", {nullable: true})
    logo!: string | undefined | null

    @Column_("text", {nullable: true})
    thumbnail!: string | undefined | null

    @Column_("jsonb", {nullable: true})
    raw!: unknown | undefined | null

    @Index_()
    @Column_("int4", {nullable: false})
    createdAtBlock!: number

    @OneToMany_(() => TokenTransferEntity, e => e.token)
    transfers!: TokenTransferEntity[]
}
