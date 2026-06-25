import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  Activity,
  Thermometer,
  Heart,
  Wind,
  Droplet,
  Scale,
  Calendar,
  User as UserIcon,
  FileText,
  ChevronDown,
  ChevronUp,
  Ruler,
  Divide,
} from "lucide-react"
import { z } from "zod"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { useField } from "react-final-form"
import { visitService } from "../../services/visit.service"
import { patientService } from "../../services/patient.service"
import { doctorService } from "../../services/doctor.service"
import { diagnosisService } from "../../services/diagnosis.service"
import { Modal } from "../../components/ui/Modal"
import { AppForm } from "../../components/ui/AppForm"
import { FormField, FormSelectField } from "../../components/ui/FormField"
import { zodValidator } from "../../lib/zodValidator"
import { formatDate, formatTime } from "../../lib/utils"
import type { ClinicVisitRpcItem, VitalSignRpcItem } from "../../types/visitRpc"
import { useVisitVitals } from "../../hooks/useClinicVisits";

type CombinedVisitForm = {
  p_patient_id: string;
  p_doctor_id: string;
  p_diagnosis_id?: string;
  p_visit_date: string;
  p_visit_type: "Routine" | "Follow-up" | "Emergency" | "Post-treatment";
  p_reason_for_visit: string;
  p_clinical_notes?: string;
  p_recommendations?: string;
  p_next_visit_date?: string;
  include_vitals: boolean;
  p_temperature?: number | "";
  p_blood_pressure_sys?: number | "";
  p_blood_pressure_dia?: number | "";
  p_heart_rate?: number | "";
  p_respiratory_rate?: number | "";
  p_spo2?: number | "";
  p_weight_kg?: number | "";
  p_height_cm?: number | "";
  p_vital_notes?: string;
}

