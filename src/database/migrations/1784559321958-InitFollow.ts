import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitFollow1784559321958 implements MigrationInterface {
  name = 'InitFollow1784559321958';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "follow" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "follower_id" integer NOT NULL, "following_id" integer NOT NULL, CONSTRAINT "UQ_f3ea4388bcbbe0b554dd85c844a" UNIQUE ("follower_id", "following_id"), CONSTRAINT "PK_fda88bc28a84d2d6d06e19df6e5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow" ADD CONSTRAINT "FK_e65ef3268d3d5589f94b09c2373" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow" ADD CONSTRAINT "FK_7e66760f06ef2ca5eb43109d1cc" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "follow" DROP CONSTRAINT "FK_7e66760f06ef2ca5eb43109d1cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "follow" DROP CONSTRAINT "FK_e65ef3268d3d5589f94b09c2373"`,
    );
    await queryRunner.query(`DROP TABLE "follow"`);
  }
}
