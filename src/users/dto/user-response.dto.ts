// src/users/dto/user-response.dto.ts
import { Expose } from 'class-transformer';

/**
 * Data Transfer Object for user response
 * Excludes sensitive fields like password
 */
export class UserResponseDto {
  @Expose()
  id: string;

  @Expose()
  email: string;

  @Expose()
  fullName: string;

  @Expose()
  role: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
