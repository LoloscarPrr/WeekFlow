import { defaultUserProfile } from '@/src/domain/defaults';
import type { UserProfile } from '@/src/domain/entities/UserProfile';
import type { UserProfileRepository } from '@/src/domain/repositories/UserProfileRepository';
import { sqliteStateStore } from '@/src/data/local/sqlite/SQLiteStateStore';

const USER_PROFILE_KEY = 'user-profile';

export class SQLiteUserProfileRepository implements UserProfileRepository {
  load(): UserProfile {
    const parsed = sqliteStateStore.read<Partial<UserProfile>>(USER_PROFILE_KEY);
    return {
      scheduleName: typeof parsed?.scheduleName === 'string'
        ? parsed.scheduleName
        : defaultUserProfile.scheduleName,
    };
  }

  save(profile: UserProfile) {
    sqliteStateStore.write(USER_PROFILE_KEY, profile);
  }
}

export const sqliteUserProfileRepository = new SQLiteUserProfileRepository();
