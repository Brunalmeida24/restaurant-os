"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus, X, Pencil, Trash2, Armchair } from "lucide-react"

interface TableData {
  id: string
  number: number
  capacity: number
  location: string | null
  status: string
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  free:     { label: "Livre",     color: "#34D399", bg: "#0F2A20" },
  occupied: { label: "Ocupada",   color: "#F0654A", bg: "#3A1810" },
  reserved: { label: "Reservada", color: "#60A5FA", bg: "#102540" },
  cleaning: { label: "Limpeza",   color: "#87887F", bg: "#1E1F1E" },
}

const commonLocations = ["Salão", "Varanda", "Bar", "Área Externa", "Mezanino"]

export function MesasConfigClient({
  initialTables,
  restaurantId,
}: {
  initialTables: TableData[]
  restaurantId: string
}) {
  const router = useRouter()
  const supabase = createClient()

  const [tables, setTables] = useState(initialTables)
  const [editingTable, setEditingTable] = useState<TableData | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TableData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    number: "",
    capacity: "4",
    location: "Salão",
  })

  const resetForm = () => setForm({ number: "", capacity: "4", location: "Salão" })

  const openEdit = (table: TableData) => {
    setEditingTable(table)
    setForm({
      number: String(table.number),
      capacity: String(table.capacity),
      location: table.location ?? "Salão",
    })
    setError(null)
  }

  const openCreate = () => {
    setCreating(true)
    resetForm()
    setError(null)
  }

  const closeModal = () => {
    setEditingTable(null)
    setCreating(false)
    resetForm()
    setError(null)
  }

  const saveTable = async () => {
    const numberValue = parseInt(form.number)
    if (!numberValue || numberValue <= 0) {
      setError("Informe um número de mesa válido")
      return
    }

    const duplicate = tables.find(
      t => t.number === numberValue && t.id !== editingTable?.id
    )
    if (duplicate) {
      setError(`Já existe uma mesa número ${numberValue}`)
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      number: numberValue,
      capacity: parseInt(form.capacity) || 4,
      location: form.location,
    }

    if (editingTable) {
      const { error: updateError } = await supabase
        .from("tables")
        .update(payload)
        .eq("id", editingTable.id)

      if (updateError) {
        setError("Erro ao salvar. Tente novamente.")
        setSaving(false)
        return
      }

      setTables(prev =>
        prev
          .map(t => (t.id === editingTable.id ? { ...t, ...payload } : t))
          .sort((a, b) => a.number - b.number)
      )
    } else {
      const { data, error: insertError } = await supabase
        .from("tables")
        .insert({ ...payload, restaurant_id: restaurantId, status: "free" })
        .select()
        .single()

      if (insertError || !data) {
        setError("Erro ao criar mesa. Tente novamente.")
        setSaving(false)
        return
      }

      setTables(prev => [...prev, data].sort((a, b) => a.number - b.number))
    }

    setSaving(false)
    closeModal()
    router.refresh()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    if (deleteTarget.status === "occupied") {
      setError("Não é possível excluir uma mesa ocupada. Feche a comanda primeiro.")
      return
    }

    setSaving(true)
    const { error: deleteError } = await supabase
      .from("tables")
      .delete()
      .eq("id", deleteTarget.id)

    if (deleteError) {
      setError("Erro ao excluir mesa.")
      setSaving(false)
      return
    }

    setTables(prev => prev.filter(t => t.id !== deleteTarget.id))
    setDeleteTarget(null)
    setSaving(false)
    router.refresh()
  }

  const groupedByLocation = tables.reduce((acc, table) => {
    const loc = table.location ?? "Sem local"
    if (!acc[loc]) acc[loc] = []
    acc[loc].push(table)
    return acc
  }, {} as Record<string, TableData[]>)

  return (
    <div className="flex-1 p-7 px-8">
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-[19px] font-bold tracking-tight" style={{ color: "#ECECE9" }}>
            Mesas
          </h1>
          <p className="text-xs mt-1" style={{ color: "#4A4B47" }}>
            {tables.length} {tables.length === 1 ? "mesa cadastrada" : "mesas cadastradas"}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold"
          style={{ background: "#34D399", color: "#0A0B0A" }}
        >
          <Plus size={15} /> Nova Mesa
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {Object.entries(groupedByLocation).map(([location, locTables]) => (
          <div key={location}>
            <h2 className="text-sm font-bold mb-3" style={{ color: "#ECECE9" }}>
              {location}
            </h2>
            <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
              {locTables.map(table => {
                const sc = statusConfig[table.status] ?? statusConfig.free
                return (
                  <div
                    key={table.id}
                    className="rounded-xl p-3.5"
                    style={{ background: "#1A1B1A", border: "1px solid #262725" }}
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <span
                        className="text-xl font-bold"
                        style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}
                      >
                        {String(table.number).padStart(2, "0")}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{ background: sc.bg, color: sc.color }}
                      >
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs mb-3" style={{ color: "#4A4B47" }}>
                      <Armchair size={12} /> {table.capacity} lugares
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(table)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold"
                        style={{ background: "#131413", border: "1px solid #262725", color: "#87887F" }}
                      >
                        <Pencil size={11} /> Editar
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(table); setError(null) }}
                        className="flex items-center justify-center px-2.5 py-1.5 rounded-lg"
                        style={{ background: "#131413", border: "1px solid #262725" }}
                      >
                        <Trash2 size={13} color="#F0654A" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {tables.length === 0 && (
          <div
            className="rounded-xl p-8 text-center text-sm"
            style={{ background: "#131413", border: "1px dashed #262725", color: "#4A4B47" }}
          >
            Nenhuma mesa cadastrada ainda. Clique em &quot;Nova Mesa&quot; para começar.
          </div>
        )}
      </div>

      {/* Modal: criar/editar mesa */}
      {(editingTable || creating) && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#131413", border: "1px solid #262725" }}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[15px] font-bold" style={{ color: "#ECECE9" }}>
                {editingTable ? "Editar Mesa" : "Nova Mesa"}
              </h2>
              <button onClick={closeModal}>
                <X size={18} color="#4A4B47" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-xs block mb-1.5" style={{ color: "#87887F" }}>
                  Número da mesa
                </label>
                <input
                  type="number"
                  placeholder="Ex: 11"
                  value={form.number}
                  onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
                  style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9", fontFamily: "var(--font-mono)" }}
                />
              </div>

              <div>
                <label className="text-xs block mb-1.5" style={{ color: "#87887F" }}>
                  Capacidade (lugares)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 4"
                  value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
                  style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9" }}
                />
              </div>

              <div>
                <label className="text-xs block mb-1.5" style={{ color: "#87887F" }}>
                  Localização
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {commonLocations.map(loc => (
                    <button
                      key={loc}
                      onClick={() => setForm(f => ({ ...f, location: loc }))}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
                      style={{
                        background: form.location === loc ? "#0F2A20" : "#1A1B1A",
                        border: `1px solid ${form.location === loc ? "#34D399" : "#262725"}`,
                        color: form.location === loc ? "#34D399" : "#87887F",
                      }}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Ou digite um local personalizado"
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
                  style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9" }}
                />
              </div>

              {error && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "#3A1810", color: "#F0654A" }}>
                  {error}
                </div>
              )}

              <button
                onClick={saveTable}
                disabled={saving}
                className="rounded-lg py-2.5 text-sm font-bold mt-1.5"
                style={{ background: "#34D399", color: "#0A0B0A", opacity: saving ? 0.6 : 1 }}
              >
                {saving ? "Salvando..." : editingTable ? "Salvar Alterações" : "Criar Mesa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: confirmar exclusão */}
      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#131413", border: "1px solid #F0654A" }}>
            <h2 className="text-[15px] font-bold mb-2" style={{ color: "#ECECE9" }}>
              Excluir Mesa {String(deleteTarget.number).padStart(2, "0")}?
            </h2>
            <p className="text-xs mb-4" style={{ color: "#87887F" }}>
              Essa ação não pode ser desfeita. A mesa será removida permanentemente do sistema.
            </p>

            {error && (
              <div className="text-xs px-3 py-2 rounded-lg mb-3.5" style={{ background: "#3A1810", color: "#F0654A" }}>
                {error}
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                onClick={() => { setDeleteTarget(null); setError(null) }}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold"
                style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#87887F" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-bold"
                style={{ background: "#F0654A", color: "#0A0B0A", opacity: saving ? 0.6 : 1 }}
              >
                {saving ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}