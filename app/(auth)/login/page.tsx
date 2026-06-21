"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const roles = [
  { id: "owner",   label: "Proprietário",  icon: "📊", sub: "Dashboard & Financeiro", color: "#F59E0B" },
  { id: "waiter",  label: "Garçom",        icon: "🍽️", sub: "Mesas & Comandas",       color: "#3B82F6" },
  { id: "kitchen", label: "Cozinha",       icon: "🔥", sub: "Kitchen Display",        color: "#EF4444" },
  { id: "cashier", label: "Caixa",         icon: "💰", sub: "Pagamentos",             color: "#10B981" },
]

const roleRoutes: Record<string, string> = {
  owner:   "/dashboard",
  waiter:  "/mesas",
  kitchen: "/kds",
  cashier: "/fechamento",
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const activeColor = roles.find(r => r.id === selectedRole)?.color ?? "#F59E0B"

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) {
      toast.error("Selecione um perfil de acesso")
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error("Credenciais inválidas")
      setLoading(false)
      return
    }
    toast.success("Bem-vindo!")
    router.push(roleRoutes[selectedRole])
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#0A0A0B" }}>

      {/* Glow de fundo decorativo */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${activeColor}22 0%, transparent 70%)`,
          filter: "blur(60px)",
        }}
      />

      {/* Logo */}
      <div className="mb-10 text-center relative z-10 animate-[fadeIn_0.5s_ease]">
        <div className="flex items-center gap-3 justify-center mb-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
            style={{
              background: "linear-gradient(135deg, #F59E0B, #D97706)",
              boxShadow: "0 8px 24px rgba(245,158,11,0.35)",
            }}
          >🍽️</div>
          <span className="text-3xl font-extrabold tracking-tight" style={{ color: "#FAFAFA" }}>
            Restaurant<span style={{ color: "#F59E0B" }}>OS</span>
          </span>
        </div>
        <p className="text-sm" style={{ color: "#71717A" }}>Gestão inteligente para restaurantes</p>
      </div>

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-6 relative z-10">
        {roles.map(role => {
          const active = selectedRole === role.id
          return (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className="rounded-2xl p-4 text-left transition-all duration-200 group relative overflow-hidden"
              style={{
                background: active ? `${role.color}18` : "#141416",
                border: `1.5px solid ${active ? role.color : "#27272A"}`,
                transform: active ? "scale(1.03) translateY(-2px)" : "scale(1)",
                boxShadow: active ? `0 8px 20px ${role.color}30` : "none",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-3 transition-transform duration-200 group-hover:scale-110"
                style={{
                  background: active ? `${role.color}25` : "#1F1F23",
                }}
              >
                {role.icon}
              </div>
              <div className="font-bold text-sm" style={{ color: active ? role.color : "#FAFAFA" }}>
                {role.label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "#71717A" }}>{role.sub}</div>

              {active && (
                <div
                  className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: role.color, color: "#000" }}
                >✓</div>
              )}
            </button>
          )
        })}
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="w-full max-w-sm flex flex-col gap-3 relative z-10">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">✉️</span>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
            style={{
              background: "#141416",
              border: "1.5px solid #27272A",
              color: "#FAFAFA",
            }}
            onFocus={e => (e.target.style.borderColor = activeColor)}
            onBlur={e => (e.target.style.borderColor = "#27272A")}
          />
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">🔒</span>
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none transition-all"
            style={{
              background: "#141416",
              border: "1.5px solid #27272A",
              color: "#FAFAFA",
            }}
            onFocus={e => (e.target.style.borderColor = activeColor)}
            onBlur={e => (e.target.style.borderColor = "#27272A")}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedRole}
          className="w-full rounded-xl py-3.5 text-sm font-bold transition-all duration-200 mt-2 flex items-center justify-center gap-2"
          style={{
            background: selectedRole && !loading ? activeColor : "#1F1F23",
            color:      selectedRole && !loading ? "#000"      : "#52525B",
            cursor:     selectedRole && !loading ? "pointer"   : "not-allowed",
            boxShadow:  selectedRole && !loading ? `0 6px 20px ${activeColor}40` : "none",
          }}>
          {loading ? (
            <>
              <span className="animate-spin">⏳</span> Entrando...
            </>
          ) : (
            <>🚀 Entrar no Sistema</>
          )}
        </button>
      </form>

      <p className="mt-8 text-xs relative z-10" style={{ color: "#3F3F46" }}>
        v1.0 · Desenvolvido para gestão em tempo real
      </p>
    </div>
  )
}