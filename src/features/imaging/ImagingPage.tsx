import React, { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, ImageIcon, FileText, Search, Edit3, Trash2 } from "lucide-react"
import { z } from "zod"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import {
  useCreateImagingReportMutation,
  useDeleteImagingReportMutation,
  useImagingReports,
  useUpdateImagingReportMutation,
} from "../../hooks/useImagingReports"
import { patientService } from "../../services/patient.service"
import { doctorService } from "../../services/doctor.service"
import { diagnosisService } from "../../services/diagnosis.service"
import { DataTable, type Column } from "../../components/ui/DataTable"
import { Modal } from "../../components/ui/Modal"
import { ConfirmDialog } from "../../components/ui/ConfirmDialog"
import { Form } from "react-final-form"
import { FormField, FormSelectField } from "../../components/ui/FormField"
import { zodValidator } from "../../lib/zodValidator"
import { formatDate } from "../../lib/utils"
import { useModulePermissions } from "../../modules/roles/permissions"
import type { ImagingReport } from "../../types"

type ImagingForm = {
  patient_id: string;
  diagnosis_id?: string;
  imaging_type: "CT" | "MRI" | "PET" | "X-Ray" | "Ultrasound";
  body_part: string;
  imaging_date: string;
  findings: string;
  impression: string;
  ordered_by: string;
  report_text: string;
}

