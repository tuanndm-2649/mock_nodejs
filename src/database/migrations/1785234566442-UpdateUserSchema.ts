import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserSchema1785234566442 implements MigrationInterface {
  name = 'UpdateUserSchema1785234566442';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "full_name" character varying(100) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_hash" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'user'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" character varying(10) NOT NULL DEFAULT 'user'`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "full_name"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "name" character varying(100) NOT NULL`,
    );
  }
}
