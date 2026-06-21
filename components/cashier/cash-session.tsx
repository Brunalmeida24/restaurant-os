"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Lock, Unlock, LogOut } from "lucide-react"

interface CashSessionData {
  id: string
  opening_amount: number
  opened_at: string
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`

export function CashSessionGate({
  restaurantId,
  cashierId,
  activeSession,
  todayPaymentsTotal,
  children,
}: {
  restaurantId: string
  cashierId: string
  activeSession: CashSessionData | null
  todayPaymentsTotal: number
  children: React.ReactNode
}) {
  const supabase = createClient()
  const [session, setSession] = useState(activeSession)
  const [openingAmount, setOpeningAmount] = useState("")
  const [closing, setClosing] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const openSession = async () => {
    setLoading(true)
    const { data } = await supabase
      .from("cash_sessions")
      .insert({
        restaurant_id: restaurantId,
        cashier_id: cashierId,
        opening_amount: parseFloat(openingAmount || "0"),
        status: "open",
      })
      .select()
      .single()

    if (data) setSession(data)
    setLoading(false)
  }

  const closeSession = async () => {
    if (!session) return
    setLoading(true)
    const expectedTotal = session.opening_amount + todayPaymentsTotal

    await supabase
      .from("cash_sessions")
      .update({
        status: "closed",
        closing_amount: expectedTotal,
        closed_at: new Date().toISOString(),
      })
      .eq("id", session.id)

    setSession(null)
    setClosing(false)
    setLoading(false)
    window.location.reload()
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6" style={{ background: "#0A0B0A" }}>
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 flex items-center gap-1.5 text-xs"
          style={{ color: "#4A4B47" }}
        >
          <LogOut size={13} /> Sair
        </button>

        <div
          className="w-full max-w-xs rounded-2xl p-6"
          style={{ background: "#1A1B1A", border: "1px solid #262725" }}
        >
          <div className="flex items-center gap-2.5 mb-1">
            <Unlock size={18} color="#34D399" />
            <h2 className="text-[15px] font-bold" style={{ color: "#ECECE9" }}>
              Abrir Caixa
            </h2>
          </div>
          <p className="text-xs mb-4" style={{ color: "#4A4B47" }}>
            Informe o valor inicial em dinheiro na gaveta
          </p>
          <input
            type="number"
            step="0.01"
            value={openingAmount}
            onChange={e => setOpeningAmount(e.target.value)}
            placeholder="0,00"
            className="w-full rounded-lg px-3.5 py-3 text-base outline-none mb-3.5 text-center"
            style={{ background: "#0A0B0A", border: "1px solid #262725", color: "#34D399", fontFamily: "var(--font-mono)" }}
          />
          <button
            onClick={openSession}
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-bold"
            style={{ background: "#34D399", color: "#0A0B0A", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Abrindo..." : "Abrir Caixa e Começar"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div
        className="flex justify-between items-center px-4 py-2"
        style={{ background: "#0F2A20", borderBottom: "1px solid #1E1F1E" }}
      >
        <span className="text-[11px]" style={{ color: "#34D399" }}>
          Caixa aberto · Fundo inicial {fmt(session.opening_amount)}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setClosing(true)}
            className="flex items-center gap-1.5 text-[11px] font-semibold"
            style={{ color: "#E8B86D" }}
          >
            <Lock size={11} /> Fechar Turno
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[11px] font-semibold"
            style={{ color: "#87887F" }}
          >
            <LogOut size={11} /> Sair
          </button>
        </div>
      </div>

      {children}

      {closing && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.75)" }}
        >
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#131413", border: "1px solid #262725" }}>
            <h2 className="text-[15px] font-bold mb-4" style={{ color: "#ECECE9" }}>
              Fechar Turno do Caixa
            </h2>
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex justify-between text-xs">
                <span style={{ color: "#87887F" }}>Fundo inicial</span>
                <span style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}>{fmt(session.opening_amount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "#87887F" }}>Total recebido no turno</span>
                <span style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}>{fmt(todayPaymentsTotal)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: "1px solid #1E1F1E" }}>
                <span style={{ color: "#ECECE9" }}>Total esperado na gaveta</span>
                <span style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}>
                  {fmt(session.opening_amount + todayPaymentsTotal)}
                </span>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setClosing(false)}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold"
                style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#87887F" }}
              >
                Voltar
              </button>
              <button
                onClick={closeSession}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-bold"
                style={{ background: "#E8B86D", color: "#0A0B0A", opacity: loading ? 0.6 : 1 }}
              >
                {loading ? "Fechando..." : "Confirmar Fechamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}