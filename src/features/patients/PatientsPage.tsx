import React, { useState, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Plus, Edit2, Trash2, Eye, Download } from "lucide-react"
import toast from "react-hot-toast"
import { patientService } from "../../services/patient.service"
import { DataTable, type Column } from "../../components/ui/DataTable"
import { StatusBadge } from "../../components/ui/StatusBadge"
import { ConfirmDialog } from "../../components/ui/ConfirmDialog"
import { Modal } from "../../components/ui/Modal"
import { PatientForm } from "./PatientForm"
import { formatDate, exportToCSV, exportToExcel, debounce } from "../../lib/utils"
import type { Patient } from "../../types"
import { useTranslation } from "react-i18next"
import { useModulePermissions } from "../../modules/roles/permissions"
import { NoListPermission } from "../../components/guards"

type StatusFilter = "all" | "active"

export default function PatientsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortBy, setSortBy] = useState("")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showForm, setShowForm] = useState(false)
  const [editPatient, setEditPatient] = useState<Patient | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null)

  const pageSize = 10

  const { canList, canCreate, canUpdate, canDelete } =
    useModulePermissions("patient")

  const invalidatePatientsQuery = () => {
    queryClient.invalidateQueries({ queryKey: ["patients"] })
    queryClient.invalidateQueries({ queryKey: ["patient-visits-patients"] })
  }

  const { data, isLoading } = useQuery({
    queryKey: ["patients", page, search, statusFilter, sortBy, sortOrder],
    queryFn: () =>
      patientService.getAll({
        page,
        pageSize,
        search,
        sortBy,
        sortOrder,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    enabled: canList,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientService.softDelete(id),
    onSuccess: () => {
      invalidatePatientsQuery()
      toast.success(t("patients.deleteSuccess"))
    },
    onError: () => toast.error(t("patients.deleteError")),
  })

  const debouncedSearch = useCallback(
    debounce((q: string) => {
      setSearch(q)
      setPage(1)
    }, 400),
    [],
  )

  const handleExport = () => {
    if (data?.data) {
      exportToCSV(
        data.data.map((p) => ({
          [t("common.name")]: p.full_name,
          [t("patients.nationalId")]: p.national_id,
          [t("patients.gender")]: p.gender,
          [t("patients.dob")]: p.birth_date,
          [t("common.phone")]: p.phone,
          [t("common.email")]: p.email,
          [t("common.status.label")]: p.status,
          [t("patients.bloodType")]: p.blood_type,
          [t("patients.nationality")]: p.nationality,
        })),
        "patients_export",
      )
      toast.success(t("common.exportSuccess"))
    }
  }

  const handleExportExcel = () => {
    if (data?.data) {
      exportToExcel(
        data.data.map((p) => ({
          [t("common.name")]: p.full_name,
          [t("patients.nationalId")]: p.national_id,
          [t("patients.gender")]: p.gender,
          [t("patients.dob")]: p.birth_date,
          [t("common.phone")]: p.phone,
          [t("common.email")]: p.email,
          [t("common.status.label")]: p.status,
          [t("patients.bloodType")]: p.blood_type,
          [t("patients.nationality")]: p.nationality,
        })),
        "patients_export",
      )
      toast.success(t("common.exportSuccess"))
    }
  }

  const columns: Column<Patient>[] = [
    {
      key: "full_name",
      header: t("common.patient"),
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "var(--accent-gradient)" }}
          >
            {row.full_name
              .split(" ")
              .map((n) => n.charAt(0))
              .join("")
              .slice(0, 2)}
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--text-primary)" }}>
              {row.full_name}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {row.national_id}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "gender",
      header: t("patients.gender"),
      render: (v) => (
        <span className="capitalize">
          {v === "male" ? t("patients.male") : t("patients.female")}
        </span>
      ),
    },
    {
      key: "birth_date",
      header: t("patients.dob"),
      sortable: true,
      render: (v) => formatDate(String(v)),
    },
    {
      key: "blood_type",
      header: t("patients.bloodType"),
      render: (v) => (
        <span
          className="font-mono text-xs font-bold"
          style={{ color: "var(--accent-primary)" }}
        >
          {String(v)}
        </span>
      ),
    },
    { key: "phone", header: t("patients.phone") },
    {
      key: "status",
      header: t("common.status.label"),
      sortable: true,
      render: (v) => {
        console.log("v", v);

        return <StatusBadge status={String(v)} />
      },
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("common.patients")}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("patients.manageRecords")}
          </p>
        </div>
      </div>

      {!canList ? (
        <NoListPermission module={t("common.patients")} />
      ) : (
        <DataTable<Patient>
          columns={columns}
          data={data?.data || []}
          totalItems={data?.total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onSearch={debouncedSearch}
          onSort={(key, order) => {
            setSortBy(key)
            setSortOrder(order)
          }}
          searchPlaceholder={t("patients.searchPlaceholder")}
          isLoading={isLoading}
          emptyMessage={t("patients.notFound")}
          onRowClick={(row) =>
            navigate(`/patients/${(row as unknown as Patient).patient_id}`)
          }
          headerActions={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter)
                  setPage(1)
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">{t("common.all", { defaultValue: "All" })}</option>
                <option value="active">
                  {t("common.status.active", { defaultValue: "Active" })}
                </option>

              </select>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                }}
              >
                <Download size={16} /> CSV
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                }}
              >
                <Download size={16} /> Excel
              </button>
              {canCreate && (
                <button
                  onClick={() => {
                    setEditPatient(null)
                    setShowForm(true)
                  }}
                  className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5"
                >
                  <Plus size={16} /> {t("common.add")} {t("common.patient")}
                </button>
              )}
            </div>
          }
          actions={(row) => {
            const patient = row as unknown as Patient
            return (
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/patients/${patient.patient_id}`)
                  }}
                  className="p-1.5 rounded-lg transition-colors hover:bg-blue-500/10"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Eye size={16} />
                </button>
                {canUpdate && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditPatient(patient)
                      setShowForm(true)
                    }}
                    className="p-1.5 rounded-lg transition-colors hover:bg-amber-500/10"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Edit2 size={16} />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(patient)
                    }}
                    className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )
          }}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditPatient(null)
        }}
        title={
          editPatient
            ? `${t("common.update")} ${t("common.patient")}`
            : `${t("common.create")} ${t("common.patient")}`
        }
        size="lg"
      >
        <PatientForm
          patient={editPatient}
          onSuccess={() => {
            setShowForm(false)
            setEditPatient(null)
            queryClient.invalidateQueries({ queryKey: ["patients"] })
          }}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget && deleteMutation.mutate(deleteTarget.patient_id)
        }
        title={t("patients.deleteTitle")}
        message={t("patients.deleteConfirm", {
          name: deleteTarget?.full_name,
        })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
      />
    </motion.div>
  )
}
