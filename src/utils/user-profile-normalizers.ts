import type { UserProfileDto, UserProfile } from '../types/user-profile';
export type { UserProfile };

export function normalizeUserProfile(item: UserProfileDto): UserProfile {
  return {
    id: item.id,
    full_name: item.full_name,
    role_id: item.role_id,
    specialty: item.specialty,
    phone: item.phone,
    user_name: item.user_name,
    is_active: item.is_active,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

export function normalizeUserProfiles(items: UserProfileDto[]): UserProfile[] {
  return items.map(normalizeUserProfile);
}
