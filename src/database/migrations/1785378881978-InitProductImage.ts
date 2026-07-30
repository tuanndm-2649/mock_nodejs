import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitProductImage1785378881978 implements MigrationInterface {
  name = 'InitProductImage1785378881978';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product_images" ("id" SERIAL NOT NULL, "image_url" character varying NOT NULL, "file_type" character varying(100) NOT NULL, "file_size" integer NOT NULL, "is_main" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "product_id" integer NOT NULL, CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068"`,
    );
    await queryRunner.query(`DROP TABLE "product_images"`);
  }
}