const DEFAULT_FORM_VALUES: CombinedVisitForm = {
  p_patient_id: "",
  p_doctor_id: "",
  p_diagnosis_id: "",
  p_visit_date: "",
  p_visit_type: "Routine",
  p_reason_for_visit: "",
  p_clinical_notes: "",
  p_recommendations: "",
  p_next_visit_date: "",
  include_vitals: false,
  p_temperature: "",
  p_blood_pressure_sys: "",
  p_blood_pressure_dia: "",
  p_heart_rate: "",
  p_respiratory_rate: "",
  p_spo2: "",
  p_weight_kg: "",
  p_height_cm: "",
  p_vital_notes: "",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VITAL_RANGES = {
  temperature: { min: 36.5, max: 37.5 },
  blood_pressure_sys: { min: 90, max: 120 },
  blood_pressure_dia: { min: 60, max: 80 },
  heart_rate: { min: 60, max: 100 },
  respiratory_rate: { min: 12, max: 20 },
  spo2: { min: 95, max: 100 },
  weight_kg: { min: 65, max: 75 },
  height_cm: { min: 170, max: 180 },
  bmi: { min: 18.5, max: 24.9 },
} as const

type VitalStatus = "low" | "normal" | "high"

function getVitalStatus(type: keyof typeof VITAL_RANGES, value: number): VitalStatus {
  const range = VITAL_RANGES[type]
  if (value < range.min) return "low"
  if (value > range.max) return "high"
  return "normal"
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const STATUS_STYLES = {
  low: {
    card: "bg-blue-500/10 border-blue-500/30 shadow-[0_0_12px_-4px_rgba(59,130,246,0.3)]",
    icon: "bg-blue-500/20 text-blue-500",
    label: "bg-blue-500/20 text-blue-500",
    value: "text-blue-500",
    badge: "LOW",
  },
  normal: {
    card: "glass-card",
    icon: "bg-indigo-500/10 text-indigo-500",
    label: "",
    value: "text-slate-900 dark:text-white",
    badge: "",
  },
  high: {
    card: "bg-red-500/10 border-red-500/30 shadow-[0_0_12px_-4px_rgba(239,68,68,0.3)]",
    icon: "bg-red-500/20 text-red-500",
    label: "bg-red-500/20 text-red-500",
    value: "text-red-500",
    badge: "HIGH",
  },
} as const

function VitalCard({
  title,
  value,
  unit,
  icon,
  status,
}: {
  title: string
  value: string | number
  unit: string
  icon: React.ReactNode
  status: VitalStatus
}) {
  const { t } = useTranslation()
  const styles = STATUS_STYLES[status]

  return (
    <div className={`p-4 rounded-xl border transition-all ${styles.card}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${styles.icon}`}>{icon}</div>
        {status !== "normal" && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles.label}`}>
            {status === "low" ? t("vitals.low") : t("vitals.high")}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        {title}
      </p>
      <div className="flex items-baseline flex-wrap gap-1 mt-1">
        <span className={`text-2xl font-bold ${styles.value}`}>{value}</span>
        <span className="text-sm font-medium text-slate-500">{unit}</span>
      </div>
    </div>
  )
}

function VitalsRow({ v }: { v: VitalSignRpcItem }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {v.blood_pressure_sys && v.blood_pressure_dia && (
          <VitalCard
            title={t("vitals.bloodPressure")}
            value={`${v.blood_pressure_sys}/${v.blood_pressure_dia}`}
            unit="mmHg"
            icon={<Heart size={18} />}
            status={(() => {
              const sys = getVitalStatus("blood_pressure_sys", v.blood_pressure_sys!)
              const dia = getVitalStatus("blood_pressure_dia", v.blood_pressure_dia!)
              if (sys === "high" || dia === "high") return "high"
              if (sys === "low" || dia === "low") return "low"
              return "normal"
            })()}
          />
        )}
        {v.heart_rate && (
          <VitalCard
            title={t("vitals.heartRateLabel")}
            value={v.heart_rate}
            unit="bpm"
            icon={<Activity size={18} />}
            status={getVitalStatus("heart_rate", v.heart_rate)}
          />
        )}
        {v.temperature && (
          <VitalCard
            title={t("vitals.temperatureLabel")}
            value={v.temperature}
            unit="°C"
            icon={<Thermometer size={18} />}
            status={getVitalStatus("temperature", v.temperature)}
          />
        )}
        {v.spo2 && (
          <VitalCard
            title={t("vitals.spo2")}
            value={v.spo2}
            unit="%"
            icon={<Droplet size={18} />}
            status={getVitalStatus("spo2", v.spo2)}
          />
        )}
        {v.respiratory_rate && (
          <VitalCard
            title={t("vitals.respiratoryRateLabel")}
            value={v.respiratory_rate}
            unit={t("vitals.breathsPerMin")}
            icon={<Wind size={18} />}
            status={getVitalStatus("respiratory_rate", v.respiratory_rate)}
          />
        )}
        {v.weight_kg && (
          <VitalCard
            title={t("vitals.weightLabel")}
            value={v.weight_kg}
            unit="kg"
            icon={<Scale size={18} />}
            status={getVitalStatus("weight_kg", v.weight_kg)}
          />
        )}
        {v.height_cm && (
          <VitalCard
            title={t("vitals.height")}
            value={v.height_cm}
            unit="cm"
            icon={<Ruler size={18} />}
            status={getVitalStatus("height_cm", v.height_cm)}
          />
        )}
        {v.bmi && (
          <VitalCard
            title={t("vitals.bmi")}
            value={Number(v.bmi).toFixed(1)}
            unit="kg/m²"
            icon={<Divide size={18} />}
            status={getVitalStatus("bmi", v.bmi)}
          />
        )}
      </div>
      {v.notes && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm text-slate-600 dark:text-slate-400 break-words">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {t("common.notes")}:{" "}
          </span>
          {v.notes}
        </div>
      )}
    </div>
  )
}

function VitalsDisplay({ visitId }: { visitId: number }) {
  const { t } = useTranslation()
  const { data: vitals = [], isLoading } = useVisitVitals(visitId);

  if (isLoading)
    return (
      <div className="p-4 text-center text-sm text-slate-500 animate-pulse">
        {t("vitals.loadingVitals")}
      </div>
    )
  if (!vitals || vitals.length === 0)
    return (
      <div className="p-4 text-center text-sm text-slate-500">
        {t("vitals.noVitalSignsForVisit")}
      </div>
    )

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4 space-y-4"
    >
      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
        <Activity size={16} className="text-indigo-500" />
        {t("vitals.recordedVitalSigns")}
        <span className="text-xs font-normal text-slate-400">({vitals.length})</span>
      </h4>
      {vitals.map((v, idx) => (
        <div key={v.vital_id}>
          {idx > 0 && (
            <div className="mb-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
              {v.recorded_at && (
                <p className="text-xs text-slate-400 mb-3">
                  {t("vitals.recordedAt")}: {formatDate(v.recorded_at)} {formatTime(v.recorded_at)}
                </p>
              )}
            </div>
          )}
          <VitalsRow v={v} />
        </div>
      ))}
    </motion.div>
  )
}

function VisitCard({ visit }: { visit: ClinicVisitRpcItem }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="glass-card p-5 mb-4 hover:shadow-md transition-shadow">
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4 min-w-0">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl shrink-0">
            <Calendar size={24} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="whitespace-nowrap">{formatDate(visit.visit_date)}</span>
              <span className="text-sm font-normal text-slate-500 whitespace-nowrap">
                {t("vitals.atTime", { time: formatTime(visit.visit_date) })}
              </span>
            </h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-[300px]">
                <UserIcon size={14} className="shrink-0" /> {t("common.doctorPrefix")}{" "}
                {visit.doctor_name || visit.doctor_id}
              </span>
              <span className="flex items-center gap-1 truncate max-w-[200px] sm:max-w-[300px]">
                <FileText size={14} className="shrink-0" /> {visit.reason_for_visit}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="text-sm font-medium text-indigo-500 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
            {expanded ? (
              <>
                <ChevronUp size={16} /> {t("vitals.hideVitals")}
              </>
            ) : (
              <>
                <ChevronDown size={16} /> {t("vitals.showVitals")}
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && <VitalsDisplay visitId={visit.visit_id} />}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function FormDiagnosisSelect({ patientsData }: { patientsData: any }) {
  const { t } = useTranslation()
  const { input } = useField("p_patient_id")
  const patientId = input.value

  const patientName =
    patientsData?.data?.find(
      (p: any) => String(p.patient_id) === String(patientId),
    )?.full_name || ""

  const { data: diagnosesData } = useQuery({
    queryKey: ["diagnoses-list", patientName],
    queryFn: () => diagnosisService.getByPatientName(patientName),
    enabled: !!patientName,
  })

  const diagnosisOptions =
    diagnosesData?.map((d) => ({
      value: String(d.diagnosis_id),
      label: `${d.cancer_name || t("vitals.unknownCancer")} (${formatDate(
        d.diagnosis_date,
      )})`,
    })) || []

  return (
    <FormSelectField
      options={diagnosisOptions || []}
      name="p_diagnosis_id"
      label={t("vitals.relatedDiagnosisOptional")}
      required
    />
  )
}

export default function VitalsPage() {
  const { t } = useTranslation()
  const combinedVisitSchema = z.object({
    p_patient_id: z.string().min(1, t("vitals.validation.patientRequired") ?? "Patient is required"),
    p_doctor_id: z.string().min(1, t("visits.validation.doctorRequired") ?? "Doctor is required"),
    p_diagnosis_id: z.string().optional(),
    p_visit_date: z.string().min(1, t("visits.validation.visitDateTimeRequired") ?? "Visit date is required"),
    p_visit_type: z
      .enum(["Routine", "Follow-up", "Emergency", "Post-treatment"])
      .default("Routine"),
    p_reason_for_visit: z.string().min(1, t("visits.validation.reasonRequired") ?? "Reason is required"),
    p_clinical_notes: z.string().optional(),
    p_recommendations: z.string().optional(),
    p_next_visit_date: z.string().optional(),

    include_vitals: z.boolean().default(false),
    p_temperature: z.coerce.number().optional().or(z.literal("")),
    p_blood_pressure_sys: z.coerce.number().optional().or(z.literal("")),
    p_blood_pressure_dia: z.coerce.number().optional().or(z.literal("")),
    p_heart_rate: z.coerce.number().optional().or(z.literal("")),
    p_respiratory_rate: z.coerce.number().optional().or(z.literal("")),
    p_spo2: z.coerce.number().optional().or(z.literal("")),
    p_weight_kg: z.coerce.number().optional().or(z.literal("")),
    p_height_cm: z.coerce.number().optional().or(z.literal("")),
    p_vital_notes: z.string().optional(),
  })
  const qc = useQueryClient()
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null,
  )
  const [showForm, setShowForm] = useState(false)

  // Fetch Options
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["patients-list"],
    queryFn: () => patientService.getAll({ page: 1, pageSize: 100 }),
  })

  const { data: doctorsData } = useQuery({
    queryKey: ["doctors-list"],
    queryFn: () => doctorService.getAll(),
  })

  // Fetch Visits for Selected Patient
  const { data: visits, isLoading: isLoadingVisits } = useQuery({
    queryKey: ["clinic-visits", selectedPatientId],
    queryFn: () => visitService.listVisitsByPatient(selectedPatientId || NaN),
    enabled: !!selectedPatientId,
  })

  // Mutations
  const createMut = useMutation({
    mutationFn: async (d: CombinedVisitForm) => {
      if (d.include_vitals) {
        return visitService.createVisitWithVitals({
          p_patient_id: Number(d.p_patient_id),
          p_doctor_id: Number(d.p_doctor_id),
          p_diagnosis_id: d.p_diagnosis_id ? Number(d.p_diagnosis_id) : null,
          p_visit_date: d.p_visit_date,
          p_visit_type: d.p_visit_type || undefined,
          p_reason_for_visit: d.p_reason_for_visit,
          p_clinical_notes: d.p_clinical_notes || undefined,
          p_recommendations: d.p_recommendations || undefined,
          p_next_visit_date: d.p_next_visit_date || undefined,
          p_temperature: d.p_temperature ? Number(d.p_temperature) : null,
          p_blood_pressure_sys: d.p_blood_pressure_sys
            ? Number(d.p_blood_pressure_sys)
            : null,
          p_blood_pressure_dia: d.p_blood_pressure_dia
            ? Number(d.p_blood_pressure_dia)
            : null,
          p_heart_rate: d.p_heart_rate ? Number(d.p_heart_rate) : null,
          p_respiratory_rate: d.p_respiratory_rate
            ? Number(d.p_respiratory_rate)
            : null,
          p_spo2: d.p_spo2 ? Number(d.p_spo2) : null,
          p_weight_kg: d.p_weight_kg ? Number(d.p_weight_kg) : null,
          p_height_cm: d.p_height_cm ? Number(d.p_height_cm) : null,
          p_vital_notes: d.p_vital_notes || null,
        })
      } else {
        return visitService.createVisit({
          p_patient_id: Number(d.p_patient_id),
          p_doctor_id: Number(d.p_doctor_id),
          p_diagnosis_id: d.p_diagnosis_id ? Number(d.p_diagnosis_id) : null,
          p_visit_date: d.p_visit_date,
          p_visit_type: d.p_visit_type || undefined,
          p_reason_for_visit: d.p_reason_for_visit,
          p_clinical_notes: d.p_clinical_notes || undefined,
          p_recommendations: d.p_recommendations || undefined,
          p_next_visit_date: d.p_next_visit_date || undefined,
        })
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clinic-visits",selectedPatientId] })
      toast.success(t("vitals.visitScheduledSuccess"))
      setShowForm(false)
    },
    onError: (err: any) =>
      toast.error(err.message || t("vitals.scheduleVisitFailed")),
  })

  const filterPatientOptions =
    patientsData?.data.map((p) => ({
      value: String(p.patient_id),
      label: p.full_name,
    })) || []
  const formPatientOptions =
    patientsData?.data.map((p) => ({
      value: String(p.patient_id),
      label: p.full_name,
    })) || []
  const doctorOptions =
    doctorsData?.map((d) => ({
      value: String(d.doctor_id),
      label: d.full_name,
    })) || []

  const defaultPatientIdFormValue =
    patientsData?.data.find(
      (p) => String(p.patient_id) === String(selectedPatientId),
    )?.patient_id ?? ""

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t("vitals.clinicVisitsAndVitals")}
          </h1>
          <p className="text-sm text-slate-500">
            {t("vitals.manageVisitsAndTrackVitals")}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5"
        >
          <Plus size={16} /> {t("visits.scheduleVisit")}
        </button>
      </div>

      <div className="glass-card p-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {t("vitals.selectPatient")}
        </label>
        {isLoadingPatients ? (
          <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse w-full max-w-md"></div>
        ) : (
          <select
            value={selectedPatientId || ""}
            onChange={(e) => setSelectedPatientId(Number(e.target.value))}
            className="input-field max-w-md"
          >
            <option value="">{t("vitals.choosePatientOption")}</option>
            {filterPatientOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {!selectedPatientId ? (
        <div className="text-center py-12 glass-card">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <UserIcon size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
            {t("vitals.noPatientSelected")}
          </h3>
          <p className="text-slate-500">
            {t("vitals.selectPatientToViewVisits")}
          </p>
        </div>
      ) : isLoadingVisits ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="glass-card p-5 h-24 animate-pulse bg-slate-100/50 dark:bg-slate-800/50"
            ></div>
          ))}
        </div>
      ) : visits && visits.length > 0 ? (
        <div className="space-y-4">
          {visits.map((visit) => (
            <VisitCard key={visit.visit_id} visit={visit} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 glass-card border-dashed">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">
            {t("vitals.noVisitsFound")}
          </h3>
          <p className="text-slate-500">{t("vitals.noRecordedClinicVisits")}</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-indigo-500 font-medium hover:underline"
          >
            {t("vitals.scheduleFirstVisit")}
          </button>
        </div>
      )}

      {/* ── Create Visit Modal ── */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={t("visits.scheduleTitle")}
        size="xl"
      >
        <AppForm<CombinedVisitForm>
          initialValues={{
            ...DEFAULT_FORM_VALUES,
            p_patient_id: String(defaultPatientIdFormValue),
          }}
          validate={zodValidator(combinedVisitSchema)}
          onSubmit={(d) => createMut.mutate(d)}
          className="space-y-6"
        >
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" />{" "}
              {t("vitals.visitDetails")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelectField
                options={formPatientOptions || []}
                name="patient_id"
                label={t("diagnoses.patient")}
                placeholder={t("vitals.selectPatientPlaceholder")}
                required
              />
              <FormSelectField
                options={doctorOptions || []}
                name="p_doctor_id"
                label={t("diagnoses.doctor")}
                required
              />
              <FormField
                name="p_visit_date"
                label={t("visits.dateTime")}
                type="date"
                required
              />
              <FormField
                name="p_visit_type"
                label={t("visits.visitType")}
                type="select"
                required
                options={[
                  { value: "Routine", label: t("visits.routine") },
                  { value: "Follow-up", label: t("visits.followUp") },
                  { value: "Emergency", label: t("visits.emergency") },
                  { value: "Post-treatment", label: t("visits.postTreatment") },
                ]}
              />

              <FormDiagnosisSelect patientsData={patientsData} />
            </div>
            <FormField
              name="p_reason_for_visit"
              label={t("visits.reasonForVisit")}
              type="textarea"
              required
            />
            <FormField
              name="p_clinical_notes"
              label={t("visits.consultationNotes")}
              type="textarea"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                name="p_recommendations"
                label={t("visits.recommendations")}
                type="textarea"
              />
              <FormField
                name="p_next_visit_date"
                label={t("visits.nextVisitDate")}
                type="date"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={createMut.isPending}
              className="gradient-btn px-6 py-2.5 text-sm"
            >
              {createMut.isPending
                ? t("vitals.scheduling")
                : t("visits.scheduleVisit")}
            </button>
          </div>
        </AppForm>
      </Modal>
    </motion.div>
  )
}