export default function ImagingPage() {
  const { t } = useTranslation()
  const imagingSchema = z.object({
    patient_id: z.string().min(1, t("imaging.validation.patientRequired")),
    diagnosis_id: z.string().optional(),
    imaging_type: z.enum(["CT", "MRI", "PET", "X-Ray", "Ultrasound"]),
    body_part: z.string().min(1, t("imaging.validation.bodyPartRequired")),
    imaging_date: z.string().min(1, t("imaging.validation.dateRequired")),
    findings: z.string().min(1, t("imaging.validation.findingsRequired")),
    impression: z.string().min(1, t("imaging.validation.impressionRequired")),
    ordered_by: z.string().min(1, t("imaging.validation.orderedByRequired")),
    report_text: z.string().optional().default(""),
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [patientFilter, setPatientFilter] = useState("")
  const [doctorFilter, setDoctorFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeReport, setActiveReport] = useState<ImagingReport | null>(null)
  const [selectedReport, setSelectedReport] = useState<ImagingReport | null>(
    null,
  )
  const [reportToDelete, setReportToDelete] = useState<ImagingReport | null>(
    null,
  )
  const [formKey, setFormKey] = useState(0)

  const { canCreate, canUpdate, canDelete } =
    useModulePermissions("imaging_reports")

  const { data: patientsResponse } = useQuery({
    queryKey: ["patients", "imaging-dropdowns"],
    queryFn: async () => {
      const response = await patientService.getAll({ page: 1, pageSize: 500 })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors", "imaging-dropdowns"],
    queryFn: async () => doctorService.getAll(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: diagnoses = [] } = useQuery({
    queryKey: ["diagnoses", "imaging-dropdowns"],
    queryFn: async () => {
      const response = await diagnosisService.getAll({ page: 1, pageSize: 500 })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const imagingQuery = useImagingReports({
    p_patient_id: patientFilter || null,
    p_doctors_id: doctorFilter || null,
    p_imaging_type: typeFilter || null,
    p_from_date: fromDate || null,
    p_to_date: toDate || null,
    p_search: searchTerm || null,
  })

  const createMutation = useCreateImagingReportMutation()
  const updateMutation = useUpdateImagingReportMutation()
  const deleteMutation = useDeleteImagingReportMutation()

  const imagingInitialValues: ImagingForm = {
    patient_id: "",
    diagnosis_id: "",
    imaging_type: "CT",
    body_part: "",
    imaging_date: "",
    findings: "",
    impression: "",
    ordered_by: "",
    report_text: "",
  }

  const reports = imagingQuery.data ?? []
  const filteredReports = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase()
    return reports.filter((report) => {
      if (!lowerSearch) return true
      const patientName =
        report.patient_name ??
        patientsResponse?.find((p) => p.patient_id === report.patient_id)
          ?.full_name ??
        ""
      const doctorName =
        report.radiologist_name ??
        doctors.find((d) => d.doctor_id === report.ordered_by)?.full_name ??
        ""
      return [
        patientName,
        doctorName,
        report.imaging_type,
        report.body_part,
        report.findings,
        report.impression,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(lowerSearch))
    })
  }, [reports, searchTerm, patientsResponse, doctors])

  const openCreateForm = () => {
    setActiveReport(null)
    setFormKey((prev) => prev + 1)
    setShowForm(true)
  }

  const openEditForm = (report: ImagingReport) => {
    setActiveReport(report)
    setFormKey((prev) => prev + 1)
    setShowForm(true)
  }

  const handleSubmit = (values: ImagingForm) => {
    const payload = {
      p_patient_id: values.patient_id,
      p_diagnosis_id: values.diagnosis_id || null,
      p_doctors_id: values.ordered_by,
      p_imaging_type: values.imaging_type,
      p_body_part: values.body_part,
      p_report_text: values.report_text || null,
      p_findings: values.findings,
      p_impression: values.impression,
      p_imaging_date: values.imaging_date,
    }

    if (activeReport) {
      updateMutation.mutate(
        { p_image_id: activeReport.image_id, ...payload },
        {
          onSuccess: () => {
            setShowForm(false)
          },
        },
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setShowForm(false)
        },
      })
    }
  }

  const confirmDelete = (report: ImagingReport) => {
    setSelectedReport(null)
    setReportToDelete(report)
    setShowDeleteConfirm(true)
  }

  const handleDelete = () => {
    if (!reportToDelete) return
    deleteMutation.mutate(reportToDelete.image_id, {
      onSuccess: () => {
        setShowDeleteConfirm(false)
        setReportToDelete(null)
      },
    })
  }

  const columns: Column<ImagingReport>[] = [
    {
      key: "imaging_date",
      header: t("common.date"),
      render: (value) => formatDate(String(value)),
    },
    {
      key: "patient_id",
      header: t("diagnoses.patient"),
      render: (_value, row) => {
        const patientName =
          row.patient_name ??
          patientsResponse?.find((p) => p.patient_id === row.patient_id)
            ?.full_name
        return (
          <span className="font-medium text-emerald-500">
            {patientName || t("common.unknown")}
          </span>
        )
      },
    },
    {
      key: "ordered_by",
      header: t("imaging.radiologist"),
      render: (_value, row) => {
        const doctorName =
          row.radiologist_name ??
          doctors.find((d) => d.doctor_id === row.ordered_by)?.full_name
        return <span>{doctorName || t("common.unknown")}</span>
      },
    },
    {
      key: "imaging_type",
      header: t("imaging.modality"),
      render: (value) => (
        <span className="uppercase font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
          {t(`imaging.types.${String(value)}`, String(value))}
        </span>
      ),
    },
    { key: "body_part", header: t("imaging.bodyPart") },
    {
      key: "impression",
      header: t("imaging.impression"),
      render: (value) => (
        <span className="truncate max-w-[240px] block">{String(value)}</span>
      ),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("imaging.title")}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("imaging.subtitle")}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreateForm}
            className="gradient-btn px-4 py-2 text-sm flex items-center gap-2"
          >
            <Plus size={16} /> {t("imaging.newReport")}
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder={t("imaging.searchPlaceholder")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="input-field pl-10"
          />
        </div>

        <select
          value={patientFilter}
          onChange={(event) => setPatientFilter(event.target.value)}
          className="input-field"
        >
          <option value="">{t("common.patient")}</option>
          {patientsResponse?.map((patient) => (
            <option key={patient.patient_id} value={patient.patient_id}>
              {patient.full_name}
            </option>
          ))}
        </select>

        <select
          value={doctorFilter}
          onChange={(event) => setDoctorFilter(event.target.value)}
          className="input-field"
        >
          <option value="">{t("imaging.radiologist")}</option>
          {doctors.map((doctor) => (
            <option key={doctor.doctor_id} value={doctor.doctor_id}>
              {doctor.full_name}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="input-field"
        >
          <option value="">{t("imaging.modality")}</option>
          {["CT", "MRI", "PET", "X-Ray", "Ultrasound"].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <input
          type="date"
          value={fromDate}
          onChange={(event) => setFromDate(event.target.value)}
          className="input-field"
          placeholder={t("common.fromDate")}
        />
        <input
          type="date"
          value={toDate}
          onChange={(event) => setToDate(event.target.value)}
          className="input-field"
          placeholder={t("common.toDate")}
        />
      </div>

      <DataTable<ImagingReport>
        columns={columns}
        data={filteredReports}
        isLoading={imagingQuery.isLoading}
        onRowClick={(row) => {
          setSelectedReport(row)
          setShowDeleteConfirm(false)
          setReportToDelete(null)
        }}
        emptyMessage={t("imaging.noReports")}
        actions={(row) => (
          <div className="flex items-center gap-6">
            {canUpdate && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  openEditForm(row)
                }}
                className="text-slate-500 hover:text-indigo-600"
                aria-label={t("common.edit")}
              >
                <Edit3 size={16} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  confirmDelete(row)
                }}
                className="text-rose-500 hover:text-rose-600"
                aria-label={t("common.delete")}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      />

      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title={t("imaging.detailsTitle")}
        size="lg"
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-500/5">
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  {t("diagnoses.patient")}
                </p>
                <p className="font-medium text-indigo-500">
                  {selectedReport.patient_name ??
                    patientsResponse?.find(
                      (p) => p.patient_id === selectedReport.patient_id,
                    )?.full_name ??
                    t("common.unknown")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  {t("common.date")}
                </p>
                <p className="font-medium">
                  {formatDate(selectedReport.imaging_date)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  {t("imaging.modality")}
                </p>
                <p className="font-medium uppercase">
                  {selectedReport.imaging_type}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  {t("imaging.bodyPart")}
                </p>
                <p className="font-medium">{selectedReport.body_part}</p>
              </div>
            </div>

            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold mb-2">
                <FileText size={16} className="text-indigo-500" />
                {t("imaging.findings")}
              </h4>
              <p className="text-sm leading-relaxed p-4 rounded-lg bg-slate-500/5 border border-slate-500/10">
                {selectedReport.findings}
              </p>
            </div>

            <div>
              <h4 className="flex items-center gap-2 text-sm font-bold mb-2">
                <ImageIcon size={16} className="text-indigo-500" />
                {t("imaging.impressionConclusion")}
              </h4>
              <p className="text-sm border-l-4 border-indigo-500 pl-4 py-2 italic font-medium">
                {selectedReport.impression}
              </p>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <p>
                {t("imaging.radiologist")}:{" "}
                {selectedReport.radiologist_name ??
                  doctors.find(
                    (doc) => doc.doctor_id === selectedReport.ordered_by,
                  )?.full_name ??
                  selectedReport.ordered_by}
              </p>
              {selectedReport.diagnosis_id && (
                <p>
                  {t("diagnoses.diagnosisId") ?? "Diagnosis ID"}:{" "}
                  {selectedReport.diagnosis_id}
                </p>
              )}
              <p>
                {t("imaging.reportId")}: {selectedReport.image_id}
              </p>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={activeReport ? t("common.edit") : t("imaging.uploadTitle")}
        size="lg"
      >
        <Form<ImagingForm>
          key={formKey}
          onSubmit={(values) => handleSubmit(values)}
          validate={zodValidator(imagingSchema)}
          initialValues={
            activeReport
              ? {
                  patient_id: activeReport.patient_id,
                  diagnosis_id: activeReport.diagnosis_id ?? "",
                  imaging_type: activeReport.imaging_type,
                  body_part: activeReport.body_part,
                  imaging_date: activeReport.imaging_date,
                  findings: activeReport.findings,
                  impression: activeReport.impression,
                  ordered_by: activeReport.ordered_by,
                  report_text: activeReport.report_text,
                }
              : imagingInitialValues
          }
          render={({ handleSubmit, form, submitting, pristine }) => (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormSelectField
                options={(patientsResponse ?? []).map((patient) => ({
                  value: patient.patient_id,
                  label: patient.full_name,
                }))}
                name="patient_id"
                label={t("diagnoses.patient")}
                required
              />

              <FormSelectField
                name="diagnosis_id"
                label={t("diagnoses.diagnosis")}
                options={[
                  { value: "", label: t("common.none") ?? "None" },
                  ...diagnoses.map((diag) => ({
                    value: diag.diagnosis_id,
                    label: String(diag.cancer_name),
                  })),
                ]}
                placeholder={t("common.optional") as string}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormSelectField
                  name="imaging_type"
                  label={t("imaging.type")}
                  options={["CT", "MRI", "PET", "X-Ray", "Ultrasound"].map(
                    (v) => ({ value: v, label: v }),
                  )}
                  required
                />
                <FormField
                  name="body_part"
                  label={t("imaging.bodyPart")}
                  required
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                  name="imaging_date"
                  label={t("imaging.scanDate")}
                  type="date"
                  required
                />
                <FormSelectField
                  name="ordered_by"
                  label={t("imaging.radiologist")}
                  options={doctors.map((doctor) => ({
                    value: doctor.doctor_id,
                    label: doctor.full_name,
                  }))}
                  required
                />
              </div>
              <FormField
                name="findings"
                label={t("imaging.findings")}
                type="textarea"
                required
              />
              <FormField
                name="impression"
                label={t("imaging.impression")}
                type="textarea"
                required
              />
              <FormField
                name="report_text"
                label={t("imaging.reportSummary") ?? "Report Summary"}
                type="textarea"
              />
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="gradient-btn px-6 py-2.5 text-sm"
                  disabled={submitting || pristine}
                >
                  {activeReport ? t("common.save") : t("imaging.uploadReport")}
                </button>
              </div>
            </form>
          )}
        />
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setReportToDelete(null)
        }}
        onConfirm={handleDelete}
        title={t("common.delete")}
        message={
          t("common.deleteConfirm") ||
          "Confirm deletion of the selected imaging report?"
        }
        confirmText={t("common.confirm")}
        cancelText={t("common.cancel")}
        variant="danger"
      />
    </motion.div>
  )
}
