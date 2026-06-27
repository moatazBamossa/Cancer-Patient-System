import React, { useState, useEffect, useCallback } from "react"
import { Field } from "react-final-form"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Pill,
  Tag,
  Activity,
  ToggleLeft,
  ToggleRight,
  FileText,
  Beaker,
} from "lucide-react"
import { z } from "zod"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import { medicationService } from "../../services/medication.service"
import { Modal } from "../../components/ui/Modal"
import { AppForm } from "../../components/ui/AppForm"
import { FormField } from "../../components/ui/FormField"
import { zodValidator } from "../../lib/zodValidator"
import { ConfirmDialog } from "../../components/ui/ConfirmDialog"
import { StatusBadge } from "../../components/ui/StatusBadge"
import { DataTable, Column } from "../../components/ui/DataTable"
import type { MedicationRpcItem } from "../../types/medicationRpc"

type MedForm = {
  p_name: string
  p_category: string
  p_unit: string
  p_description: string
  p_is_active: boolean
}

const DEFAULT_VALUES: MedForm = {
  p_name: "",
  p_category: "",
  p_unit: "",
  p_description: "",
  p_is_active: true,
}

// ─── Category glass tokens ────────────────────────────────────────────────────
interface GlassToken {
  stripe: string // top accent bar colour
  glow: string // box-shadow glow
  border: string // border colour
  dot: string // dot class
  chip: string // chip background
}

const GLASS_TOKENS: Record<string, GlassToken> = {
  chemotherapy: {
    stripe: "#f43f5e",
    glow: "rgba(244,63,94,0.22)",
    border: "rgba(244,63,94,0.35)",
    dot: "bg-rose-500",
    chip: "rgba(244,63,94,0.10)",
  },
  chemo: {
    stripe: "#f43f5e",
    glow: "rgba(244,63,94,0.22)",
    border: "rgba(244,63,94,0.35)",
    dot: "bg-rose-500",
    chip: "rgba(244,63,94,0.10)",
  },
  hormonal: {
    stripe: "#a855f7",
    glow: "rgba(168,85,247,0.22)",
    border: "rgba(168,85,247,0.35)",
    dot: "bg-violet-500",
    chip: "rgba(168,85,247,0.10)",
  },
  supportive: {
    stripe: "#10b981",
    glow: "rgba(16,185,129,0.22)",
    border: "rgba(16,185,129,0.35)",
    dot: "bg-emerald-500",
    chip: "rgba(16,185,129,0.10)",
  },
  targeted: {
    stripe: "#38bdf8",
    glow: "rgba(56,189,248,0.22)",
    border: "rgba(56,189,248,0.35)",
    dot: "bg-sky-400",
    chip: "rgba(56,189,248,0.10)",
  },
  immunotherapy: {
    stripe: "#f59e0b",
    glow: "rgba(245,158,11,0.22)",
    border: "rgba(245,158,11,0.35)",
    dot: "bg-amber-500",
    chip: "rgba(245,158,11,0.10)",
  },
}

const DEFAULT_TOKEN: GlassToken = {
  stripe: "#6366f1",
  glow: "rgba(99,102,241,0.20)",
  border: "rgba(99,102,241,0.30)",
  dot: "bg-indigo-400",
  chip: "rgba(99,102,241,0.10)",
}

const getToken = (cat: string): GlassToken =>
  GLASS_TOKENS[cat?.toLowerCase()] ?? DEFAULT_TOKEN

