import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitLike1784560602076 implements MigrationInterface {
  name = 'InitLike1784560602076';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "likes" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "article_id" integer NOT NULL, CONSTRAINT "UQ_af90adc46c549b2a7ee83c6e442" UNIQUE ("user_id", "article_id"), CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" ADD CONSTRAINT "FK_3f519ed95f775c781a254089171" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" ADD CONSTRAINT "FK_0deaa79a910af56b33472c90ee0" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "likes" DROP CONSTRAINT "FK_0deaa79a910af56b33472c90ee0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "likes" DROP CONSTRAINT "FK_3f519ed95f775c781a254089171"`,
    );
    await queryRunner.query(`DROP TABLE "likes"`);
  }
}
