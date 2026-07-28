import { ForbiddenException } from '@nestjs/common';
import { AccessTokenPayload } from 'src/common/interfaces/token-payload.interface';

export function assertOwnerOrAdmin(
  currentUser: AccessTokenPayload,
  isOwner: boolean,
  errorMessage: string,
): void {
  const isAdmin = currentUser.role === 'admin';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenException(errorMessage);
  }
}
