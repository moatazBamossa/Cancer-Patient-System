import React, { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  User,
  Stethoscope,
  FileBarChart,
  Activity,
  Pill,
  FlaskConical,
  ImageIcon,
  Calendar,
  Phone,
  Printer,
  AlertCircle,
} from "lucide-react"
import { patientService } from "../../services/patient.service"
import { Modal } from "../../components/ui/Modal"
import { AppForm } from "../../components/ui/AppForm"
import { FormField } from "../../components/ui/FormField"
import { zodValidator } from "../../lib/zodValidator"
import { z } from "zod"
import {
  useEmergencyContactsByPatientQuery,
  useCreateEmergencyContactMutation,
  useUpdateEmergencyContactMutation,
  useDeleteEmergencyContactMutation,
} from "../../modules/emergency-contacts/hooks/emergency-contact.hooks"
import type { EmergencyContact } from "../../modules/emergency-contacts/types"
import { StatusBadge } from "../../components/ui/StatusBadge"
import { PageSkeleton } from "../../components/ui/Skeleton"
import { formatDate, formatDateTime, getBMICategory } from "../../lib/utils"
import { useTranslation } from "react-i18next"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { ConfirmDialog } from "../../components/ui/ConfirmDialog"
import DiagnosisDoctorHistoryPanel from "../diagnoses/DiagnosisDoctorHistoryPanel"

