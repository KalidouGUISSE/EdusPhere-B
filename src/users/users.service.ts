// src/users/users.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { QueryUserDto } from './dto/query-user.dto';

/**
 * Users Service
 * Contains business logic for user management
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly SALT_ROUNDS: number;

  constructor(private readonly usersRepo: UsersRepository) {
    // Configuration from environment with fallback
    this.SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
  }

  /**
   * Create a new user
   * @throws BadRequestException if email already exists
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email } = createUserDto;

    this.logger.log(`Creating user with email: ${email}`);

    // Check for existing user
    const existing = await this.usersRepo.findOneByEmail(email);
    if (existing) {
      this.logger.warn(`Email already exists: ${email}`);
      throw new BadRequestException({
        message: 'Email already exists',
        error: 'DUPLICATE_EMAIL',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.SALT_ROUNDS,
    );

    const user = await this.usersRepo.createAndSave({
      ...createUserDto,
      password: hashedPassword,
    });

    this.logger.log(`User created successfully with id: ${user.id}`);
    return user;
  }

  /**
   * Get all users with pagination and optional filters
   */
  async findAll(query: QueryUserDto): Promise<{ data: User[]; count: number }> {
    this.logger.log(
      `Finding all users - page: ${query.page}, limit: ${query.limit}, search: ${query.search}, role: ${query.role}`,
    );

    const [data, count] = await this.usersRepo.findAll(query);

    this.logger.log(`Found ${count} users`);
    return { data, count };
  }

  /**
   * Get a single user by ID
   * @throws NotFoundException if user not found
   */
  async findOne(id: string): Promise<User> {
    this.logger.debug(`Finding user with id: ${id}`);

    const user = await this.usersRepo.findOneById(id);

    if (!user) {
      this.logger.warn(`User not found with id: ${id}`);
      throw new NotFoundException({
        message: `User with id ${id} not found`,
        error: 'USER_NOT_FOUND',
      });
    }

    return user;
  }

  /**
   * Update a user
   * @throws NotFoundException if user not found
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    this.logger.log(`Updating user with id: ${id}`);

    // Hash password if provided
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        this.SALT_ROUNDS,
      );
    }

    const updated = await this.usersRepo.update(id, updateUserDto);

    if (!updated) {
      this.logger.warn(`User not found for update with id: ${id}`);
      throw new NotFoundException({
        message: `User with id ${id} not found`,
        error: 'USER_NOT_FOUND',
      });
    }

    this.logger.log(`User updated successfully with id: ${id}`);
    return updated;
  }

  /**
   * Soft delete a user
   * @throws NotFoundException if user not found
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Soft deleting user with id: ${id}`);

    // Verify user exists first
    await this.findOne(id);

    // Perform soft delete
    await this.usersRepo.softRemove(id);

    this.logger.log(`User soft deleted successfully with id: ${id}`);
  }

  /**
   * Find user by email (for authentication)
   * Returns null if not found (doesn't throw)
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOneByEmail(email);
  }
}
