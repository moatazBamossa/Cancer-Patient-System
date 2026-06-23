import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { z } from "zod"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { visitService } from "../../services/visit.service"
import { DataTable, type Column } from "../../components/ui/DataTable"
import { Modal } from "../../components/ui/Modal"
import { AppForm } from "../../components/ui/AppForm"
import { FormField, FormSelectField } from "../../components/ui/FormField"
import { zodValidator } from "../../lib/zodValidator"
import { formatDate, formatTime } from "../../lib/utils"
import { getDataStore } from "../../services/mockApi"
import type { ClinicVisitRpcItem } from "../../types/visitRpc"
import { patientService } from "../../services/patient.service"
import { doctorService } from "../../services/doctor.service"
import { diagnosisService } from "../../services/diagnosis.service"
import { FormSpy } from "react-final-form"
import { format, set } from "date-fns"
import { ConfirmDialog } from "../../components/ui/ConfirmDialog"

export default function VisitsPage() {
  const { t } = useTranslation()
  const visitSchema = z.object({
    patient_id: z.string().min(1, t("visits.validation.patientRequired") ?? "Patient is required"),
    doctor_id: z.string().min(1, t("visits.validation.doctorRequired") ?? "Doctor is required"),
    visit_date: z.string().min(1, t("visits.validation.visitDateTimeRequired") ?? "Visit date is required"),
    visit_type: z.enum(["Follow-up", "Emergency", "Routine", "Post-treatment"]),
    reason_for_visit: z.string().min(1, t("visits.validation.reasonRequired") ?? "Reason is required"),
    clinical_notes: z.string().optional().default(""),
    recommendations: z.string().optional().default(""),
    next_visit_date: z.string().optional().default(""),
    diagnosis_id: z.string().optional().default(""),
  })
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState<ClinicVisitRpcItem | null>(
    null,
  )
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState({
    isOpen: false,
    id: NaN,
  })
  const [page, setPage] = useState(1)
  const [patientId, setPatientId] = useState<string | null>(null)
  const [doctor, setDoctor] = useState<
    | {
        value: string
        label: string
      }[]
    | null
  >(null)
  const [formKey, setFormKey] = useState(0)

  type VisitForm = {
    patient_id: string;
    doctor_id: string;
    visit_date: string;
    visit_type: "Follow-up" | "Emergency" | "Routine" | "Post-treatment";
    reason_for_visit: string;
    clinical_notes: string;
    recommendations: string;
    next_visit_date: string;
    diagnosis_id: string;
  }

  const { data: allVisits, isLoading } = useQuery({
    queryKey: ["clinic-visits"],
    queryFn: () => visitService.listAllVisits(),
  })

  const { data: diagnosesData, isLoading: diagnosesLoading } = useQuery({
    queryKey: ["diagnoses-list", patientId],
    queryFn: () => diagnosisService.getByPatientID(Number(patientId) ?? NaN),
    enabled: !!patientId,
  })

  const closeForm = () => {
    setSelectedVisit(null)
    setIsEditing(false)
    setShowForm(false)
  }

  const updateMut = useMutation({
    mutationFn: (input: Parameters<typeof visitService.updateVisit>[0]) =>
      visitService.updateVisit(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinic-visits"] })
      toast.success(t("visits.visitUpdated"))
      closeForm()
    },
  })

  const { data: patientsData, isLoading: isPatientsLoading } = useQuery({
    queryKey: ["patients", page],
    queryFn: () =>
      patientService.getAll({
        page: 1,
        pageSize: 100, // Fetch more patients for the dropdown
      }),
    enabled: true,
    select: (patients) =>
      patients.data.map((p) => ({
        value: p.patient_id,
        label: p.full_name ?? "",
      })),
  })

  const createMut = useMutation({
    mutationFn: (d: VisitForm) =>
      visitService.createVisit({
        p_patient_id: Number(d.patient_id),
        p_doctor_id: Number(d.doctor_id),
        p_diagnosis_id: d.diagnosis_id ? Number(d.diagnosis_id) : null,
        p_visit_date: d.visit_date,
        p_visit_type: d.visit_type,
        p_reason_for_visit: d.reason_for_visit,
        p_clinical_notes: d.clinical_notes || undefined,
        p_recommendations: d.recommendations || undefined,
        p_next_visit_date: d.next_visit_date || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinic-visits"] })
      toast.success(t("visits.visitScheduled"))
      closeForm()
    },
  })

  const deleteMut = useMutation({
    mutationFn: (visitId: number) => visitService.deleteVisit(visitId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinic-visits"] })
      toast.success(t("visits.visitDeleted"))
    },
  })

  const visitInitialValues: VisitForm = selectedVisit
    ? {
        patient_id: String(selectedVisit.patient_id),
        doctor_id: String(selectedVisit.doctor_id),
        diagnosis_id: selectedVisit.diagnosis_id
          ? String(selectedVisit.diagnosis_id)
          : "",

        visit_date: selectedVisit.visit_date
          ? format(new Date(selectedVisit.visit_date), "yyyy-MM-dd")
          : "",
        visit_type: selectedVisit.visit_type as VisitForm["visit_type"],
        reason_for_visit: selectedVisit.reason_for_visit,
        clinical_notes: selectedVisit.clinical_notes ?? "",
        recommendations: selectedVisit.recommendations ?? "",
        next_visit_date: selectedVisit.next_visit_date ?? "",
      }
    : {
        patient_id: "",
        doctor_id: "",
        visit_date: "",
        visit_type: "Routine",
        reason_for_visit: "",
        clinical_notes: "",
        recommendations: "",
        next_visit_date: "",
        diagnosis_id: "",
      }

  const openForm = () => {
    setSelectedVisit(null)
    setIsEditing(false)
    setFormKey((k) => k + 1)
    setShowForm(true)
  }

  const columns: Column<ClinicVisitRpcItem>[] = [
    {
      key: "patient_name",
      header: t("diagnoses.patient"),
      render: (v) => (
        <span className="font-medium">{String(v) || t("common.unknown")}</span>
      ),
    },
    {
      key: "doctor_name",
      header: t("diagnoses.doctor"),
      render: (v) => (
        <span className="text-indigo-500 font-medium">
          {String(v) || t("common.unknown")}
        </span>
      ),
    },
    {
      key: "visit_type",
      header: t("visits.type"),
      render: (v) => {
        const colors: Record<string, string> = {
          "Follow-up": "bg-emerald-500/10 text-emerald-500",
          Emergency: "bg-red-500/10 text-red-500",
          Routine: "bg-blue-500/10 text-blue-500",
          "Post-treatment": "bg-purple-500/10 text-purple-500",
        }
        const typeLabels: Record<string, string> = {
          "Follow-up": t("visits.visitTypeLabels.followUp"),
          Emergency: t("visits.visitTypeLabels.emergency"),
          Routine: t("visits.visitTypeLabels.routine"),
          "Post-treatment": t("visits.postTreatment"),
        }
        return (
          <span
            className={`text-[10px] items-center gap-1.5 px-2 py-0.5 rounded-full font-bold uppercase ${colors[String(v)] || colors.Routine}`}
          >
            {typeLabels[String(v)] || String(v)}
          </span>
        )
      },
    },
    {
      key: "reason_for_visit",
      header: t("visits.reasonForVisit"),
      render: (v) => (
        <span className="truncate max-w-[150px] block text-xs">
          {String(v)}
        </span>
      ),
    },
    {
      key: "visit_date",
      header: t("visits.dateTime"),
      sortable: true,
      render: (v) => (
        <div className="flex flex-col">
          <span
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {formatDate(String(v))}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-tighter">
            {formatTime(String(v))}
          </span>
        </div>
      ),
    },
    {
      key: "next_visit_date",
      header: t("visits.nextVisitDate"),
      sortable: true,
      render: (v) => (
        <div className="flex flex-col">
          <span
            className="font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {formatDate(String(v))}
          </span>
          <span className="text-[10px] text-slate-500 uppercase tracking-tighter">
            {formatTime(String(v))}
          </span>
        </div>
      ),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("visits.title")}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("visits.subtitle")}
          </p>
        </div>
        <button
          onClick={openForm}
          className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5"
        >
          <Plus size={16} /> {t("visits.scheduleVisit")}
        </button>
      </div>

      <DataTable<ClinicVisitRpcItem>
        columns={columns}
        data={allVisits ? allVisits.slice((page - 1) * 12, page * 12) : []}
        totalItems={allVisits?.length}
        page={page}
        pageSize={12}
        onPageChange={setPage}
        isLoading={isLoading || isPatientsLoading || diagnosesLoading}
        searchPlaceholder={t("visits.searchPlaceholder")}
        emptyMessage={t("visits.noVisits")}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-slate-600 hover:text-slate-900"
              onClick={(event) => {
                event.stopPropagation()
                setSelectedVisit(row)
                setIsEditing(true)
                setFormKey((k) => k + 1)
                setShowForm(true)
              }}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="text-red-500 hover:text-red-700"
              onClick={() => {
                setShowDeleteConfirm({
                  isOpen: true,
                  id: Number(row.visit_id),
                })
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={isEditing ? t("visits.editVisit") : t("visits.scheduleTitle")}
        size="lg"
      >
        <AppForm<VisitForm>
          formKey={formKey}
          initialValues={visitInitialValues}
          validate={zodValidator(visitSchema)}
          onSubmit={(d) => {
            if (selectedVisit && isEditing) {
              updateMut.mutate({
                p_visit_id: selectedVisit.visit_id,
                p_patient_id: Number(d.patient_id),
                p_doctor_id: Number(d.doctor_id),
                p_diagnosis_id: d.diagnosis_id ? Number(d.diagnosis_id) : null,
                p_visit_date: d.visit_date,
                p_visit_type: d.visit_type,
                p_reason_for_visit: d.reason_for_visit,
                p_clinical_notes: d.clinical_notes || undefined,
                p_recommendations: d.recommendations || undefined,
                p_next_visit_date: d.next_visit_date || null,
              })
            } else {
              createMut.mutate(d)
            }
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormSpy
              subscription={{ values: true }}
              onChange={({ values: val }) => {
                setPatientId(val?.patient_id || null)

                const result = diagnosesData?.find(
                  (item) =>
                    Number(item.diagnosis_id) ===
                    Number(val?.diagnosis_id || NaN),
                )

                setDoctor(
                  result
                    ? [
                        {
                          value: result?.supervising_doctor_id ?? "",
                          label: result?.doctor_name ?? "",
                        },
                      ]
                    : null,
                )
              }}
            />
            <FormSelectField
              options={patientsData || []}
              name="patient_id"
              label={t("diagnoses.patient")}
              required
            />

            <FormSelectField
              name="diagnosis_id"
              label={t("diagnoses.diagnosis")}
              required
              options={
                diagnosesData?.map((d) => ({
                  value: d.diagnosis_id,
                  label:
                    d.cancer_name ?? d.notes ?? String(d.diagnosis_id ?? ""),
                })) || []
              }
            />

            <FormSelectField
              name="doctor_id"
              label={t("diagnoses.doctor")}
              required
              options={doctor || []}
            />

            <FormField
              name="visit_date"
              label={t("visits.dateTime")}
              type="date"
              required
            />
            <FormField
              name="visit_type"
              label={t("visits.visitType")}
              type="select"
              required
              options={[
                { value: "Follow-up", label: t("visits.followUp") },
                { value: "Emergency", label: t("visits.emergency") },
                { value: "Routine", label: t("visits.regular") },
                { value: "Post-treatment", label: t("visits.postTreatment") },
              ]}
            />
          </div>
          <FormField
            name="reason_for_visit"
            label={t("visits.reasonForVisit")}
            required
          />
          <FormField
            name="clinical_notes"
            label={t("visits.consultationNotes")}
            type="textarea"
          />
          <FormField
            name="recommendations"
            label={t("visits.recommendations")}
            type="textarea"
          />
          <FormField
            name="next_visit_date"
            label={t("visits.nextVisitDate")}
            type="date"
          />
          <div className="flex justify-end pt-4">
            <button
              disabled={updateMut.isPending}
              type="submit"
              className={`${updateMut.isPending ? "gradient-disabled-btn" : "gradient-btn"} px-6 py-2.5 text-sm`}
            >
              {t("visits.scheduleAppointment")}
            </button>
          </div>
        </AppForm>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm.isOpen}
        onClose={() => setShowDeleteConfirm({
          isOpen:false,
          id:NaN
        })}
        onConfirm={() => {
          if (showDeleteConfirm?.id) deleteMut.mutate(showDeleteConfirm.id)
        }}
        title={t("common.delete", { defaultValue: "Delete" })}
        message={t("visits.deleteConfirm")}
        variant="danger"
      />
    </motion.div>
  )
}
