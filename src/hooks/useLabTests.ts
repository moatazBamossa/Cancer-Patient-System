import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { labService, LabTestPatientDto } from '../services/lab.service';
import type { LabTest, LabTestResult } from '../types';
import i18n from '../i18n/config';

export function useLabTests() {
  return useQuery<LabTest[], Error>({
    queryKey: ['lab-tests'],
    queryFn: labService.list,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useCreateLabTest() {
  const queryClient = useQueryClient();
  return useMutation<LabTest, Error, Omit<LabTest, 'lab_test_id'>>({
    mutationFn: labService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-tests'] });
      toast.success(i18n.t('lab.testCreated'));
    },
    onError: (error) => {
      toast.error(error.message || i18n.t('lab.unableCreateTest'));
    },
  });
}

export function useUpdateLabTest() {
  const queryClient = useQueryClient();
  return useMutation<LabTest, Error, { id: string; data: Omit<LabTest, 'lab_test_id'> }>({
    mutationFn: ({ id, data }) => labService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-tests'] });
      toast.success(i18n.t('lab.testUpdated'));
    },
    onError: (error) => {
      toast.error(error.message || i18n.t('lab.unableUpdateTest'));
    },
  });
}

export function useDeleteLabTest() {
  const queryClient = useQueryClient();
  return useMutation<number, Error, string>({
    mutationFn: labService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-tests'] });
      toast.success(i18n.t('lab.testDeleted'));
    },
    onError: (error) => {
      toast.error(error.message || i18n.t('lab.unableDeleteTest'));
    },
  });
}

export function useLabTestPatients() {
  return useQuery<LabTestPatientDto[], Error>({
    queryKey: ['lab-test-patients'],
    queryFn: labService.listPatients,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useCreateLabTestPatient() {
  const queryClient = useQueryClient();
  return useMutation<LabTestResult, Error, Omit<LabTestResult, 'lab_test_patient_id'>>({
    mutationFn: labService.createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-patients'] });
      toast.success(i18n.t('lab.resultCreated'));
    },
    onError: (error) => {
      toast.error(error.message || i18n.t('lab.unableCreateResult'));
    },
  });
}

export function useUpdateLabTestPatient() {
  const queryClient = useQueryClient();
  return useMutation<LabTestPatientDto, Error, LabTestPatientDto>({
    mutationFn: labService.updatePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-patients'] });
      toast.success(i18n.t('lab.resultUpdated'));
    },
    onError: (error) => {
      toast.error(error.message || i18n.t('lab.unableUpdateResult'));
    },
  });
}

export function useDeleteLabTestPatient() {
  const queryClient = useQueryClient();
  return useMutation<number, Error, string>({
    mutationFn: labService.deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-patients'] });
      toast.success(i18n.t('lab.resultDeleted'));
    },
    onError: (error) => {
      toast.error(error.message || i18n.t('lab.unableDeleteResult'));
    },
  });
}
