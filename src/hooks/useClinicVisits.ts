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

// Query key creators
export const createClinicVisitsQueryKey = (patientId: number) => ['clinic-visits-by-patient', patientId];
export const createVisitDetailQueryKey = (visitId: number) => ['clinic-visit-detail', visitId];
export const createAllClinicVisitsQueryKey = () => ['clinic-visits-all'];
export const createUpcomingClinicVisitsQueryKey = (filters?: ClinicVisitsUpcomingFilters) =>
  ['clinic-visits-upcoming', filters ?? {}];
export const createVisitVitalsQueryKey = (visitId?: number | null) => ['visit-vitals', visitId];

// Query hooks
export function useClinicVisits(patientId: number) {
  return useQuery<ClinicVisitRpcItem[], Error>({
    queryKey: createClinicVisitsQueryKey(patientId),
    queryFn: () => visitService.listVisitsByPatient(patientId),
    enabled: patientId > 0,
    staleTime: 1000 * 60 * 2,
  });
}

export function useVisitDetail(visitId: number | null) {
  return useQuery<ClinicVisitRpcItem | null, Error>({
    queryKey: createVisitDetailQueryKey(visitId!),
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
      queryClient.invalidateQueries({ queryKey: createClinicVisitsQueryKey(patientId) });
    },
  });
}

export function useUpdateVisit(patientId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ClinicVisitUpdateInput) => visitService.updateVisit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createClinicVisitsQueryKey(patientId) });
    },
  });
}

export function useDeleteVisit(patientId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (visitId: number) => visitService.deleteVisit(visitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createClinicVisitsQueryKey(patientId) });
    },
  });
}

export function useAllClinicVisits() {
  return useQuery<ClinicVisitRpcItem[], Error>({
    queryKey: createAllClinicVisitsQueryKey(),
    queryFn: () => visitService.listAllVisits(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useClinicVisitsUpcoming(filters?: ClinicVisitsUpcomingFilters) {
  return useQuery<any[], Error>({
    queryKey: createUpcomingClinicVisitsQueryKey(filters),
    queryFn: () => visitService.listUpcomingDualDate(filters ?? {}),
    staleTime: 1000 * 60,
  });
}

export function useVisitVitals(visitId: number | null) {
  return useQuery<VitalSignRpcItem[], Error>({
    queryKey: createVisitVitalsQueryKey(visitId),
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
      queryClient.invalidateQueries({ queryKey: createVisitVitalsQueryKey(visitId) });
    },
  });
}

export function useUpdateVital(visitId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VitalSignUpdateInput) => visitService.updateVitalSign(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createVisitVitalsQueryKey(visitId) });
    },
  });
}

export function useDeleteVital(visitId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vitalId: number) => visitService.deleteVitalSign(vitalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: createVisitVitalsQueryKey(visitId) });
    },
  });
}