export default function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("overview")

  const tabs = [
    { id: "overview", label: t("patientDetails.overview"), icon: User },
    {
      id: "diagnoses",
      label: t("patientDetails.diagnoses"),
      icon: Stethoscope,
    },
    {
      id: "treatment",
      label: t("patientDetails.treatment"),
      icon: FileBarChart,
    },
    { id: "vitals", label: t("patientDetails.vitals"), icon: Activity },
    { id: "medications", label: t("patientDetails.medications"), icon: Pill },
    { id: "lab", label: t("patientDetails.labResults"), icon: FlaskConical },
    { id: "imaging", label: t("patientDetails.imaging"), icon: ImageIcon },
    { id: "visits", label: t("patientDetails.visits"), icon: Calendar },
    { id: "contacts", label: t("patientDetails.contacts"), icon: Phone },
  ]

  const categoryStatusMap: Record<string, string> = {
    Chemotherapy: t("medications.chemotherapy"),
    chemo: t("medications.chemotherapy"),
    Hormonal: t("medications.hormonal"),
    hormonal: t("medications.hormonal"),
    Supportive: t("medications.supportive"),
    supportive: t("medications.supportive"),
    Targeted: t("medications.targeted"),
    targeted: t("medications.targeted"),
    Immunotherapy: t("medications.immunotherapy"),
    immunotherapy: t("medications.immunotherapy"),
    radiation_therapy: t("medications.radiation_therapy"),
  }

   const visitTypeLabels: Record<string, string> = {
    new_visit: t("visits.newVisit"),
    follow_up: t("visits.visitTypeLabels.followUp"),
    emergency: t("visits.visitTypeLabels.emergency"),
    treatment_session: t("visits.treatmentSession"),
    consultation: t("visits.visitTypeLabels.consultation"),
    Routine: t("visits.visitTypeLabels.routine"),
  }


  const patientIdNum = id ? Number(id) : undefined

  const { data: emergencyContacts = [], isLoading: contactsLoading, refetch } =
    useEmergencyContactsByPatientQuery(patientIdNum)

  const createContactMutation = useCreateEmergencyContactMutation()
  const updateContactMutation = useUpdateEmergencyContactMutation()
  const deleteContactMutation = useDeleteEmergencyContactMutation()

  const [showContactModal, setShowContactModal] = useState(false)
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(
    null,
  )
  const [deleteContactId, setDeleteContactId] = useState<number | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient-details", id],
    queryFn: () => patientService.getPatientDetails(Number(id)),
    enabled: !!id && !isNaN(Number(id)),
  })

  if (isLoading) return <PageSkeleton />
  if (!patient) return <div>{t("patients.notFoundPage")}</div>

  const diagnoses = patient?.diagnoses || []
  const plans = patient?.treatment_plans || []
  const vitals = patient?.vitals || []
  const labResults = patient?.lab_results || []
  const imaging = patient?.imaging_reports || []
  const visits = patient?.visits || []
  const contacts = patient?.contacts || []


  const contactSchema = z.object({
    full_name: z.string().min(1, t("patientDetails.validation.nameRequired")),
    relationship: z.string().min(1, t("patientDetails.validation.relationshipRequired")),
    phone: z.string().optional(),
    alt_phone: z.string().optional(),
    notes: z.string().optional(),
  })

  const age = patient?.birth_date
    ? Math.floor(
        (Date.now() - new Date(patient.birth_date).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      )
    : t("common.unknown")

  // Calculate active cycles from all plans
  let activeCycles = 0
  plans.forEach((p) => {
    p.cycles?.forEach((c) => {
      if (c.status === "scheduled") activeCycles++
    })
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/patients")}
          className="p-2 rounded-lg"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
              style={{ background: "var(--accent-gradient)" }}
            >
              {patient.full_name
                ?.split(" ")
                .map((n) => n.charAt(0))
                .join("")
                .substring(0, 2)}
            </div>
            <div>
              <h1
                className="text-xl font-bold flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                {patient.full_name}
                <StatusBadge status={patient.status as any} />
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {patient.national_id} • {age} {t("patients.years")} •{" "}
                {patient.gender === "male"
                  ? t("patients.male")
                  : t("patients.female")}{" "}
                • {patient.blood_type}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium no-print"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
          }}
        >
          <Printer size={16} /> {t("patients.print")}
        </button>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 no-print">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id ? "text-white" : ""
            }`}
            style={
              activeTab === tab.id
                ? { background: "var(--accent-gradient)" }
                : {
                    background: "var(--bg-tertiary)",
                    color: "var(--text-secondary)",
                  }
            }
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-5 space-y-3">
              <h3
                className="font-semibold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {t("patientDetails.personalInfo")}
              </h3>
              {[
                [t("patients.phone"), patient.phone],
                [t("patients.email"), patient.email],
                [t("patients.address"), patient.address],
                [
                  t("patients.dob"),
                  patient.birth_date ? formatDate(patient.birth_date) : "-",
                ],
                [t("patients.bloodType"), patient.blood_type],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span
                    className="font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <div className="glass-card p-5 space-y-3">
              <h3
                className="font-semibold text-sm"
                style={{ color: "var(--text-primary)" }}
              >
                {t("patientDetails.summary")}
              </h3>
              {[
                [t("patientDetails.diagnoses"), diagnoses.length],
                [t("common.treatmentPlans"), plans.length],
                [t("patientDetails.activeCycles"), activeCycles],
                [t("patientDetails.labResults"), labResults.length],
                [t("patientDetails.imagingReports"), imaging.length],
                [t("patientDetails.clinicVisits"), visits.length],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="flex justify-between text-sm"
                >
                  <span style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span
                    className="font-bold"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "diagnoses" && (
          <div className="space-y-3">
            {diagnoses.length === 0 && (
              <EmptyState message={t("patientDetails.noDiagnoses")} />
            )}
            {diagnoses.map((d) => (
              <div key={d.diagnosis_id} className="glass-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ background: d.cancer_color || "#ccc" }}
                      />
                      <h4
                        className="font-semibold text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {d.cancer_name}
                      </h4>
                      <StatusBadge status={d.status as any} />
                    </div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {d.diagnosis_date ? formatDate(d.diagnosis_date) : ""} •
                      Dr. {d.doctor_name}
                    </p>
                  </div>
                </div>
                <p
                  className="text-sm mt-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {d.notes}
                </p>
                <div className="mt-3">
                  <DiagnosisDoctorHistoryPanel diagnosisId={d.diagnosis_id} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "treatment" && (
          <div className="space-y-3">
            {plans.length === 0 && (
              <EmptyState message={t("patientDetails.noTreatment")} />
            )}
            {plans.map((tp) => (
              <div key={tp.plan_id} className="glass-card p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4
                      className="font-semibold text-sm"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {tp.protocol_name}
                    </h4>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {tp.start_date ? formatDate(tp.start_date) : ""}
                      {tp.end_date
                        ? ` — ${formatDate(tp.end_date)}`
                        : ` — ${t("treatment.ongoing")}`}
                    </p>
                  </div>
                  <StatusBadge status={tp.status as any} />
                </div>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {tp.notes}
                </p>
                <div
                  className="mt-3 pt-3 border-t"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <p
                    className="text-xs font-semibold mb-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {t("treatment.cycles")}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {tp.cycles?.map((c) => (
                      <div
                        key={c.cycle_id}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{
                          background: "var(--bg-tertiary)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {t("treatment.cycle")} {c.cycle_number} •{" "}
                        <StatusBadge status={c.status as any} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "vitals" && (
          <div className="space-y-4">
            {vitals.length > 0 && (
              <div className="glass-card p-5">
                <h3
                  className="font-semibold text-sm mb-4"
                  style={{ color: "var(--text-primary)" }}
                >
                  {t("patientDetails.vitalsTrend")}
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={vitals.map((v) => ({
                      date: v.recorded_at ? formatDate(v.recorded_at) : "",
                      Temp: v.temperature,
                      Weight: v.weight_kg,
                      HR: v.heart_rate,
                      SpO2: v.spo2,
                    }))}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--border-color)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    />
                    <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "10px",
                        color: "var(--text-primary)",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Temp"
                      name={t("vitals.temp")}
                      stroke="#ef4444"
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Weight"
                      name={t("vitals.weightLabel")}
                      stroke="#6366f1"
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="HR"
                      name={t("vitals.hr")}
                      stroke="#14b8a6"
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-2">
              {vitals.length === 0 && (
                <EmptyState message={t("patientDetails.noVitals")} />
              )}
              {vitals.map((v) => {
                const bmiCat = getBMICategory(v.bmi || 0)
                const isHighTemp = (v.temperature || 0) > 37.5
                const isHighBP =
                  (v.blood_pressure_sys || 0) > 140 ||
                  (v.blood_pressure_dia || 0) > 90
                return (
                  <div key={v.vital_id} className="glass-card p-4">
                    <p
                      className="text-xs font-medium mb-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {v.recorded_at ? formatDateTime(v.recorded_at) : ""}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {t("vitals.temp")}
                        </span>
                        <p
                          className={`font-semibold ${isHighTemp ? "text-red-500" : ""}`}
                          style={
                            !isHighTemp ? { color: "var(--text-primary)" } : {}
                          }
                        >
                          {v.temperature}°C
                        </p>
                      </div>
                      <div>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {t("vitals.bp")}
                        </span>
                        <p
                          className={`font-semibold ${isHighBP ? "text-red-500" : ""}`}
                          style={
                            !isHighBP ? { color: "var(--text-primary)" } : {}
                          }
                        >
                          {v.blood_pressure_sys}/{v.blood_pressure_dia}
                        </p>
                      </div>
                      <div>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {t("vitals.hr")}
                        </span>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {v.heart_rate}
                        </p>
                      </div>
                      <div>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {t("vitals.spo2")}
                        </span>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {v.spo2}%
                        </p>
                      </div>
                      <div>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {t("vitals.weightLabel")}
                        </span>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {v.weight_kg} kg
                        </p>
                      </div>
                      <div>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {t("vitals.bmi")}
                        </span>
                        <p className={`font-semibold ${bmiCat.color}`}>
                          {Number(v?.bmi?.toFixed(2))} ({bmiCat.label})
                        </p>
                      </div>
                      <div>
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {t("vitals.rr")}
                        </span>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {v.respiratory_rate}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === "medications" && (
          <div className="space-y-3">
            {plans.every((p) => !p.cycles || p.cycles.length === 0) && (
              <EmptyState message={t("patientDetails.noMedications")} />
            )}
            {plans.map((plan) => (
              <React.Fragment key={plan.plan_id}>
                {plan.cycles?.map((cycle) => {
                  if (!cycle.medications || cycle.medications.length === 0)
                    return null
                  return (
                    <div key={cycle.cycle_id} className="glass-card p-5">
                      <h4
                        className="font-semibold text-sm mb-3"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {t("treatment.treatmentCycle")} {cycle.cycle_number}
                      </h4>
                      <div className="space-y-2">
                        {cycle.medications.map((med, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg"
                            style={{ background: "var(--bg-tertiary)" }}
                          >
                            <div>
                              <p
                                className="text-sm font-medium"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {med.name}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {med.dose}
                                {med.dose_unit} • {med.frequency} • {med.route}
                              </p>
                            </div>
                            <StatusBadge
                              status={categoryStatusMap[med.category] ?? t("common.unknown")}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        )}

        {activeTab === "lab" && (
          <div className="space-y-3">
            {labResults.length === 0 && (
              <EmptyState message={t("patientDetails.noLabResults")} />
            )}
            {labResults.map((r) => (
              <div
                key={r.lab_test_patient_id}
                className="glass-card p-4 flex items-center justify-between"
              >
                <div>
                  <h4
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {r.test_name}
                  </h4>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {r.test_date ? formatDate(r.test_date) : ""} • {r.notes}
                  </p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div>
                    <p
                      className={`text-lg font-bold ${r.is_abnormal ? "text-red-500" : ""}`}
                      style={
                        !r.is_abnormal ? { color: "var(--emerald-500)" } : {}
                      }
                    >
                      {r.result_value}{" "}
                      <span
                        className="text-xs font-normal"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {r.units}
                      </span>
                    </p>
                    {r.normal_range != null && (
                      <p
                        className="text-[10px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {t("patientDetails.normal")}: {r.normal_range}
                      </p>
                    )}
                  </div>
                  {r.is_abnormal && (
                    <AlertCircle className="text-red-500" size={16} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "imaging" && (
          <div className="space-y-3">
            {imaging.length === 0 && (
              <EmptyState message={t("patientDetails.noImaging")} />
            )}
            {imaging.map((img) => (
              <div key={img.image_id} className="glass-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      background: "var(--bg-tertiary)",
                      color: "var(--accent-primary)",
                    }}
                  >
                    {img.imaging_type}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {img.body_part} •{" "}
                    {img.imaging_date ? formatDate(img.imaging_date) : ""}
                  </span>
                </div>
                <p
                  className="text-sm mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  <strong>{t("patientDetails.findings")}:</strong>{" "}
                  {img.findings}
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <strong>{t("patientDetails.impression")}:</strong>{" "}
                  {img.impression}
                </p>
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {t("patientDetails.radiologist")}: {img.radiologist_name}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "visits" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {t("patientDetails.visits")}
              </h3>
              <button
                type="button"
                onClick={() => navigate(`/patients/${id}/visits`)}
                className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
              >
        {t("patientDetails.viewAllVisits")}
              </button>
            </div>
            {visits.length === 0 && (
              <EmptyState message={t("patientDetails.noVisits")} />
            )}
            {visits.map((v) => (
              <div key={v.visit_id} className="glass-card p-4">
                <div className="flex justify-between mb-1">
                  <span
                    className="text-xs font-semibold uppercase"
                    style={{ color: "var(--accent-primary)" }}
                  >
                    {visitTypeLabels[v?.visit_type|| ''] || v.visit_type?.replace("_", " ")}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {v.visit_date ? formatDateTime(v.visit_date) : ""}
                  </span>
                </div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {v.reason_for_visit}
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {v.clinical_notes}
                </p>
                <p
                  className="text-xs mt-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  Dr. {v.doctor_name}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {t("patientDetails.contacts")}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingContact(null)
                    setShowContactModal(true)
                  }}
                  className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm"
                >
                  {t("patientDetails.addContact")}
                </button>
              </div>
            </div>

            {contactsLoading && (
              <div className="text-sm text-slate-400">
                {t("patientDetails.loadingContacts")}
              </div>
            )}

            {!contactsLoading && emergencyContacts.length === 0 && (
              <EmptyState message={t("patientDetails.noContacts")} />
            )}

            {emergencyContacts.map((c) => (
              <div
                key={c.contact_id}
                className="glass-card p-4 flex items-center justify-between"
              >
                <div>
                  <h4
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {c.full_name}
                  </h4>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {c.relationship}
                  </p>
                  {c.notes && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {c.notes}
                    </p>
                  )}
                </div>
                <div className="text-right flex items-center gap-2">
                  <div
                    className="text-sm mr-4"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {c.phone}
                  </div>
                  <button
                    onClick={() => {
                      setEditingContact(c)
                      setShowContactModal(true)
                    }}
                    className="text-sm px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200"
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    onClick={() => {
                      setDeleteContactId(c.contact_id)
                      setDeleteConfirmOpen(true)
                    }}
                    className="text-sm px-3 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600"
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </div>
            ))}

            <Modal
              isOpen={showContactModal}
              onClose={() => setShowContactModal(false)}
              title={
                editingContact
                  ? t("patientDetails.editContact")
                  : t("patientDetails.addContact")
              }
              size="md"
            >
              <AppForm
                initialValues={{
                  full_name: editingContact?.full_name ?? "",
                  relationship: editingContact?.relationship ?? "",
                  phone: editingContact?.phone ?? "",
                  alt_phone: editingContact?.alt_phone ?? "",
                  notes: editingContact?.notes ?? "",
                }}
                validate={zodValidator(contactSchema)}
                onSubmit={async (values: any, form: any) => {
                  if (editingContact) {
                    await updateContactMutation.mutateAsync({
                      contact_id: editingContact.contact_id,
                      full_name: values.full_name,
                      relationship: values.relationship,
                      phone: values.phone,
                      alt_phone: values.alt_phone ?? null,
                      notes: values.notes ?? null,
                    })
                    setShowContactModal(false)
                    setEditingContact(null)
                    form.restart()
                    refetch()
                    return
                  }
                  if (!!patientIdNum)
                    await createContactMutation.mutateAsync({
                      patient_id: patientIdNum,
                      full_name: values.full_name,
                      relationship: values.relationship,
                      phone: values.phone,
                      alt_phone: values.alt_phone ?? null,
                      notes: values.notes ?? null,
                    })
                  setShowContactModal(false)
                  form.restart()
                }}
                className="space-y-4"
              >
                <FormField
                  name="full_name"
                  label={t("patientDetails.fullName")}
                  required
                />
                <FormField
                  name="relationship"
                  label={t("patientDetails.relationship")}
                  required
                />
                <FormField name="phone" label={t("patientDetails.phone")} />
                <FormField
                  name="alt_phone"
                  label={t("patientDetails.altPhone")}
                />
                <FormField name="notes" label={t("patientDetails.notes")} />
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="gradient-btn px-6 py-2.5 text-sm"
                  >
                    {editingContact ? t("common.update") : t("common.create")}
                  </button>
                </div>
              </AppForm>
            </Modal>

            <ConfirmDialog
              isOpen={deleteConfirmOpen}
              onClose={() => setDeleteConfirmOpen(false)}
              onConfirm={async () => {
                if (!deleteContactId) return
                await deleteContactMutation.mutateAsync(deleteContactId)
                setDeleteContactId(null)
                setDeleteConfirmOpen(false)
              }}
              title={t("patientDetails.deleteContactTitle")}
              message={t("patientDetails.deleteContactMessage")}
              confirmText={t("common.delete")}
              cancelText={t("common.cancel")}
              variant="danger"
            />
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass-card p-12 text-center">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {message}
      </p>
    </div>
  )
}
