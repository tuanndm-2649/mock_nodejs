import { DataSource } from 'typeorm';

export async function resetDatabase(dataSource: DataSource): Promise<void> {
  const tables = dataSource.entityMetadatas.map(
    (entity) => `"${entity.tableName}"`,
  );

  await dataSource.query(
    `TRUNCATE ${tables.join(', ')} RESTART IDENTITY CASCADE`,
  );
}
