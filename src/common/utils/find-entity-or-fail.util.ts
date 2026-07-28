import { NotFoundException } from '@nestjs/common';
import { FindOneOptions, ObjectLiteral, Repository } from 'typeorm';

export async function findEntityOrFail<T extends ObjectLiteral>(
  repository: Repository<T>,
  options: FindOneOptions<T>,
  errorMessage: string,
): Promise<T> {
  const entity = await repository.findOne(options);

  if (!entity) {
    throw new NotFoundException(errorMessage);
  }

  return entity;
}
