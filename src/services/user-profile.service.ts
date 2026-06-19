import { rpcCall } from '../utils/rpcCall';
import type {
  UserProfileResponse,
  UserProfileListResponse,
  CreateUserProfileParams,
  UpdateUserProfileParams,
  DeleteUserProfileParams,
} from '../types/user-profile';

export const userProfileService = {
  async user_profiles_list_all(): Promise<UserProfileListResponse> {
    return rpcCall<UserProfileListResponse>('user_profiles_list_all');
  },

  async user_profiles_list_by_id(id: string): Promise<UserProfileResponse> {
    return rpcCall<UserProfileResponse>('user_profiles_list_by_id', {
      p_id: id,
    });
  },

  async user_profiles_list_by_role_id(role_id: number): Promise<UserProfileListResponse> {
    return rpcCall<UserProfileListResponse>('user_profiles_list_by_role_id', {
      p_role_id: role_id,
    });
  },

  async user_profiles_create(params: CreateUserProfileParams): Promise<UserProfileResponse> {
    return rpcCall<UserProfileResponse>('user_profiles_create', {
      p_id: params.id,
      p_full_name: params.full_name,
      p_user_name: params.user_name,
      p_role_id: params.role_id ?? null,
      p_specialty: params.specialty ?? null,
      p_phone: params.phone ?? null,
      p_password: params.password,
      p_is_active: params.is_active ?? true,
    });
  },

  async user_profiles_update(params: UpdateUserProfileParams): Promise<UserProfileResponse> {
    return rpcCall<UserProfileResponse>('user_profiles_update', {
      p_id: params.id,
      p_full_name: params.full_name ?? null,
      p_user_name: params.user_name ?? null,
      p_role_id: params.role_id ?? null,
      p_specialty: params.specialty ?? null,
      p_phone: params.phone ?? null,
      p_password: params.password ?? null,
      p_is_active: params.is_active ?? null,
    });
  },

  async user_profiles_delete(params: DeleteUserProfileParams): Promise<{ success: boolean; message: string }> {
    return rpcCall<{ success: boolean; message: string }>('user_profiles_delete', {
      p_id: params.id,
    });
  },
};
