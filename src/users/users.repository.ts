// src/users/users.repository.ts
import { Injectable, Logger } from '@nestjs/common';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryUserDto } from './dto/query-user.dto';

/**
 * Users Repository
 * Data access layer for User entity
 * Follows Repository pattern
 */
@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  /**
   * Find a single user by ID
   * @returns User or null
   */
  async findOneById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } as FindOptionsWhere<User> });
  }

  /**
   * Find a single user by email
   * @returns User or null
   */
  async findOneByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email } as FindOptionsWhere<User>,
    });
  }

  /**
   * Create and save a new user
   */
  async createAndSave(user: Partial<User>): Promise<User> {
    const entity = this.repository.create(user);
    return this.repository.save(entity);
  }

  /**
   * Update a user
   * @returns Updated user or null if not found
   */
  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.repository.update(id, data);
    return this.findOneById(id);
  }

  /**
   * Soft delete a user
   */
  async softRemove(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  /**
   * Find all users with pagination and filters
   * @returns Tuple of [users, totalCount]
   */
  async findAll(query: QueryUserDto): Promise<[User[], number]> {
    const { page = 1, limit = 10, search, role } = query;

    // Build where conditions
    const where: FindOptionsWhere<User> = {};

    if (search) {
      where.fullName = Like(`%${search}%`);
    }

    if (role) {
      where.role = role;
    }

    this.logger.debug(
      `Finding users with where: ${JSON.stringify(where)}, page: ${page}, limit: ${limit}`,
    );

    return this.repository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }, // Exclude sensitive fields
    });
  }

  /**
   * Count total users
   */
  async count(where?: FindOptionsWhere<User>): Promise<number> {
    return this.repository.count({ where });
  }
}
