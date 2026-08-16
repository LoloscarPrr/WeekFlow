import type { UserProfile } from '@/src/domain/entities/UserProfile';
import type { UserProfileRepository } from '@/src/domain/repositories/UserProfileRepository';
import { sqliteStateStore } from '@/src/data/local/sqlite/SQLiteStateStore';
import { migrateUserProfile } from '@/src/data/migrations/stateMigrations';

const USER_PROFILE_KEY = 'user-profile';

export class SQLiteUserProfileRepository implements UserProfileRepository {
  load(): UserProfile {
    return migrateUserProfile(sqliteStateStore.read<unknown>(USER_PROFILE_KEY));
  }

  save(profile: UserProfile) {
    sqliteStateStore.write(USER_PROFILE_KEY, profile);
  }
}

export const sqliteUserProfileRepository = new SQLiteUserProfileRepository();
