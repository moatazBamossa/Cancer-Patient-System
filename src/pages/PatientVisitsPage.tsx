import React, { useEffect, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import toast from "react-hot-toast"
import { format } from "date-fns"
import { AddVisitForm } from "../components/AddVisitForm"
import { AddVitalSignsForm } from "../components/AddVitalSignsForm"
import { RecordedVitalSigns } from "../components/RecordedVitalSigns"
import {
  useClinicVisits,
  useDeleteVisit,
  useVisitDetail,
} from "../hooks/useClinicVisits"
import { doctorService } from "../services/doctor.service"
import { diagnosisService } from "../services/diagnosis.service"
import { ConfirmDialog } from "../components/ui/ConfirmDialog"
import type { Doctor, Diagnosis } from "../types"
import { useTranslation } from "react-i18next"

interface PatientVisitsPageProps {
  patientId: number
}

function formatDate(value?: string) {
  return value ? format(new Date(value), "PPP") : "—"
}

function formatDateTime(value?: string) {
  return value ? format(new Date(value), "PPpp") : "—"
}

export function PatientVisitsPage({ patientId }: PatientVisitsPageProps) {
  const { t } = useTranslation()
  const {
    data: visits = [],
    isLoading: visitsLoading,
    error: visitsError,
  } = useClinicVisits(patientId)
  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ["doctors"],
    queryFn: () => doctorService.getAll(),
    staleTime: 1000 * 60 * 10,
  })
  const { data: diagnoses } = useQuery({
    queryKey: ["diagnoses", patientId],
    queryFn: () => diagnosisService.getByPatientID(patientId ?? NaN),
    staleTime: 1000 * 60 * 10,
    enabled: !!patientId,
  })

  const [selectedVisitId, setSelectedVisitId] = useState<number | null>(null)
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false)
  const [isAddVitalOpen, setIsAddVitalOpen] = useState(false)
  const [confirmDeleteVisit, setConfirmDeleteVisit] = useState<number | null>(
    null,
  )

  const deleteVisit = useDeleteVisit(patientId)
  const { data: selectedVisitDetail } = useVisitDetail(selectedVisitId)

  const selectedVisit =
    selectedVisitDetail ??
    visits.find((visit) => visit.visit_id === selectedVisitId) ??
    null

  useEffect(() => {
    if (!selectedVisitId && visits.length > 0) {
      setSelectedVisitId(visits[0].visit_id)
    }
  }, [visits, selectedVisitId])

  const onVisitCreated = () => {
    setIsAddVisitOpen(false)
    setTimeout(() => {
      if (visits.length > 0) {
        setSelectedVisitId(visits[0].visit_id)
      }
    }, 100)
  }

  const doctorMap = useMemo(
    () =>
      new Map(
        doctors.map((doctor) => [Number(doctor.doctor_id), doctor.full_name]),
      ),
    [doctors],
  )

  const diagnosisMap = useMemo(
    () =>
      new Map(
        diagnoses?.map((diagnosis) => [
          Number(diagnosis.diagnosis_id),
          diagnosis,
        ]),
      ),
    [diagnoses],
  )

  const selectedDoctorName =
    selectedVisit?.doctor_name ||
    (selectedVisit ? doctorMap.get(selectedVisit.doctor_id) : undefined)
  const selectedDiagnosis = selectedVisit?.diagnosis_id
    ? diagnosisMap.get(selectedVisit.diagnosis_id)
    : undefined
  const visitTypeLabels: Record<string, string> = {
    new_visit: t("visits.newVisit"),
    follow_up: t("visits.visitTypeLabels.followUp"),
    emergency: t("visits.visitTypeLabels.emergency"),
    treatment_session: t("visits.treatmentSession"),
    consultation: t("visits.visitTypeLabels.consultation"),
  }

  const handleDeleteVisit = async () => {
    if (!confirmDeleteVisit) return
    try {
      await deleteVisit.mutateAsync(confirmDeleteVisit)
      toast.success(t("visits.clinicVisitDeleted"))
      setConfirmDeleteVisit(null)
      if (selectedVisitId === confirmDeleteVisit) {
        setSelectedVisitId(
          visits.filter((visit) => visit.visit_id !== confirmDeleteVisit)[0]
            ?.visit_id ?? null,
        )
      }
    } catch (error) {
      toast.error(
        (error as Error).message || t("visits.unableDeleteClinicVisit"),
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("visits.clinicVisits")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("visits.managePatientVisits")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddVisitOpen(true)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {t("visits.addNewVisit")}
        </button>
      </div>

      {visitsError ? (
        <div
          className="rounded-2xl border p-4"
          style={{
            borderColor: "var(--border-color)",
            background: "var(--bg-secondary)",
          }}
        >
          <p className="text-sm font-semibold text-red-600">
            {t("visits.unableLoadVisits")}
          </p>
          <p className="text-sm text-slate-500">{visitsError.message}</p>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <section className="space-y-4">
          <div
            className="rounded-3xl border p-5 shadow-sm"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                  {t("common.visits")}
                </p>
                <p
                  className="mt-1 text-2xl font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {visits.length}
                </p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                {t("visits.patientId", { id: patientId })}
              </span>
            </div>
          </div>

          <div
            className="rounded-3xl border p-3"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            {visitsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="h-24 rounded-2xl bg-slate-200 animate-pulse"
                  />
                ))}
              </div>
            ) : visits.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {t("visits.noVisitsYet")}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {t("visits.scheduleFirstVisit")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visits.map((visit) => (
                  <button
                    type="button"
                    key={visit.visit_id}
                    onClick={() => setSelectedVisitId(visit.visit_id)}
                    className={`block w-full rounded-3xl border p-4 text-left transition ${selectedVisitId === visit.visit_id ? "border-blue-500 bg-blue-50 shadow-sm" : "border-transparent bg-white hover:border-slate-300"}`}
                    style={{
                      borderColor:
                        selectedVisitId === visit.visit_id
                          ? "rgb(59 130 246)"
                          : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className="font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {visitTypeLabels[visit.visit_type ?? ""] ??
                          t("visits.clinicVisit")}
                      </p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {formatDate(visit.visit_date)}
                      </p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                      {visit.reason_for_visit}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {visit.doctor_name ??
                          doctorMap.get(visit.doctor_id) ??
                          t("common.doctor")}
                      </span>
                      <span>
                        {visit.next_visit_date
                          ? formatDate(visit.next_visit_date)
                          : t("visits.noNextVisit")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div
            className="rounded-3xl border p-5 shadow-sm"
            style={{
              borderColor: "var(--border-color)",
              background: "var(--bg-secondary)",
            }}
          >
            {selectedVisit ? (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                      {t("visits.visitDetails")}
                    </p>
                    <h2
                      className="mt-2 text-2xl font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {visitTypeLabels[selectedVisit.visit_type ?? ""] ??
                        t("visits.clinicVisit")}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmDeleteVisit(selectedVisit.visit_id)
                    }
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                  >
                    {t("visits.deleteVisit")}
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div
                    className="rounded-3xl border p-4"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {t("visits.visitDate")}
                    </p>
                    <p
                      className="mt-2 font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {formatDateTime(selectedVisit.visit_date)}
                    </p>
                  </div>
                  <div
                    className="rounded-3xl border p-4"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {t("visits.nextVisit")}
                    </p>
                    <p
                      className="mt-2 font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {selectedVisit.next_visit_date
                        ? formatDate(selectedVisit.next_visit_date)
                        : t("common.none")}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div
                    className="rounded-3xl border p-4"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {t("common.doctor")}
                    </p>
                    <p
                      className="mt-2 font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {selectedDoctorName ?? t("common.unknown")}
                    </p>
                  </div>
                  <div
                    className="rounded-3xl border p-4"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {t("diagnoses.diagnosis")}
                    </p>
                    <p
                      className="mt-2 font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {selectedDiagnosis?.cancer_name ??
                        selectedDiagnosis?.notes ??
                        t("common.unknown")}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div
                    className="rounded-3xl border p-4"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {t("visits.reasonForVisit")}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {selectedVisit.reason_for_visit}
                    </p>
                  </div>

                  {selectedVisit.clinical_notes ? (
                    <div
                      className="rounded-3xl border p-4"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {t("visits.consultationNotes")}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">
                        {selectedVisit.clinical_notes}
                      </p>
                    </div>
                  ) : null}

                  {selectedVisit.recommendations ? (
                    <div
                      className="rounded-3xl border p-4"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {t("visits.recommendations")}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">
                        {selectedVisit.recommendations}
                      </p>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <div
                className="rounded-3xl border p-6 text-center"
                style={{
                  borderColor: "var(--border-color)",
                  background: "var(--bg-secondary)",
                }}
              >
                <p className="text-sm font-medium text-slate-700">
                  {t("visits.selectVisitToReview")}
                </p>
              </div>
            )}
          </div>

          <RecordedVitalSigns
            visitId={selectedVisit?.visit_id ?? null}
            onAddVital={() => setIsAddVitalOpen(true)}
          />
        </section>
      </div>

      <AddVisitForm
        patientId={patientId}
        doctors={doctors}
        diagnoses={diagnoses ?? []}
        isOpen={isAddVisitOpen}
        onClose={() => setIsAddVisitOpen(false)}
        onSuccess={onVisitCreated}
      />

      <AddVitalSignsForm
        visitId={selectedVisit?.visit_id ?? null}
        isOpen={isAddVitalOpen}
        onClose={() => setIsAddVitalOpen(false)}
        onSuccess={() => setIsAddVitalOpen(false)}
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteVisit}
        title={t("visits.deleteClinicVisitTitle")}
        message={t("visits.deleteClinicVisitMessage")}
        onClose={() => setConfirmDeleteVisit(null)}
        onConfirm={handleDeleteVisit}
        variant="danger"
      />
    </div>
  )
}

export default PatientVisitsPage
