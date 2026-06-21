import { ArrowUp } from "lucide-react"

export function StatCard({
  label,
  value,
  prefix,
  delta,
  deltaPositive = true,
  emoji,
}: {
  label: string
  value: string
  prefix?: string
  delta?: string
  deltaPositive?: boolean
  emoji: string
}) {
  return (
    <div className="flex-1 min-w-[150px]">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-lg leading-none">{emoji}</span>
        <span className="text-[11px] tracking-wider font-medium" style={{ color: "#87887F" }}>
          {label.toUpperCase()}
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        {prefix && (
          <span className="text-base font-medium" style={{ color: "#87887F" }}>
            {prefix}
          </span>
        )}
        <span
          className="text-[32px] font-bold tracking-tight"
          style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}
        >
          {value}
        </span>
      </div>
      {delta && (
        <div className="flex items-center gap-1 mt-1.5">
          <ArrowUp
            size={11}
            color={deltaPositive ? "#34D399" : "#F0654A"}
            style={{ transform: deltaPositive ? "none" : "rotate(180deg)" }}
          />
          <span className="text-xs font-medium" style={{ color: deltaPositive ? "#34D399" : "#F0654A" }}>
            {delta}
          </span>
        </div>
      )}
    </div>
  )
}