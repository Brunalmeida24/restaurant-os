"use client"

import { useState } from "react"
import { Plus, Trash2, CreditCard, Zap, Banknote } from "lucide-react"

interface PaymentSplit {
  id: string
  method: string
  amount: number
}

const methods = [
  { id: "credit", label: "Crédito",  icon: CreditCard },
  { id: "debit",  label: "Débito",   icon: CreditCard },
  { id: "pix",    label: "Pix",      icon: Zap },
  { id: "cash",   label: "Dinheiro", icon: Banknote },
]

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`

export function SplitPayment({
  total,
  onComplete,
}: {
  total: number
  onComplete: (splits: PaymentSplit[], cashReceived?: number) => void
}) {
  const [splits, setSplits] = useState<PaymentSplit[]>([
    { id: crypto.randomUUID(), method: "credit", amount: total },
  ])
  const [cashReceived, setCashReceived] = useState<string>("")

  const splitTotal = splits.reduce((s, p) => s + p.amount, 0)
  const remaining = total - splitTotal
  const hasCash = splits.some(s => s.method === "cash")
  const cashSplit = splits.find(s => s.method === "cash")
  const change = hasCash && cashReceived
    ? Math.max(0, parseFloat(cashReceived || "0") - (cashSplit?.amount ?? 0))
    : 0

  const addSplit = () => {
    setSplits(prev => [...prev, { id: crypto.randomUUID(), method: "pix", amount: Math.max(0, remaining) }])
  }

  const removeSplit = (id: string) => {
    setSplits(prev => prev.filter(s => s.id !== id))
  }

  const updateSplit = (id: string, field: "method" | "amount", value: string | number) => {
    setSplits(prev =>
      prev.map(s => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const isValid = Math.abs(remaining) < 0.01 && splits.every(s => s.amount > 0)

  return (
    <div>
      <div className="flex flex-col gap-2.5 mb-3">
        {splits.map((split, i) => {
          const config = methods.find(m => m.id === split.method)!
          const Icon = config.icon
          return (
            <div key={split.id} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1">
                <Icon size={14} color="#87887F" />
                <select
                  value={split.method}
                  onChange={e => updateSplit(split.id, "method", e.target.value)}
                  className="flex-1 rounded-lg px-2.5 py-2 text-xs outline-none"
                  style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9" }}
                >
                  {methods.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                step="0.01"
                value={split.amount}
                onChange={e => updateSplit(split.id, "amount", parseFloat(e.target.value) || 0)}
                className="w-24 rounded-lg px-2.5 py-2 text-xs text-right outline-none"
                style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#34D399", fontFamily: "var(--font-mono)" }}
              />
              {splits.length > 1 && (
                <button onClick={() => removeSplit(split.id)}>
                  <Trash2 size={14} color="#F0654A" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={addSplit}
        className="flex items-center gap-1.5 text-xs mb-3.5"
        style={{ color: "#60A5FA" }}
      >
        <Plus size={13} /> Dividir em outra forma de pagamento
      </button>

      <div
        className="rounded-lg px-3.5 py-2.5 mb-3.5 flex justify-between"
        style={{ background: Math.abs(remaining) < 0.01 ? "#0F2A20" : "#3A1810" }}
      >
        <span className="text-xs" style={{ color: Math.abs(remaining) < 0.01 ? "#34D399" : "#F0654A" }}>
          {Math.abs(remaining) < 0.01 ? "Valor conferido ✓" : remaining > 0 ? "Falta alocar" : "Valor excedido"}
        </span>
        <span
          className="text-xs font-bold"
          style={{ color: Math.abs(remaining) < 0.01 ? "#34D399" : "#F0654A", fontFamily: "var(--font-mono)" }}
        >
          {fmt(Math.abs(remaining))}
        </span>
      </div>

      {hasCash && (
        <div className="mb-3.5">
          <label className="text-xs block mb-1.5" style={{ color: "#87887F" }}>
            Valor recebido em dinheiro
          </label>
          <input
            type="number"
            step="0.01"
            value={cashReceived}
            onChange={e => setCashReceived(e.target.value)}
            placeholder={fmt(cashSplit?.amount ?? 0)}
            className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none"
            style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9", fontFamily: "var(--font-mono)" }}
          />
          {change > 0 && (
            <div className="text-xs mt-1.5 font-semibold" style={{ color: "#E8B86D" }}>
              Troco: {fmt(change)}
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => onComplete(splits, hasCash ? parseFloat(cashReceived || "0") : undefined)}
        disabled={!isValid}
        className="w-full py-3.5 rounded-xl text-sm font-bold"
        style={{
          background: isValid ? "#34D399" : "#1E1F1E",
          color: isValid ? "#0A0B0A" : "#4A4B47",
        }}
      >
        Confirmar Pagamento · {fmt(total)}
      </button>
    </div>
  )
}