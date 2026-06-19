import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { visitService } from '../services/visit.service';
import type {
  ClinicVisitRpcItem,
  VitalSignRpcItem,
  ClinicVisitsUpcomingFilters,
  ClinicVisitCreateInput,
  ClinicVisitUpdateInput,
  VitalSignCreateInput,
  VitalSignUpdateInput,
} from '../types/visitRpc';

export function useClinicVisits(patientId: number) {
  return useQuery<ClinicVisitRpcItem[], Error>({
    queryKey: ['clinic-visits-by-patient', patientId],
    queryFn: () => visitService.listVisitsByPatient(patientId),
    enabled: patientId > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useVisitDetail(visitId: number | null) {
  return useQuery<ClinicVisitRpcItem | null, Error>({
    queryKey: ['clinic-visit-detail', visitId],
    queryFn: () => visitService.getVisitById(visitId!),
    enabled: !!visitId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateVisit(patientId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ClinicVisitCreateInput) => visitService.createVisit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-visits-by-patient', patientId] });
    },
  });
}

export function useUpdateVisit(patientId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ClinicVisitUpdateInput) => visitService.updateVisit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-visits-by-patient', patientId] });
    },
  });
}

export function useDeleteVisit(patientId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (visitId: number) => visitService.deleteVisit(visitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic-visits-by-patient', patientId] });
    },
  });
}

export function useAllClinicVisits() {
  return useQuery<ClinicVisitRpcItem[], Error>({
    queryKey: ['clinic-visits-all'],
    queryFn: () => visitService.listAllVisits(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useClinicVisitsUpcoming(filters?: ClinicVisitsUpcomingFilters) {
  return useQuery<any[], Error>({
    queryKey: ['clinic-visits-upcoming', filters ?? {}],
    queryFn: () => visitService.listUpcomingDualDate(filters ?? {}),
    staleTime: 1000 * 60,
  });
}

export function useVisitVitals(visitId: number | null) {
  return useQuery<VitalSignRpcItem[], Error>({
    queryKey: ['visit-vitals', visitId],
    queryFn: () => visitService.listVitalsByVisit(visitId!),
    enabled: !!visitId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateVital(visitId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VitalSignCreateInput) => visitService.createVitalSign(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-vitals', visitId] });
    },
  });
}

export function useUpdateVital(visitId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VitalSignUpdateInput) => visitService.updateVitalSign(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-vitals', visitId] });
    },
  });
}

export function useDeleteVital(visitId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vitalId: number) => visitService.deleteVitalSign(vitalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-vitals', visitId] });
    },
  });
}
