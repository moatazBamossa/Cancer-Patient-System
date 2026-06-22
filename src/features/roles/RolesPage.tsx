import React, { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus, Edit2, ShieldAlert, Trash2 } from "lucide-react"
import { Field } from "react-final-form"
import { z } from "zod"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"
import {
  useRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} from "../../modules/roles/hooks/role.hooks"
import { DataTable, type Column } from "../../components/ui/DataTable"
import { Modal } from "../../components/ui/Modal"
import { AppForm } from "../../components/ui/AppForm"
import { FormField } from "../../components/ui/FormField"
import { zodValidator } from "../../lib/zodValidator"
import { ConfirmDialog } from "../../components/ui/ConfirmDialog"
import type { Role } from "../../modules/roles/types"
import type { RolePermissions } from "../../modules/roles/types"
import {
  ROLE_PERMISSION_MODULES,
  ROLE_PERMISSION_ACTIONS,
  defaultRolePermissions,
  READ_ONLY,
  FULL_ACCESS,
} from "../../modules/roles/rolePermissions"
import { normalizePermissions } from "../../modules/roles/utils/role-normalizer"

export default function RolesPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Role | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const roleSchema = z.object({
    role_name: z.string().min(1, t("roles.nameRequired")),
  })

  type RoleForm = z.infer<typeof roleSchema>
  type RoleFormWithPermissions = RoleForm & {
    permissions?: Partial<RolePermissions>
  }

  const { data: roles, isLoading } = useRolesQuery()

  const createMut = useCreateRoleMutation()
  const updateMut = useUpdateRoleMutation()
  const deleteMut = useDeleteRoleMutation()

  const [formInitialValues, setFormInitialValues] = useState<RoleForm>({
    role_name: "",
  })
  const [formInitialPermissions, setFormInitialPermissions] = useState<
    Partial<RolePermissions> | undefined
  >(undefined)
  const [formKey, setFormKey] = useState(0)
  const [localPermissions, setLocalPermissions] = useState<
    Record<string, Record<string, boolean>>
  >(() => defaultRolePermissions() as any)
