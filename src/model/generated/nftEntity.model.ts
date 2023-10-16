import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, ManyToOne as ManyToOne_, OneToMany as OneToMany_} from "typeorm"
import * as marshal from "./marshal"
import {NftCollectionEntity} from "./nftCollectionEntity.model"
import {NftTransferEntity} from "./nftTransferEntity.model"

@Entity_()
export class NftEntity {
    constructor(props?: Partial<NftEntity>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    tokenId!: bigint

    @Column_("text", {nullable: true})
    name!: string | undefined | null

    @Column_("text", {nullable: true})
    description!: string | undefined | null

    @Column_("text", {nullable: true})
    image!: string | undefined | null

    @Column_("text", {nullable: true})
    animation!: string | undefined | null

    @Column_("jsonb", {nullable: true})
    attributes!: unknown | undefined | null

    @Column_("text", {nullable: true})
    uri!: string | undefined | null

    @Column_("jsonb", {nullable: true})
    raw!: unknown | undefined | null

    @Index_()
    @ManyToOne_(() => NftCollectionEntity, {nullable: true})
    nftCollection!: NftCollectionEntity

    @OneToMany_(() => NftTransferEntity, e => e.nft)
    transfers!: NftTransferEntity[]
}
