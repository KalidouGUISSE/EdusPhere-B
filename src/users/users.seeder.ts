import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersSeeder {
  private readonly SALT_ROUNDS = 10;

  constructor(private readonly dataSource: DataSource) {}

  async run() {
    const repo = this.dataSource.getRepository(User);

    const users = [
      {
        firstName: 'Kalidou',
        lastName: 'Guisse',
        email: 'kalidou@example.com',
        password: 'password123',
        role: UserRole.ADMIN,
      },
      {
        firstName: 'Moussa',
        lastName: 'Diallo',
        email: 'moussa@example.com',
        password: 'password123',
        role: UserRole.USER,
      },
    ];

    for (const u of users) {
      const exists = await repo.findOneBy({ email: u.email });
      if (!exists) {
        const hashed = await bcrypt.hash(u.password, this.SALT_ROUNDS);
        const user = repo.create({ ...u, password: hashed });
        await repo.save(user);
      }
    }

    console.log('✅ Users seeded successfully');
  }
}
