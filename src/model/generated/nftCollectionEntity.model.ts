import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, OneToMany as OneToMany_} from "typeorm"
import {Blockchain} from "./_blockchain"
import {ContractType} from "./_contractType"
import {NftEntity} from "./nftEntity.model"

@Entity_()
export class NftCollectionEntity {
    constructor(props?: Partial<NftCollectionEntity>) {
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

    @Column_("varchar", {length: 7, nullable: true})
    type!: ContractType | undefined | null

    @Column_("text", {nullable: true})
    owner!: string | undefined | null

    @Column_("text", {nullable: true})
    symbol!: string | undefined | null

    @Column_("text", {nullable: true})
    name!: string | undefined | null

    @Column_("text", {nullable: true})
    description!: string | undefined | null

    @Column_("text", {nullable: true})
    image!: string | undefined | null

    @Column_("text", {nullable: true})
    externalLink!: string | undefined | null

    @Column_("text", {nullable: true})
    uri!: string | undefined | null

    @Column_("jsonb", {nullable: true})
    raw!: unknown | undefined | null

    @Column_("text", {nullable: true})
    baseUri!: string | undefined | null

    @OneToMany_(() => NftEntity, e => e.nftCollection)
    nfts!: NftEntity[]
}
