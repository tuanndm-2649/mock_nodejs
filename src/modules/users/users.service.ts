import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { PaginationMetaDto } from 'src/common/dto/paginated-response.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { AccessTokenPayload } from 'src/common/interfaces/token-payload.interface';
import { assertOwnerOrAdmin } from 'src/common/utils/assert-owner-or-admin.util';
import { findEntityOrFail } from 'src/common/utils/find-entity-or-fail.util';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

const SALT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly i18n: I18nService,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }): Promise<User> {
    const emailExists = await this.userRepository.exists({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new ConflictException(this.i18n.t('users.error.userExists'));
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = this.userRepository.create({
      fullName: data.name,
      email: data.email,
      role: data.role,
      passwordHash,
    });

    return this.userRepository.save(user);
  }

  async findAll(
    query: PaginationQueryDto,
  ): Promise<{ data: User[]; meta: PaginationMetaDto }> {
    const [users, total] = await this.userRepository.findAndCount({
      skip: query.skip,
      take: query.limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users,
      meta: new PaginationMetaDto(query.page, query.limit, total),
    };
  }

  findById(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  findOneOrFail(id: number): Promise<User> {
    return findEntityOrFail(
      this.userRepository,
      { where: { id } },
      this.i18n.t('users.error.notFound'),
    );
  }

  findByIdWithRefreshTokenHash(userId: number): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id = :userId', {
        userId,
      })
      .getOne();
  }

  async updateRefreshTokenHash(
    userId: number,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      refreshTokenHash,
    });
  }

  async update(
    id: number,
    currentUser: AccessTokenPayload,
    dto: UpdateUserDto,
  ): Promise<User> {
    const isAdmin = currentUser.role === 'admin';

    assertOwnerOrAdmin(
      currentUser,
      currentUser.sub === id,
      this.i18n.t('common.error.forbidden'),
    );

    const user = await findEntityOrFail(
      this.userRepository,
      { where: { id } },
      this.i18n.t('users.error.notFound'),
    );

    if (dto.name) {
      user.fullName = dto.name;
    }

    if (isAdmin && dto.role) {
      user.role = dto.role;
    }

    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(this.i18n.t('users.error.notFound'));
    }
  }

  async findAllActive(): Promise<User[]> {
    return this.userRepository.find({ where: { isActive: true } });
  }

  async findOrCreateByGoogleProfile(profile: {
    googleId: string;
    email: string;
    fullName: string;
  }): Promise<User> {
    const existingByGoogleId = await this.userRepository.findOneBy({
      googleId: profile.googleId,
    });

    if (existingByGoogleId) {
      return existingByGoogleId;
    }

    const existingByEmail = await this.findByEmail(profile.email);

    if (existingByEmail) {
      existingByEmail.googleId = profile.googleId;
      return this.userRepository.save(existingByEmail);
    }

    const user = this.userRepository.create({
      email: profile.email,
      fullName: profile.fullName,
      googleId: profile.googleId,
      passwordHash: null,
    });

    return this.userRepository.save(user);
  }
}
