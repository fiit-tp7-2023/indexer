module.exports = class Data1697650028614 {
    name = 'Data1697650028614'

    async up(db) {
        await db.query(`CREATE TABLE "nft_transfer_entity" ("id" character varying NOT NULL, "from_address" text NOT NULL, "to_address" text NOT NULL, "amount" numeric NOT NULL, "nft_id" character varying, CONSTRAINT "PK_2d99361c639dbbe97c8be19d2da" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_2fa6c0e347835df3006545d1f7" ON "nft_transfer_entity" ("nft_id") `)
        await db.query(`CREATE INDEX "IDX_538a6a114edab9389b0bed80a2" ON "nft_transfer_entity" ("from_address") `)
        await db.query(`CREATE INDEX "IDX_e725efdd71c082bcc72e97f651" ON "nft_transfer_entity" ("to_address") `)
        await db.query(`CREATE INDEX "IDX_ce026d84d81a0672f0fa9318a2" ON "nft_transfer_entity" ("amount") `)
        await db.query(`CREATE TABLE "nft_entity" ("id" character varying NOT NULL, "token_id" numeric NOT NULL, "name" text, "description" text, "image" text, "animation" text, "attributes" jsonb, "uri" text, "raw" jsonb, "nft_collection_id" character varying, CONSTRAINT "PK_ed09c6a38c0f0a867d5a7b63f0d" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_060d0f515d293fac1d81ee61a7" ON "nft_entity" ("token_id") `)
        await db.query(`CREATE INDEX "IDX_1bd030fc765f6395591f4a288e" ON "nft_entity" ("nft_collection_id") `)
        await db.query(`CREATE TABLE "nft_collection_entity" ("id" character varying NOT NULL, "address" text NOT NULL, "blockchain" character varying(7) NOT NULL, "contract_type" character varying(7), "type" character varying(7), "owner" text, "symbol" text, "name" text, "description" text, "image" text, "external_link" text, "uri" text, "raw" jsonb, "base_uri" text, CONSTRAINT "PK_3691f573a8498c8dab00d7a421c" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_8ed55a604f12277c11ef78f60c" ON "nft_collection_entity" ("address") `)
        await db.query(`CREATE INDEX "IDX_1925433c34d5616a0a07050f11" ON "nft_collection_entity" ("blockchain") `)
        await db.query(`ALTER TABLE "nft_transfer_entity" ADD CONSTRAINT "FK_2fa6c0e347835df3006545d1f7b" FOREIGN KEY ("nft_id") REFERENCES "nft_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "nft_entity" ADD CONSTRAINT "FK_1bd030fc765f6395591f4a288e7" FOREIGN KEY ("nft_collection_id") REFERENCES "nft_collection_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    async down(db) {
        await db.query(`DROP TABLE "nft_transfer_entity"`)
        await db.query(`DROP INDEX "public"."IDX_2fa6c0e347835df3006545d1f7"`)
        await db.query(`DROP INDEX "public"."IDX_538a6a114edab9389b0bed80a2"`)
        await db.query(`DROP INDEX "public"."IDX_e725efdd71c082bcc72e97f651"`)
        await db.query(`DROP INDEX "public"."IDX_ce026d84d81a0672f0fa9318a2"`)
        await db.query(`DROP TABLE "nft_entity"`)
        await db.query(`DROP INDEX "public"."IDX_060d0f515d293fac1d81ee61a7"`)
        await db.query(`DROP INDEX "public"."IDX_1bd030fc765f6395591f4a288e"`)
        await db.query(`DROP TABLE "nft_collection_entity"`)
        await db.query(`DROP INDEX "public"."IDX_8ed55a604f12277c11ef78f60c"`)
        await db.query(`DROP INDEX "public"."IDX_1925433c34d5616a0a07050f11"`)
        await db.query(`ALTER TABLE "nft_transfer_entity" DROP CONSTRAINT "FK_2fa6c0e347835df3006545d1f7b"`)
        await db.query(`ALTER TABLE "nft_entity" DROP CONSTRAINT "FK_1bd030fc765f6395591f4a288e7"`)
    }
}
