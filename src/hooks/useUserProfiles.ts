import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userProfileService } from '../services/user-profile.service';
import { userProfileQueryKeys } from '../queries/user-profile.query-key';
import i18n from '../i18n/config';
import {
  normalizeUserProfile,
  normalizeUserProfiles,
  type UserProfile,
} from '../utils/user-profile-normalizers';
import type {
  CreateUserProfileParams,
  UpdateUserProfileParams,
  DeleteUserProfileParams,
} from '../types/user-profile';

export function useUserProfilesQuery() {
  return useQuery<UserProfile[], Error>({
    queryKey: userProfileQueryKeys.list(),
    queryFn: async () => {
      const response = await userProfileService.user_profiles_list_all();
      return normalizeUserProfiles(response.profiles ?? []);
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useUserProfileByIdQuery(id?: string) {
  return useQuery<UserProfile | undefined, Error>({
    queryKey: userProfileQueryKeys.detail(id ?? ''),
    queryFn: async () => {
      if (!id) return undefined;
      const response = await userProfileService.user_profiles_list_by_id(id);
      return response.profile ? normalizeUserProfile(response.profile) : undefined;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useUserProfilesByRoleQuery(roleId?: number) {
  return useQuery<UserProfile[], Error>({
    queryKey: userProfileQueryKeys.byRole(roleId ?? 0),
    queryFn: async () => {
      if (roleId == null) return [];
      const response = await userProfileService.user_profiles_list_by_role_id(roleId);
      return normalizeUserProfiles(response.profiles ?? []);
    },
    enabled: roleId != null,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useCreateUserProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation<UserProfile, Error, CreateUserProfileParams>({
    mutationFn: async (payload) => {
      const response = await userProfileService.user_profiles_create(payload);
      if (!response.profile) throw new Error(response.message || i18n.t('addUsers.createFailed'));
      return normalizeUserProfile(response.profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userProfileQueryKeys.all });
      toast.success(i18n.t('addUsers.userCreated'));
    },
    onError: (error) => {
      toast.error(error.message || i18n.t('addUsers.unableCreateUser'));
    },
  });
}

export function useUpdateUserProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation<UserProfile, Error, UpdateUserProfileParams>({
    mutationFn: async (payload) => {
      const response = await userProfileService.user_profiles_update(payload);
      if (!response.profile) throw new Error(response.message || i18n.t('addUsers.updateFailed'));
      return normalizeUserProfile(response.profile);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userProfileQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: userProfileQueryKeys.detail(variables.id) });
      toast.success(i18n.t('addUsers.userUpdated'));
    },
    onError: (error) => {
      toast.error(error.message || i18n.t('addUsers.unableUpdateUser'));
    },
  });
}

export function useDeleteUserProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, DeleteUserProfileParams>({
    mutationFn: async (payload) => {
      await userProfileService.user_profiles_delete(payload);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userProfileQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: userProfileQueryKeys.detail(variables.id) });
      toast.success(i18n.t('addUsers.userDeleted'));
    },
    onError: (error) => {
      toast.error(error.message || i18n.t('addUsers.unableDeleteUser'));
    },
  });
}
