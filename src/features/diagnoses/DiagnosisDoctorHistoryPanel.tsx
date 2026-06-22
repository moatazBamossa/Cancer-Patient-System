import React, { useMemo, useState } from "react"
import {
  useDiagnosisDoctorHistoryQuery,
  useCreateDiagnosisDoctorHistory,
  useUpdateDiagnosisDoctorHistory,
  useDeleteDiagnosisDoctorHistory,
} from "../../modules/diagnosis-doctor-history/hooks/diagnosis-doctor-history.hooks"
import type { DiagnosisDoctorHistory } from "../../modules/diagnosis-doctor-history/types"
import { AppForm } from "../../components/ui/AppForm"
import { FormField } from "../../components/ui/FormField"
import { Modal } from "../../components/ui/Modal"
import { useQuery } from "@tanstack/react-query"
import { doctorService } from "../../services/doctor.service"
import { Doctor } from "../../types"
import { formatDate, formatDateTime } from "../../lib/utils"
import { useTranslation } from "react-i18next"

interface Props {
  diagnosisId: number
}

export default function DiagnosisDoctorHistoryPanel({ diagnosisId }: Props) {
  const { t } = useTranslation()
  const { data: histories = [], isLoading } =
    useDiagnosisDoctorHistoryQuery(diagnosisId)
  const doctorQuery = useQuery<Doctor[], Error>({
    queryKey: ["doctors"],
    queryFn: doctorService.getAll,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  })

  const createMutation = useCreateDiagnosisDoctorHistory()
  const updateMutation = useUpdateDiagnosisDoctorHistory()
  const deleteMutation = useDeleteDiagnosisDoctorHistory()

  const user = JSON.parse(localStorage.getItem("auth_user") || "null")

  const activeAssignment = useMemo(() => {
    return histories.find((h) => !h.end_date) as
      | DiagnosisDoctorHistory
      | undefined
  }, [histories])

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editing, setEditing] = useState<DiagnosisDoctorHistory | null>(null)

  const [confirmDelete, setConfirmDelete] =
    useState<DiagnosisDoctorHistory | null>(null)

  const doctorOptions =
    doctorQuery.data?.map((doctor) => ({
      value: String(doctor.doctor_id),
      label: doctor.full_name,
    })) ?? []

  return (
    <div className="space-y-4">
      <div className="p-4 bg-white rounded shadow">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t("diagnosisDoctorHistory.currentAssignment")}</h3>
          <div>
            <button
              className="gradient-btn px-4 py-2 text-sm rounded-lg"
              onClick={() => setShowAssignModal(true)}
            >
              {t("diagnosisDoctorHistory.assignReassign")}
            </button>
          </div>
        </div>
        <div className="mt-3">
          {isLoading ? (
            <div>{t("common.loading")}</div>
          ) : activeAssignment ? (
            <div>
              <div className="font-medium">{activeAssignment.doctor_name}</div>
              <div className="text-sm text-slate-500">
                {t("diagnosisDoctorHistory.assigned")}: {formatDate(activeAssignment.start_date)}
              </div>
              <div className="text-sm text-slate-500">
                {t("addUsers.created")}: {formatDateTime(activeAssignment.assigned_date)}
              </div>
              {activeAssignment.changed_by_name && (
                <div className="text-sm text-slate-500">
                  {t("diagnosisDoctorHistory.changedBy")}: {activeAssignment.changed_by_name}
                </div>
              )}
              {activeAssignment.notes && (
                <div className="text-sm text-slate-500">
                  {t("common.notes")}: {activeAssignment.notes}
                </div>
              )}
              <div className="mt-2 grid gap-2 sm:flex sm:justify-start">
                <button
                  className="gradient-btn px-4 py-2 text-sm rounded-lg"
                  onClick={() => setEditing(activeAssignment)}
                >
                  {t("common.edit")}
                </button>
                <button
                  className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => setConfirmDelete(activeAssignment)}
                >
                  {t("common.delete")}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              {t("diagnosisDoctorHistory.noActiveDoctor")}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-white rounded shadow">
        <h4 className="text-md font-semibold">{t("diagnosisDoctorHistory.assignmentHistory")}</h4>
        <div className="mt-3 space-y-2">
          {histories.length === 0 ? (
            <div className="text-sm text-slate-500">{t("diagnosisDoctorHistory.noHistory")}</div>
          ) : (
            histories.map((h) => (
              <div
                key={h.history_id}
                className="border rounded-lg p-4 bg-slate-50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="font-medium text-slate-900">
                      {h.doctor_name}
                    </div>
                    <div className="text-sm text-slate-500">
                      {formatDate(h.start_date)} —{" "}
                      {h.end_date ? formatDate(h.end_date) : t("diagnosisDoctorHistory.present")}
                    </div>
                    <div className="text-sm text-slate-500">
                      {t("diagnosisDoctorHistory.assigned")}: {formatDateTime(h.assigned_date)}
                    </div>
                    {h.changed_by_name && (
                      <div className="text-sm text-slate-500">
                        {t("diagnosisDoctorHistory.changedBy")}: {h.changed_by_name}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm"
                      onClick={() => setEditing(h)}
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
                      onClick={() => setConfirmDelete(h)}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </div>
                {h.reason_for_change && (
                  <div className="text-sm mt-3 text-slate-700">
                    {t("diagnosisDoctorHistory.reason")}: {h.reason_for_change}
                  </div>
                )}
                {h.notes && (
                  <div className="text-sm mt-2 text-slate-700">
                    {t("common.notes")}: {h.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={t("diagnosisDoctorHistory.assignDoctor")}
      >
        <AppForm
          onSubmit={async (values) => {
            try {
              await createMutation.mutateAsync({
                diagnosis_id: diagnosisId,
                doctor_id: Number(values.doctor_id),
                start_date: values.start_date,
                reason_for_change: values.reason_for_change,
                notes: values.notes,
                changed_by: user.id,
              })
              setShowAssignModal(false)
            } catch (err) {
              console.error(err)
            }
          }}
          initialValues={{
            doctor_id: "",
            start_date: "",
            reason_for_change: "",
            notes: "",
          }}
        >
          <FormField
            name="doctor_id"
            label={t("diagnosisDoctorHistory.doctorId")}
            component="select"
            options={doctorOptions}
          />
          <FormField
            name="start_date"
            label={t("treatment.startDate")}
            component="input"
            type="date"
          />
          <FormField
            name="reason_for_change"
            label={t("diagnosisDoctorHistory.reason")}
            component="textarea"
          />
          <FormField name="notes" label={t("common.notes")} component="textarea" />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
              onClick={() => setShowAssignModal(false)}
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              className="gradient-btn px-5 py-2.5 text-sm rounded-lg"
            >
              {t("diagnosisDoctorHistory.assign")}
            </button>
          </div>
        </AppForm>
      </Modal>

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={t("diagnosisDoctorHistory.editAssignment")}
      >
        {editing && (
          <AppForm
            onSubmit={async (values) => {
              try {
                await updateMutation.mutateAsync({
                  history_id: editing.history_id,
                  end_date: values.end_date || null,
                  reason_for_change: values.reason_for_change || null,
                  notes: values.notes || null,
                })
                setEditing(null)
              } catch (err) {
                console.error(err)
              }
            }}
            initialValues={{
              start_date: String(editing.start_date).split("T")[0],
              end_date: String(editing.end_date).split("T")[0],
              reason_for_change: editing.reason_for_change ?? "",
              notes: editing.notes ?? "",
            }}
          >
            <FormField
              name="start_date"
              label={t("treatment.startDate")}
              component="input"
              type="date"
            />
            <FormField
              name="end_date"
              label={t("treatment.expectedEndDate")}
              component="input"
              type="date"
            />

            <FormField
              name="reason_for_change"
              label={t("diagnosisDoctorHistory.reason")}
              component="textarea"
            />
            <FormField name="notes" label={t("common.notes")} component="textarea" />

            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
                onClick={() => setEditing(null)}
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                className="gradient-btn px-5 py-2.5 text-sm rounded-lg"
              >
                {t("common.save")}
              </button>
            </div>
          </AppForm>
        )}
      </Modal>

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={t("diagnosisDoctorHistory.deleteAssignment")}
      >
        {confirmDelete && (
          <div>
            <p>
              {t("diagnosisDoctorHistory.deleteAssignmentConfirm", { name: confirmDelete.doctor_name })}
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
                onClick={() => setConfirmDelete(null)}
              >
                {t("common.cancel")}
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                onClick={async () => {
                  try {
                    await deleteMutation.mutateAsync(confirmDelete.history_id)
                    setConfirmDelete(null)
                  } catch (err) {
                    console.error(err)
                  }
                }}
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
