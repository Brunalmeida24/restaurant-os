"use client"

import { useState } from "react"
import { X, AlertTriangle } from "lucide-react"

export function JustificationModal({
  title,
  actionLabel,
  onConfirm,
  onClose,
}: {
  title: string
  actionLabel: string
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState("")

  const handleConfirm = () => {
    if (reason.trim().length < 5) return
    onConfirm(reason.trim())
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ background: "rgba(0,0,0,0.75)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "#131413", border: "1px solid #F0654A" }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={17} color="#F0654A" />
            <h2 className="text-[15px] font-bold" style={{ color: "#ECECE9" }}>
              {title}
            </h2>
          </div>
          <button onClick={onClose}>
            <X size={18} color="#4A4B47" />
          </button>
        </div>

        <p className="text-xs mb-3" style={{ color: "#87887F" }}>
          Por motivos de segurança e auditoria, é obrigatório informar o motivo desta ação.
        </p>

        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Ex: Cliente reclamou da demora, item veio errado, cortesia da casa..."
          rows={3}
          className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none resize-none"
          style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9" }}
        />

        {reason.length > 0 && reason.trim().length < 5 && (
          <p className="text-[11px] mt-1.5" style={{ color: "#F0654A" }}>
            Justificativa muito curta (mínimo 5 caracteres)
          </p>
        )}

        <div className="flex gap-2.5 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold"
            style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#87887F" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={reason.trim().length < 5}
            className="flex-1 py-2.5 rounded-lg text-[13px] font-bold"
            style={{
              background: reason.trim().length >= 5 ? "#F0654A" : "#1E1F1E",
              color: reason.trim().length >= 5 ? "#0A0B0A" : "#4A4B47",
            }}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}