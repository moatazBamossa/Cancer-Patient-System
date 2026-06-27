export interface UserProfileDto {
  id: string;
  full_name: string;
  role_id: number | null;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  user_name: string;
  password: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  role_id: number | null;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  user_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfileResponse {
  success: boolean;
  message: string;
  profile: UserProfileDto;
}

export interface UserProfileListResponse {
  success: boolean;
  message: string;
  profiles: UserProfileDto[];
}

export interface CreateUserProfileParams {
  id: string;
  full_name: string;
  role_id?: number | null;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
  user_name: string;
  password: string;
  is_active?: boolean;
}

export interface UpdateUserProfileParams {
  id: string;
  full_name?: string;
  role_id?: number | null;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
  user_name?: string;
  password?: string;
  is_active?: boolean;
}

export interface DeleteUserProfileParams {
  id: string;
}