console.log("localPermissions", localPermissions);

  const handleClose = () => {
    setShowForm(false)
    setEditItem(null)
  }
  const columns: Column<Role>[] = [
    {
      key: "role_name",
      header: t("roles.roleName"),
      sortable: true,
      render: (v) => (
        <span
          className="font-bold flex items-center gap-2"
          style={{ color: "var(--text-primary)" }}
        >
          <ShieldAlert size={14} className="text-indigo-500" />
          {String(v)}
        </span>
      ),
    },
    {
      key: "permissions",
      header: t("roles.permissions"),
      render: (_v, row) => {
        const perms = (row as any).permissions ?? defaultRolePermissions()
        const totalModules = ROLE_PERMISSION_MODULES.length
        const totalActions = ROLE_PERMISSION_ACTIONS.length * totalModules
        let enabled = 0
        for (const m of ROLE_PERMISSION_MODULES) {
          const modulePerms = perms[m]
          for (const a of ROLE_PERMISSION_ACTIONS) {
            if (modulePerms && modulePerms[a]) enabled++
          }
        }
        if (enabled === totalActions)
          return (
            <span className="text-sm font-semibold text-emerald-600">
              Full Access
            </span>
          )
        const listOnly = enabled === totalModules // only list per module
        if (listOnly)
          return (
            <span className="text-sm font-semibold text-sky-600">
              Read Only
            </span>
          )
        return (
          <span className="text-sm">
            {totalModules} modules · {enabled} perms
          </span>
        )
      },
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--text-primary)" }}
        >
          {t("roles.title")}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {t("roles.subtitle")}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={roles || []}
        isLoading={isLoading}
        headerActions={
          <button
            onClick={() => {
              setEditItem(null)
              setFormInitialValues({ role_name: "" })
              setLocalPermissions(defaultRolePermissions() as any)
              setFormKey((k) => k + 1)
              setShowForm(true)
            }}
            className="gradient-btn px-4 py-2 text-sm flex items-center gap-1.5"
          >
            <Plus size={16} /> {t("roles.addRole")}
          </button>
        }
        actions={(row) => (
          <div className="flex gap-1">
            <button
              onClick={() => {
                setEditItem(row)
                setFormInitialValues({ role_name: row.role_name })
                setLocalPermissions(
                  (row as any).permissions ?? (defaultRolePermissions() as any),
                )
                setFormKey((k) => k + 1)
                setShowForm(true)
              }}
              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-500"
            >
              <Edit2 size={16} />
            </button>

            <button
              // onClick={() => { setEditItem(row); setFormInitialValues({ role_name: row.role_name }); setLocalPermissions((row as any).permissions ?? defaultRolePermissions() as any); setFormKey((k) => k + 1); setShowForm(true); }}
              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-red-600"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />

      <Modal
        isOpen={showForm}
        onClose={() => handleClose()}
        title={editItem ? t("roles.editRole") : t("roles.addRoleTitle")}
        size="sm"
      >
        <AppForm<RoleForm>
          formKey={formKey}
          initialValues={formInitialValues}
          validate={zodValidator(roleSchema)}
          onSubmit={(d) => {
            const payload = {
              role_name: d.role_name,
              permissions: localPermissions as any,
            } as any
            if (editItem)
              updateMut.mutate({ ...payload, role_id: editItem.role_id },{
              onSuccess: () => {
                setShowForm(false)
              }
            })
            else createMut.mutate(payload,{
              onSuccess: () => {
                setShowForm(false)
              }
            })
          }}
          className="space-y-4"
        >
          <FormField
            name="role_name"
            label={t("roles.roleName")}
            required
            placeholder={t("roles.roleNamePlaceholder")}
          />

          <div>
            <h3 className="text-sm font-semibold mb-2">{t("roles.permissions")}</h3>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  setLocalPermissions(defaultRolePermissions() as any)
                }}
                className="px-2 py-1 rounded border"
              >
                {t("roles.clearAll")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalPermissions(
                    Object.fromEntries(
                      ROLE_PERMISSION_MODULES.map((m) => [m, FULL_ACCESS]),
                    ) as any,
                  )
                }}
                className="px-2 py-1 rounded border"
              >
                {t("roles.grantFullAccess")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalPermissions(
                    Object.fromEntries(
                      ROLE_PERMISSION_MODULES.map((m) => [m, READ_ONLY]),
                    ) as any,
                  )
                }}
                className="px-2 py-1 rounded border"
              >
                {t("roles.readOnly")}
              </button>
            </div>

            <switch className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={!!(localPermissions as any).dashboard?.list}
                onChange={(e) =>
                  setLocalPermissions((prev) => ({
                    ...(prev as any),
                    dashboard: { ...((prev as any).dashboard || {}), list: e.target.checked },
                  }))
                }
              />
              <span className="text-sm">{t("roles.dashboardAccess")}</span>
            </switch>

            <div className="overflow-auto max-h-60 border rounded">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-2 text-left">{t("roles.module")}</th>
                    {ROLE_PERMISSION_ACTIONS.map((a) => (
                      <th key={a} className="p-2 text-center">
                        {t(`roles.actions.${a}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROLE_PERMISSION_MODULES.map((m) => {
                    if(m === 'dashboard') return null
                    return (
                    <tr key={m} className="border-t">
                      <td className="p-2">{t(`roles.modules.${m}`)}</td>
                      {ROLE_PERMISSION_ACTIONS.map((a) => (
                        <td key={a} className="p-2 text-center">
                          <input
                            type="checkbox"
                            checked={!!(localPermissions as any)[m]?.[a]}
                            onChange={(e) =>
                              setLocalPermissions((prev) => ({
                                ...(prev as any),
                                [m]: {
                                  ...(prev as any)[m],
                                  [a]: e.target.checked,
                                },
                              }))
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="gradient-btn px-6 py-2.5 text-sm">
              {editItem ? t("common.update") : t("common.create")}
            </button>
          </div>
        </AppForm>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        title={t("roles.deleteTitle")}
        message={t("roles.deleteConfirm", {
          name: roles?.find((r) => r.role_id === deleteId)?.role_name,
        })}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
      />
    </motion.div>
  )
}
