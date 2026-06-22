import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { imagingService } from '../services/imaging.service';
import i18n from '../i18n/config';
import type {
  ImagingReport,
  ImagingReportCreateInput,
  ImagingReportListFilters,
  ImagingReportUpdateInput,
} from '../types';

export function useImagingReports(filters: ImagingReportListFilters| undefined) {
  return useQuery<ImagingReport[], Error>({
    queryKey: ['imaging-reports', filters],
    queryFn: async () => imagingService.getAll(filters),
    staleTime: 60 * 1000,
    retry: 1,
  });
}

export function useCreateImagingReportMutation() {
  const queryClient = useQueryClient();

  return useMutation<ImagingReport, Error, ImagingReportCreateInput>({
    mutationFn: async (payload) => imagingService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-reports'] });
      toast.success(i18n.t('imaging.uploadSuccess'));
    },
    onError: (error) => {
      toast.error(error.message || i18n.t('imaging.unableUpload'));
    },
  });
}

export function useUpdateImagingReportMutation() {
  const queryClient = useQueryClient();

  return useMutation<ImagingReport, Error, ImagingReportUpdateInput>({
    mutationFn: async (payload) => imagingService.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-reports'] });
      toast.success(i18n.t('imaging.updateSuccess'));
    },
    onError: (error) => {
      toast.error(error.message || i18n.t('imaging.unableUpdate'));
    },
  });
}

export function useDeleteImagingReportMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (imageId) => imagingService.delete(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['imaging-reports'] });
      toast.success(i18n.t('imaging.deleteSuccess'));
    },
    onError: (error) => {
      toast.error(error.message || i18n.t('imaging.unableDelete'));
    },
  });
}
