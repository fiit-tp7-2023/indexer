import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_, OneToMany as OneToMany_} from "typeorm"
import {NftTransferEntity} from "./nftTransferEntity.model"
import {TokenTransferEntity} from "./tokenTransferEntity.model"

@Entity_()
export class AccountEntity {
    constructor(props?: Partial<AccountEntity>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("int4", {nullable: false})
    createdAtBlock!: number

    @OneToMany_(() => NftTransferEntity, e => e.fromAddress)
    nftTrasnfersFrom!: NftTransferEntity[]

    @OneToMany_(() => NftTransferEntity, e => e.toAddress)
    nftTrasnfersTo!: NftTransferEntity[]

    @OneToMany_(() => TokenTransferEntity, e => e.fromAddress)
    tokenTrasnfersFrom!: TokenTransferEntity[]

    @OneToMany_(() => TokenTransferEntity, e => e.toAddress)
    tokenTrasnfersTo!: TokenTransferEntity[]
}
