module.exports = class Data1713042464519 {
    name = 'Data1713042464519'

    async up(db) {
        await db.query(`CREATE TABLE "nft_collection_entity" ("id" character varying NOT NULL, "address" text NOT NULL, "blockchain" character varying(7) NOT NULL, "contract_type" character varying(7), "owner" text, "symbol" text, "name" text, "description" text, "image" text, "external_link" text, "uri" text, "raw" jsonb, "base_uri" text, "created_at_block" integer NOT NULL, CONSTRAINT "PK_3691f573a8498c8dab00d7a421c" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_8ed55a604f12277c11ef78f60c" ON "nft_collection_entity" ("address") `)
        await db.query(`CREATE INDEX "IDX_1925433c34d5616a0a07050f11" ON "nft_collection_entity" ("blockchain") `)
        await db.query(`CREATE INDEX "IDX_ee10f2252f3eff24898b26deaa" ON "nft_collection_entity" ("created_at_block") `)
        await db.query(`CREATE TABLE "nft_entity" ("id" character varying NOT NULL, "token_id" numeric NOT NULL, "name" text, "description" text, "image" text, "animation_url" text, "external_url" text, "attributes" jsonb, "uri" text, "raw" jsonb, "created_at_block" integer NOT NULL, "nft_collection_id" character varying, CONSTRAINT "PK_ed09c6a38c0f0a867d5a7b63f0d" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_060d0f515d293fac1d81ee61a7" ON "nft_entity" ("token_id") `)
        await db.query(`CREATE INDEX "IDX_1bd030fc765f6395591f4a288e" ON "nft_entity" ("nft_collection_id") `)
        await db.query(`CREATE INDEX "IDX_6c9bf39f1bb5e4142eefcd41cb" ON "nft_entity" ("created_at_block") `)
        await db.query(`CREATE TABLE "nft_transfer_entity" ("id" character varying NOT NULL, "amount" numeric NOT NULL, "created_at_block" integer NOT NULL, "nft_id" character varying, "from_address_id" character varying, "to_address_id" character varying, CONSTRAINT "PK_2d99361c639dbbe97c8be19d2da" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_2fa6c0e347835df3006545d1f7" ON "nft_transfer_entity" ("nft_id") `)
        await db.query(`CREATE INDEX "IDX_e464d57599de5b5ae51ba8eff1" ON "nft_transfer_entity" ("from_address_id") `)
        await db.query(`CREATE INDEX "IDX_c6e467515d5ecbe339592706d3" ON "nft_transfer_entity" ("to_address_id") `)
        await db.query(`CREATE INDEX "IDX_ce026d84d81a0672f0fa9318a2" ON "nft_transfer_entity" ("amount") `)
        await db.query(`CREATE INDEX "IDX_14fbbe3f591005933b0141eeca" ON "nft_transfer_entity" ("created_at_block") `)
        await db.query(`CREATE TABLE "token_collection_entity" ("id" character varying NOT NULL, "address" text NOT NULL, "blockchain" character varying(7) NOT NULL, "contract_type" character varying(7), "owner" text, "symbol" text, "name" text, "decimals" integer, "logo" text, "thumbnail" text, "raw" jsonb, "created_at_block" integer NOT NULL, CONSTRAINT "PK_9db5abbc6f3bd67a6563dcbe494" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_caa9ced45a5f0db16e20dea58a" ON "token_collection_entity" ("address") `)
        await db.query(`CREATE INDEX "IDX_de51cee3d1674d9ea5610f250e" ON "token_collection_entity" ("blockchain") `)
        await db.query(`CREATE INDEX "IDX_eb5fe54070a2539a34966618bf" ON "token_collection_entity" ("created_at_block") `)
        await db.query(`CREATE TABLE "token_transfer_entity" ("id" character varying NOT NULL, "amount" numeric NOT NULL, "created_at_block" integer NOT NULL, "token_id" character varying, "from_address_id" character varying, "to_address_id" character varying, CONSTRAINT "PK_dcae18ea60c726748b6efa8408c" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_c41207e25a4509bff030ff6b36" ON "token_transfer_entity" ("token_id") `)
        await db.query(`CREATE INDEX "IDX_6d5ed15ba70270a17e15c16dcb" ON "token_transfer_entity" ("from_address_id") `)
        await db.query(`CREATE INDEX "IDX_7a164180e366072242f36c5090" ON "token_transfer_entity" ("to_address_id") `)
        await db.query(`CREATE INDEX "IDX_5d6bb03a6629ec8eac827a2579" ON "token_transfer_entity" ("amount") `)
        await db.query(`CREATE INDEX "IDX_4cf55fd09e54fcbe54e16ccbd8" ON "token_transfer_entity" ("created_at_block") `)
        await db.query(`CREATE TABLE "account_entity" ("id" character varying NOT NULL, "created_at_block" integer NOT NULL, CONSTRAINT "PK_b482dad15becff9a89ad707dcbe" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_7c3948722ff718aae79d94b079" ON "account_entity" ("created_at_block") `)
        await db.query(`CREATE TABLE "nft_owner_entity" ("id" character varying NOT NULL, "amount" numeric NOT NULL, "acquired_at" integer, "acquired_at_block" integer, "owner_id" character varying, "nft_id" character varying, CONSTRAINT "PK_c2824baa7b85ed72fef918f9006" PRIMARY KEY ("id"))`)
        await db.query(`CREATE INDEX "IDX_f52e9bde01f0625806202674a7" ON "nft_owner_entity" ("owner_id") `)
        await db.query(`CREATE INDEX "IDX_e939a711fe5331337be11ba37c" ON "nft_owner_entity" ("nft_id") `)
        await db.query(`CREATE INDEX "IDX_8e12c969b381186b232b25893a" ON "nft_owner_entity" ("acquired_at") `)
        await db.query(`CREATE INDEX "IDX_9f12a1c996cc4fcf8afe063f1e" ON "nft_owner_entity" ("acquired_at_block") `)
        await db.query(`ALTER TABLE "nft_entity" ADD CONSTRAINT "FK_1bd030fc765f6395591f4a288e7" FOREIGN KEY ("nft_collection_id") REFERENCES "nft_collection_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "nft_transfer_entity" ADD CONSTRAINT "FK_2fa6c0e347835df3006545d1f7b" FOREIGN KEY ("nft_id") REFERENCES "nft_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "nft_transfer_entity" ADD CONSTRAINT "FK_e464d57599de5b5ae51ba8eff1b" FOREIGN KEY ("from_address_id") REFERENCES "account_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "nft_transfer_entity" ADD CONSTRAINT "FK_c6e467515d5ecbe339592706d39" FOREIGN KEY ("to_address_id") REFERENCES "account_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "token_transfer_entity" ADD CONSTRAINT "FK_c41207e25a4509bff030ff6b361" FOREIGN KEY ("token_id") REFERENCES "token_collection_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "token_transfer_entity" ADD CONSTRAINT "FK_6d5ed15ba70270a17e15c16dcb0" FOREIGN KEY ("from_address_id") REFERENCES "account_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "token_transfer_entity" ADD CONSTRAINT "FK_7a164180e366072242f36c50906" FOREIGN KEY ("to_address_id") REFERENCES "account_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "nft_owner_entity" ADD CONSTRAINT "FK_f52e9bde01f0625806202674a7a" FOREIGN KEY ("owner_id") REFERENCES "account_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
        await db.query(`ALTER TABLE "nft_owner_entity" ADD CONSTRAINT "FK_e939a711fe5331337be11ba37cb" FOREIGN KEY ("nft_id") REFERENCES "nft_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`)
    }

    async down(db) {
        await db.query(`DROP TABLE "nft_collection_entity"`)
        await db.query(`DROP INDEX "public"."IDX_8ed55a604f12277c11ef78f60c"`)
        await db.query(`DROP INDEX "public"."IDX_1925433c34d5616a0a07050f11"`)
        await db.query(`DROP INDEX "public"."IDX_ee10f2252f3eff24898b26deaa"`)
        await db.query(`DROP TABLE "nft_entity"`)
        await db.query(`DROP INDEX "public"."IDX_060d0f515d293fac1d81ee61a7"`)
        await db.query(`DROP INDEX "public"."IDX_1bd030fc765f6395591f4a288e"`)
        await db.query(`DROP INDEX "public"."IDX_6c9bf39f1bb5e4142eefcd41cb"`)
        await db.query(`DROP TABLE "nft_transfer_entity"`)
        await db.query(`DROP INDEX "public"."IDX_2fa6c0e347835df3006545d1f7"`)
        await db.query(`DROP INDEX "public"."IDX_e464d57599de5b5ae51ba8eff1"`)
        await db.query(`DROP INDEX "public"."IDX_c6e467515d5ecbe339592706d3"`)
        await db.query(`DROP INDEX "public"."IDX_ce026d84d81a0672f0fa9318a2"`)
        await db.query(`DROP INDEX "public"."IDX_14fbbe3f591005933b0141eeca"`)
        await db.query(`DROP TABLE "token_collection_entity"`)
        await db.query(`DROP INDEX "public"."IDX_caa9ced45a5f0db16e20dea58a"`)
        await db.query(`DROP INDEX "public"."IDX_de51cee3d1674d9ea5610f250e"`)
        await db.query(`DROP INDEX "public"."IDX_eb5fe54070a2539a34966618bf"`)
        await db.query(`DROP TABLE "token_transfer_entity"`)
        await db.query(`DROP INDEX "public"."IDX_c41207e25a4509bff030ff6b36"`)
        await db.query(`DROP INDEX "public"."IDX_6d5ed15ba70270a17e15c16dcb"`)
        await db.query(`DROP INDEX "public"."IDX_7a164180e366072242f36c5090"`)
        await db.query(`DROP INDEX "public"."IDX_5d6bb03a6629ec8eac827a2579"`)
        await db.query(`DROP INDEX "public"."IDX_4cf55fd09e54fcbe54e16ccbd8"`)
        await db.query(`DROP TABLE "account_entity"`)
        await db.query(`DROP INDEX "public"."IDX_7c3948722ff718aae79d94b079"`)
        await db.query(`DROP TABLE "nft_owner_entity"`)
        await db.query(`DROP INDEX "public"."IDX_f52e9bde01f0625806202674a7"`)
        await db.query(`DROP INDEX "public"."IDX_e939a711fe5331337be11ba37c"`)
        await db.query(`DROP INDEX "public"."IDX_8e12c969b381186b232b25893a"`)
        await db.query(`DROP INDEX "public"."IDX_9f12a1c996cc4fcf8afe063f1e"`)
        await db.query(`ALTER TABLE "nft_entity" DROP CONSTRAINT "FK_1bd030fc765f6395591f4a288e7"`)
        await db.query(`ALTER TABLE "nft_transfer_entity" DROP CONSTRAINT "FK_2fa6c0e347835df3006545d1f7b"`)
        await db.query(`ALTER TABLE "nft_transfer_entity" DROP CONSTRAINT "FK_e464d57599de5b5ae51ba8eff1b"`)
        await db.query(`ALTER TABLE "nft_transfer_entity" DROP CONSTRAINT "FK_c6e467515d5ecbe339592706d39"`)
        await db.query(`ALTER TABLE "token_transfer_entity" DROP CONSTRAINT "FK_c41207e25a4509bff030ff6b361"`)
        await db.query(`ALTER TABLE "token_transfer_entity" DROP CONSTRAINT "FK_6d5ed15ba70270a17e15c16dcb0"`)
        await db.query(`ALTER TABLE "token_transfer_entity" DROP CONSTRAINT "FK_7a164180e366072242f36c50906"`)
        await db.query(`ALTER TABLE "nft_owner_entity" DROP CONSTRAINT "FK_f52e9bde01f0625806202674a7a"`)
        await db.query(`ALTER TABLE "nft_owner_entity" DROP CONSTRAINT "FK_e939a711fe5331337be11ba37cb"`)
    }
}
