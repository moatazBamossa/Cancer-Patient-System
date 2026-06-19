import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { labService, LabTestPatientDto } from '../services/lab.service';
import type { LabTest, LabTestResult } from '../types';

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
      toast.success('Lab test created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to create lab test');
    },
  });
}

export function useUpdateLabTest() {
  const queryClient = useQueryClient();
  return useMutation<LabTest, Error, { id: string; data: Omit<LabTest, 'lab_test_id'> }>({
    mutationFn: ({ id, data }) => labService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-tests'] });
      toast.success('Lab test updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to update lab test');
    },
  });
}

export function useDeleteLabTest() {
  const queryClient = useQueryClient();
  return useMutation<number, Error, string>({
    mutationFn: labService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-tests'] });
      toast.success('Lab test deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to delete lab test');
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
      toast.success('Lab test result created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to create lab test result');
    },
  });
}

export function useUpdateLabTestPatient() {
  const queryClient = useQueryClient();
  return useMutation<LabTestPatientDto, Error, LabTestPatientDto>({
    mutationFn: labService.updatePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-patients'] });
      toast.success('Lab test result updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to update lab test result');
    },
  });
}

export function useDeleteLabTestPatient() {
  const queryClient = useQueryClient();
  return useMutation<number, Error, string>({
    mutationFn: labService.deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-test-patients'] });
      toast.success('Lab test result deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to delete lab test result');
    },
  });
}