// ─── InfoChip ─────────────────────────────────────────────────────────────────
function InfoChip({
  icon,
  label,
  value,
  chipBg,
}: {
  icon: React.ReactNode
  label: string
  value: string
  chipBg?: string
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5"
      style={{ background: chipBg ?? "rgba(30,41,59,0.6)" }}
    >
      <span style={{ color: "#94a3b8" }}>{icon}</span>
      <div className="min-w-0">
        <p
          className="text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: "#64748b" }}
        >
          {label}
        </p>
        <p
          className="text-xs font-semibold truncate"
          style={{ color: "#e2e8f0" }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── MedicationCard ───────────────────────────────────────────────────────────
interface MedCardProps {
  med: MedicationRpcItem
  index: number
  onEdit: (m: MedicationRpcItem) => void
  onDelete: (m: MedicationRpcItem) => void
}

function MedicationCard({ med, index, onEdit, onDelete }: MedCardProps) {
  const { t } = useTranslation()
  const tk = getToken(med.category)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4) }}
      className="relative flex flex-col rounded-2xl overflow-hidden group cursor-default"
      style={{
        background: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: `1px solid ${tk.border}`,
        boxShadow: `0 0 0 1px ${tk.border}, 0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)`,
        transition: "box-shadow 0.25s ease, transform 0.25s ease",
      }}
      whileHover={{
        boxShadow: `0 0 0 1px ${tk.border}, 0 0 28px ${tk.glow}, 0 16px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)`,
        y: -2,
      }}
    >
      {/* ── Coloured top stripe ── */}
      <div
        className="h-[3px] w-full flex-shrink-0"
        style={{
          background: `linear-gradient(90deg, ${tk.stripe}, transparent)`,
        }}
      />

      {/* ── Subtle inner radial glow ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 70% 45% at 50% 0%, ${tk.glow} 0%, transparent 70%)`,
        }}
      />

      {/* ── Content ── */}
      <div className="relative flex flex-col gap-3 p-5">
        {/* Header: name + action buttons */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tk.dot}`}
              style={{ boxShadow: `0 0 6px ${tk.stripe}` }}
            />
            <span
              className="font-semibold text-sm leading-snug truncate"
              style={{ color: "#f1f5f9" }}
              title={med.name}
            >
              {med.name}
            </span>
          </div>

          {/* Hover-reveal action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
            <button
              onClick={() => onEdit(med)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "#94a3b8", background: tk.chip }}
              title={t("common.edit")}
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDelete(med)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: "#94a3b8", background: "rgba(239,68,68,0.12)" }}
              title={t("common.delete")}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Category badge */}
        <StatusBadge status={med.category} />

        {/* Info chips */}
        <div className="grid grid-cols-2 gap-1.5">
          {med.unit && (
            <InfoChip
              icon={<Beaker size={10} />}
              label={t("medications.unit")}
              value={med.unit}
              chipBg={tk.chip}
            />
          )}
          <InfoChip
            icon={
              med.is_active ? (
                <ToggleRight size={10} />
              ) : (
                <ToggleLeft size={10} />
              )
            }
            label={t("common.status.label")}
            value={
              med.is_active
                ? t("common.status.active")
                : t("common.status.inactive")
            }
            chipBg={
              med.is_active ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.15)"
            }
          />
        </div>

        {/* Description */}
        {med.description && (
          <div className="flex items-start gap-1.5">
            <FileText
              size={11}
              className="flex-shrink-0 mt-0.5"
              style={{ color: "#64748b" }}
            />
            <p
              className="text-xs leading-relaxed line-clamp-3"
              style={{ color: "#94a3b8" }}
            >
              {med.description}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Skeleton card while loading ──────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl border p-5 space-y-3 animate-pulse"
      style={{
        borderColor: "var(--border-color)",
        background: "var(--bg-secondary)",
      }}
    >
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-current opacity-20" />
        <div className="h-4 w-32 rounded bg-current opacity-20" />
      </div>
      <div className="h-5 w-20 rounded-full bg-current opacity-10" />
      <div className="grid grid-cols-2 gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-current opacity-10" />
        ))}
      </div>
      <div className="h-3 w-full rounded bg-current opacity-10" />
    </div>
  )
}

// ─── Main page component ──────────────────────────────────────────────────────
export default function MedicationsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  // ── local state ──
  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [catFilter, setCatFilter] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<MedicationRpcItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MedicationRpcItem | null>(
    null,
  )
  const [formKey, setFormKey] = useState(0)
  const [formInitials, setFormInitials] = useState<MedForm>(DEFAULT_VALUES)

  // ── 400 ms debounce on search ──
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => clearTimeout(id)
  }, [searchInput])

  // ── zod schema ──
  const medSchema = z.object({
    p_name: z.string().min(1, t("medications.validation.nameRequired")),
    p_category: z.string().min(1, t("medications.validation.categoryRequired")),
    p_unit: z.string().optional().default(""),
    p_description: z.string().optional().default(""),
    p_is_active: z.boolean().optional().default(true),
  })

  // Static known categories + any extras returned by the DB
  const categoryOptions = [
    { value: "Chemotherapy", label: t("medications.chemotherapy") },
    { value: "Hormonal", label: t("medications.hormonal") },
    { value: "Supportive", label: t("medications.supportive") },
    { value: "Targeted", label: t("medications.targeted") },
    { value: "Immunotherapy", label: t("medications.immunotherapy") },
    { value: "radiation_therapy", label: t("medications.radiation_therapy") },
  ]

  const categoryStatusMap = {
    Chemotherapy: t("medications.chemotherapy"),
    Hormonal: t("medications.hormonal"),
    Supportive: t("medications.supportive"),
    Targeted: t("medications.targeted"),
    Immunotherapy: t("medications.immunotherapy"),
    radiation_therapy: t("medications.radiation_therapy"),
  }

  // ── main medications query — switches on active filter ──
  const { data: medications = [], isLoading } = useQuery({
    queryKey: ["medications", debouncedSearch, catFilter],
    queryFn: () => {
      if (debouncedSearch)
        return medicationService.searchByName(debouncedSearch)
      if (catFilter) return medicationService.listByCategory(catFilter)
      return medicationService.listAll()
    },
  })

  // ── summary stats derived from current list ──
  const totalCount = medications.length
  const catCount = new Set(medications.map((m) => m.category)).size
  const activeCount = medications.filter((m) => m.is_active).length

  // ─── form helpers ────────────────────────────────────────────────────────────
  const closeForm = useCallback(() => {
    setShowForm(false)
    setEditItem(null)
  }, [])

  const openAdd = useCallback(() => {
    setEditItem(null)
    setFormInitials(DEFAULT_VALUES)
    setFormKey((k) => k + 1)
    setShowForm(true)
  }, [])

  const openEdit = useCallback((m: MedicationRpcItem) => {
    setEditItem(m)
    setFormInitials({
      p_name: m.name,
      p_category: m.category,
      p_unit: m.unit ?? "",
      p_description: m.description ?? "",
      p_is_active: m.is_active,
    })
    setFormKey((k) => k + 1)
    setShowForm(true)
  }, [])

  // ─── mutations ───────────────────────────────────────────────────────────────
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["medications"] })
    qc.invalidateQueries({ queryKey: ["medication-categories"] })
  }

  const toOptional = (v?: string) =>
    v && v.trim() !== "" ? v.trim() : undefined

  const createMut = useMutation({
    mutationFn: (d: MedForm) =>
      medicationService.create({
        p_name: d.p_name,
        p_category: d.p_category,
        p_unit: toOptional(d.p_unit),
        p_description: toOptional(d.p_description),
        p_is_active: d.p_is_active ?? true,
      }),
    onSuccess: () => {
      invalidate()
      toast.success(t("common.created"))
      closeForm()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const updateMut = useMutation({
    mutationFn: (d: MedForm) =>
      medicationService.update({
        p_medication_id: editItem!.medication_id,
        p_name: d.p_name,
        p_category: d.p_category,
        p_unit: toOptional(d.p_unit),
        p_description: toOptional(d.p_description),
        p_is_active: d.p_is_active ?? true,
      }),
    onSuccess: () => {
      invalidate()
      toast.success(t("common.updated"))
      closeForm()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => medicationService.delete(id),
    onSuccess: () => {
      invalidate()
      toast.success(t("common.deleteSuccess"))
      setDeleteTarget(null)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const isMutating = createMut.isPending || updateMut.isPending

  // ─── table columns for DataTable ────────────────────────────────────────────
  const columns: Column<MedicationRpcItem>[] = [
    { key: "name", header: t("common.name"), sortable: true },
    {
      key: "category",
      header: t("common.category"),
      sortable: true,
      render: (_v, row) => <StatusBadge status={categoryStatusMap[row.category]} />,
    },
    { key: "unit", header: t("medications.unit"), sortable: false },
    {
      key: "is_active",
      header: t("common.status.label"),
      sortable: true,
      render: (v: unknown) =>
        v ? t("common.status.active") : t("common.status.inactive"),
    },
    {
      key: "description",
      header: t("common.description"),
      render: (v: unknown) => String(v ?? "").slice(0, 120),
    },
  ]

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            {t("medications.title")}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t("medications.subtitle")}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus size={16} />
          {t("medications.addMedication")}
        </button>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            icon: <Pill size={16} />,
            label: t("medications.totalMedications"),
            value: totalCount,
          },
          {
            icon: <Tag size={16} />,
            label: t("medications.categories"),
            value: catCount,
          },
          {
            icon: <Activity size={16} />,
            label: t("medications.activeCount"),
            value: activeCount,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border flex items-center gap-3 px-4 py-3"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
            }}
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-muted)",
              }}
            >
              {s.icon}
            </span>
            <div>
              <p
                className="text-lg font-bold leading-none"
                style={{ color: "var(--text-primary)" }}
              >
                {s.value}
              </p>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters bar ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={15} style={{ color: "var(--text-muted)" }} />
          </div>
          <input
            type="text"
            placeholder={t("medications.searchByName")}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setCatFilter("") // clear category when typing
            }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border focus:ring-2 focus:outline-none transition"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-color)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Category dropdown */}
        <select
          value={catFilter}
          onChange={(e) => {
            setCatFilter(e.target.value)
            setSearchInput("") // clear search when picking category
          }}
          className="input-field w-full sm:w-52 text-sm"
        >
          <option value="">{t("medications.allCategories")}</option>
          {categoryOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table view ── */}
      <DataTable<MedicationRpcItem>
        columns={columns}
        data={medications}
        isLoading={isLoading}
        emptyMessage={t("medications.noData") ?? "No medications found"}
        onRowClick={openEdit}
        actions={(row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                openEdit(row)
              }}
              className="p-1.5 rounded-lg"
              title={t("common.edit")}
              style={{ color: "var(--text-muted)" }}
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(row)
              }}
              className="p-1.5 rounded-lg"
              title={t("common.delete")}
              style={{ color: "var(--text-muted)" }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      />

      {/* ── Create / Edit modal ── */}
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={
          editItem
            ? t("medications.editMedication")
            : t("medications.addMedicationTitle")
        }
        size="lg"
      >
        <AppForm<MedForm>
          formKey={formKey}
          initialValues={formInitials}
          validate={zodValidator(medSchema)}
          onSubmit={(d) =>
            editItem ? updateMut.mutate(d) : createMut.mutate(d)
          }
          className="space-y-4"
        >
          {/* Row 1 — Name + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              name="p_name"
              label={t("medications.medicationName")}
              required
              placeholder={t("medications.namePlaceholder")}
            />
            <FormField
              name="p_category"
              label={t("medications.category")}
              type="select"
              required
              options={categoryOptions}
            />
          </div>

          {/* Row 2 — Unit */}
          <FormField
            name="p_unit"
            label={t("medications.unit")}
            placeholder={t("medications.unitPlaceholder")}
          />

          {/* Description */}
          <FormField
            name="p_description"
            label={t("common.description")}
            type="textarea"
            placeholder={t("medications.descriptionPlaceholder")}
          />

          {/* Active toggle */}
          <Field name="p_is_active" type="checkbox">
            {({ input }) => (
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => input.onChange(!input.checked)}
                  className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
                    input.checked ? "bg-emerald-500" : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                      input.checked ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {t("common.status.active")}
                </span>
              </label>
            )}
          </Field>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isMutating}
              className="gradient-btn px-6 py-2.5 text-sm disabled:opacity-60"
            >
              {isMutating
                ? t("common.saving")
                : editItem
                  ? t("common.update")
                  : t("common.create")}
            </button>
          </div>
        </AppForm>
      </Modal>

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget && deleteMut.mutate(deleteTarget.medication_id)
        }
        title={t("common.delete")}
        message={t("common.deleteConfirm", { name: deleteTarget?.name })}
      />
    </motion.div>
  )
}
