"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X, UserPlus } from "lucide-react"

interface Employee {
  id: string
  name: string
  role: string
  active: boolean
}

const roleLabels: Record<string, { label: string; color: string; bg: string }> = {
  owner:   { label: "Proprietário", color: "#34D399", bg: "#0F2A20" },
  waiter:  { label: "Garçom",       color: "#60A5FA", bg: "#102540" },
  cashier: { label: "Caixa",        color: "#E8B86D", bg: "#3D2305" },
  cook:    { label: "Cozinha",      color: "#F0654A", bg: "#3A1810" },
}

export function EquipeClient({ initialEmployees }: { initialEmployees: Employee[] }) {
  const router = useRouter()
  const [employees, setEmployees] = useState(initialEmployees)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "waiter" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar funcionário")
        setSubmitting(false)
        return
      }

      setEmployees(prev => [...prev, { id: data.userId, name: form.name, role: form.role, active: true }])
      setForm({ name: "", email: "", password: "", role: "waiter" })
      setShowForm(false)
      router.refresh()
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex-1 p-7 px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-[19px] font-bold tracking-tight" style={{ color: "#ECECE9" }}>
            Equipe
          </h1>
          <p className="text-xs mt-1" style={{ color: "#4A4B47" }}>
            {employees.length} {employees.length === 1 ? "pessoa" : "pessoas"} cadastradas
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold"
          style={{ background: "#34D399", color: "#0A0B0A" }}
        >
          <UserPlus size={15} /> Novo Funcionário
        </button>
      </div>

      {/* Lista de funcionários */}
      <div className="rounded-[10px]" style={{ background: "#1A1B1A", border: "1px solid #26272566" }}>
        {employees.map((emp, i) => {
          const rc = roleLabels[emp.role] ?? roleLabels.waiter
          return (
            <div
              key={emp.id}
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: i < employees.length - 1 ? "1px solid #1E1F1E" : "none" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: rc.bg, color: rc.color }}
                >
                  {emp.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <span className="text-sm font-medium" style={{ color: "#ECECE9" }}>
                  {emp.name}
                </span>
              </div>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ background: rc.bg, color: rc.color }}
              >
                {rc.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Modal de cadastro */}
      {showForm && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "#131413", border: "1px solid #262725" }}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold" style={{ color: "#ECECE9" }}>
                Novo Funcionário
              </h2>
              <button onClick={() => setShowForm(false)}>
                <X size={18} color="#4A4B47" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Nome completo"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                className="rounded-lg px-3.5 py-2.5 text-sm outline-none"
                style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9" }}
              />
              <input
                type="email"
                placeholder="E-mail"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="rounded-lg px-3.5 py-2.5 text-sm outline-none"
                style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9" }}
              />
              <input
                type="password"
                placeholder="Senha temporária"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                minLength={6}
                className="rounded-lg px-3.5 py-2.5 text-sm outline-none"
                style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9" }}
              />
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="rounded-lg px-3.5 py-2.5 text-sm outline-none"
                style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9" }}
              >
                <option value="waiter">Garçom</option>
                <option value="cashier">Caixa</option>
                <option value="cook">Cozinha</option>
              </select>

              {error && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "#3A1810", color: "#F0654A" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg py-2.5 text-sm font-bold mt-1"
                style={{ background: "#34D399", color: "#0A0B0A", opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? "Criando..." : "Cadastrar Funcionário"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}