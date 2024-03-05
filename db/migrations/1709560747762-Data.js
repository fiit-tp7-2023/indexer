module.exports = class Data1709560747762 {
    name = 'Data1709560747762'

    async up(db) {
        await db.query(`CREATE TABLE "nft_owner_entity" ("id" character varying NOT NULL, "amount" numeric NOT NULL, "owner_id" character varying, "nft_id" character varying, CONSTRAINT "PK_c2824baa7b85ed72fef918f9006" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_f52e9bde01f0625806202674a7" ON "nft_owner_entity" ("owner_id") `)
        await db.query(`CREATE INDEX "IDX_e939a711fe5331337be11ba37c" ON "nft_owner_entity" ("nft_id") `)
        await db.query(`ALTER TABLE "nft_owner_entity" ADD CONSTRAINT "FK_f52e9bde01f0625806202674a7a" FOREIGN KEY ("owner_id") REFERENCES "account_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "nft_owner_entity" ADD CONSTRAINT "FK_e939a711fe5331337be11ba37cb" FOREIGN KEY ("nft_id") REFERENCES "nft_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    async down(db) {
        await db.query(`DROP TABLE "nft_owner_entity"`)
        await db.query(`DROP INDEX "public"."IDX_f52e9bde01f0625806202674a7"`)
        await db.query(`DROP INDEX "public"."IDX_e939a711fe5331337be11ba37c"`)
        await db.query(`ALTER TABLE "nft_owner_entity" DROP CONSTRAINT "FK_f52e9bde01f0625806202674a7a"`)
        await db.query(`ALTER TABLE "nft_owner_entity" DROP CONSTRAINT "FK_e939a711fe5331337be11ba37cb"`)
    }
}
