import type { UserProfile } from '../entities/UserProfile';

export interface UserProfileRepository {
  load(): UserProfile;
  save(profile: UserProfile): void;
}
