import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { Plus, FlaskConical, AlertCircle, Edit3, Trash2 } from "lucide-react"
import { ConfirmDialog } from "../../components/ui/ConfirmDialog"
import { z } from "zod"
import { useTranslation } from "react-i18next"
import { DataTable, type Column } from "../../components/ui/DataTable"
import { Modal } from "../../components/ui/Modal"
import { StatusBadge } from "../../components/ui/StatusBadge"
import { formatDate } from "../../lib/utils"
import {
  useLabTests,
  useLabTestPatients,
  useCreateLabTestPatient,
  useUpdateLabTestPatient,
  useDeleteLabTestPatient,
} from "../../hooks/useLabTests"
import { patientService } from "../../services/patient.service"
import { doctorService } from "../../services/doctor.service"
import type { LabTest, LabTestResult, Patient, Doctor } from "../../types"
import { LabTestPatientDto } from "../../services/lab.service"

type LabResultForm = {
  patient_id: string;
  lab_test_id: string;
  test_date: string;
  result_value: string;
  is_abnormal: boolean;
  notes?: string;
  ordered_by: string;
}

type FieldProps = {
  label: string
  error?: string
  children: React.ReactNode
}

function FormField({ label, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        className="block text-sm font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

const emptyValues: LabResultForm = {
  patient_id: "",
  lab_test_id: "",
  test_date: "",
  result_value: "",
  is_abnormal: false,
  notes: "",
  ordered_by: "",
}

export default function LabTestsPage() {
  const { t } = useTranslation()
  const labResultSchema = z.object({
    patient_id: z.string().min(1, t("lab.validation.patientRequired")),
    lab_test_id: z.string().min(1, t("lab.validation.testRequired")),
    test_date: z.string().min(1, t("lab.validation.testDateRequired")),
    result_value: z.string().min(1, t("lab.validation.resultValueRequired")),
    is_abnormal: z.boolean(),
    notes: z.string().optional(),
    ordered_by: z.string().min(1, t("lab.validation.orderedByRequired")),
  })
  const navigate = useNavigate()
  const [editingResult, setEditingResult] = useState<LabTestPatientDto | null>(
    null,
  )
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean
    id: string
  }>({ isOpen: false, id: "" })

  const labTestsQuery = useLabTests()
  const labResultsQuery = useLabTestPatients()
  const createMutation = useCreateLabTestPatient()
  const updateMutation = useUpdateLabTestPatient()
  const deleteMutation = useDeleteLabTestPatient()

  const patientQuery = useQuery<Patient[], Error>({
    queryKey: ["patients"],
    queryFn: () =>
      patientService
        .getAll({ page: 1, pageSize: 250 })
        .then((result) => result.data),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const doctorQuery = useQuery<Doctor[], Error>({
    queryKey: ["doctors"],
    queryFn: doctorService.getAll,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const isLoading =
    labTestsQuery.isLoading ||
    labResultsQuery.isLoading ||
    patientQuery.isLoading ||
    doctorQuery.isLoading

  const patientOptions =
    patientQuery.data?.map((patient) => ({
      value: patient.patient_id,
      label: patient.full_name,
    })) ?? []
  const labTestOptions =
    labTestsQuery.data?.map((test) => ({
      value: test.lab_test_id,
      label: `${test.test_name} (${test.category})`,
    })) ?? []
  const doctorOptions =
    doctorQuery.data?.map((doctor) => ({
      value: doctor.doctor_id,
      label: doctor.full_name,
    })) ?? []

  const { register, handleSubmit, reset, formState } = useForm<LabResultForm>({
    resolver: zodResolver(labResultSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (editingResult) {
      reset({
        patient_id: String(editingResult.patient_id),
        lab_test_id: String(editingResult.lab_test_id),
        test_date: editingResult.test_date,
        result_value: editingResult.result_value,
        is_abnormal: editingResult.is_abnormal ?? false,
        notes: editingResult.notes,
        ordered_by: editingResult.ordered_by ? String(editingResult.ordered_by) : "",
      })
    } else {
      reset(emptyValues)
    }
  }, [editingResult, reset])

  const openAddForm = () => {
    setEditingResult(null)
    reset(emptyValues)
    setIsFormOpen(true)
  }

  const openEditForm = (row: LabTestPatientDto) => {
    setEditingResult(row)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setEditingResult(null)
    setIsFormOpen(false)
    reset(emptyValues)
  }

  const onSubmit = async (values: LabResultForm) => {

    const payload = {
      ...values,
      notes: values.notes ?? "",

      cycle_id: null,
      visit_id: null,
    }

    if (editingResult) {
      await updateMutation.mutateAsync({
        ...editingResult,
        ...payload,
        ordered_by: Number(editingResult?.ordered_by ?? 0),
        lab_test_patient_id: Number(editingResult.lab_test_patient_id),
        patient_id: editingResult.patient_id,
        lab_test_id: Number(editingResult.lab_test_id),
      })
    } else {
      await createMutation.mutateAsync(payload)
    }

    closeForm()
  }

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id)
  }

  const columns: Column<LabTestPatientDto>[] = [
    {
      key: "test_date",
      header: t("common.date"),
      render: (value) => formatDate(String(value)),
    },
    {
      key: "patient_name",
      header: t("diagnoses.patient"),
      render: (patient_name) => {
        return (
          <span className="font-medium text-emerald-500">
            {String(patient_name) ?? t("common.unknown")}
          </span>
        )
      },
    },
    {
      key: "lab_test_name",
      header: t("lab.testName"),
      render: (lab_test_name) => {
        return (
          <span className="font-medium text-indigo-500">
            {String(lab_test_name) ?? t("common.unknown")}
          </span>
        )
      },
    },
    {
      key: "result_value",
      header: t("lab.result"),
      render: (result_value) => {
        return (
          <div className="flex items-center gap-2">
            <span className={"font-bold "}>{String(result_value)}</span>
          </div>
        )
      },
    },
    {
      key: "result_status",
      header: t("common.status.label"),
      render: (result_status) => (
        <StatusBadge status={`${result_status ?? "-"}`} />
      ),
    },
    {
      key: "actions",
      header: t("common.actions"),
      render: (_, row) => (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 transition hover:bg-slate-50"
            onClick={() => openEditForm(row)}
          >
            <Edit3 size={14} className="inline-block mr-1" />
            {t("common.edit")}
          </button>
          <button
            type="button"
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-1 text-sm text-red-600 transition hover:bg-red-100"
            onClick={() =>
              setShowDeleteConfirm({
                isOpen: true,
                id: String(row.lab_test_patient_id),
              })
            }
          >
            <Trash2 size={14} className="inline-block mr-1" />
            {t("common.delete")}
          </button>
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
            {t("lab.title")}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("lab.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/lab-tests/manage")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("lab.manageTests")}
          </button>
          <button
            type="button"
            onClick={openAddForm}
            className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5"
          >
            <Plus size={16} /> {t("lab.addResult")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-indigo-500">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
            <FlaskConical size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">{t("lab.totalTests")}</p>
            <p className="text-2xl font-bold">
              {labTestsQuery.data?.length ?? 0}
            </p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-emerald-500">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
            <FlaskConical size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">{t("lab.resultsRecorded")}</p>
            <p className="text-2xl font-bold">
              {labResultsQuery.data?.length ?? 0}
            </p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4 border-l-4 border-red-500">
          <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">{t("lab.abnormalResults")}</p>
            <p className="text-2xl font-bold text-red-500">
              {labResultsQuery.data?.filter((item) => item.result_status!=='normal')
                .length ?? 0}

            </p>
          </div>
        </div>
      </div>

      <DataTable<LabTestPatientDto>
        columns={columns}
        data={labResultsQuery?.data || []}
        isLoading={isLoading}
        searchPlaceholder={t("lab.searchPlaceholder")}
        emptyMessage={t("lab.noResults")}
      />

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={
          editingResult
            ? t("lab.editResultTitle")
            : t("lab.addResultTitle")
        }
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t("diagnoses.patient")}
              error={formState.errors.patient_id?.message?.toString()}
            >
              <select
                {...register("patient_id")}
                className="input-field w-full"
              >
                <option value="">
                  {t("lab.selectPatient")}
                </option>
                {patientOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label={t("lab.testName")}
              error={formState.errors.lab_test_id?.message?.toString()}
            >
              <select
                {...register("lab_test_id")}
                className="input-field w-full"
              >
                <option value="">{t("lab.selectTest")}</option>
                {labTestOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField
              label={t("lab.date")}
              error={formState.errors.test_date?.message?.toString()}
            >
              <input
                {...register("test_date")}
                type="date"
                className="input-field w-full"
              />
            </FormField>
            <FormField
              label={t("doctors.TheTreatingPhysician")}
              error={formState.errors.ordered_by?.message?.toString()}
            >
              <select
                {...register("ordered_by")}
                className="input-field w-full"
              >
                <option value="">
                  {t("lab.selectDoctor")}
                </option>
                {doctorOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              label={t("lab.resultValue")}
              error={formState.errors.result_value?.message?.toString()}
            >
              <input
                {...register("result_value")}
                className="input-field w-full"
                placeholder={t("lab.resultValuePlaceholder")}
              />
            </FormField>
            <div className="space-y-1.5">
              {formState.errors.is_abnormal && (
                <p className="text-xs text-red-500">{formState.errors.is_abnormal.message?.toString()}</p>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("is_abnormal")}
                  className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-500/20"
                />
                <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                  {t("lab.isAbnormal")}
                </span>
              </label>
            </div>
          </div>

          <FormField
            label={t("common.notes")}
            error={formState.errors.notes?.message?.toString()}
          >
            <textarea
              {...register("notes")}
              className="input-field w-full min-h-[100px]"
            />
          </FormField>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="gradient-btn px-6 py-2.5 text-sm"
              disabled={
                formState.isSubmitting ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {editingResult
                ? t("lab.updateResult")
                : t("lab.saveResult")}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        isOpen={showDeleteConfirm.isOpen}
        onClose={() => setShowDeleteConfirm({ isOpen: false, id: "" })}
        onConfirm={() => {
          if (showDeleteConfirm.id) handleDelete(showDeleteConfirm.id)
        }}
        title={t("common.delete")}
        message={t("lab.deleteResultConfirm")}
        variant="danger"
      />
    </motion.div>
  )
}
