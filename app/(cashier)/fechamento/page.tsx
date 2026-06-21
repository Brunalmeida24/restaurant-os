import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CashierClient } from "@/components/cashier/cashier-client"
import { CashSessionGate } from "@/components/cashier/cash-session"

export default async function FechamentoPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      *,
      tables(number, location),
      profiles(name),
      order_items(*, menu_items(name, emoji))
    `)
    .eq("restaurant_id", profile.restaurant_id)
    .in("status", ["open", "in_kitchen", "ready", "served"])
    .order("opened_at")

  // Sessão de caixa ativa
  const { data: activeSession } = await supabase
    .from("cash_sessions")
    .select("*")
    .eq("restaurant_id", profile.restaurant_id)
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Total recebido nesta sessão
  let todayPaymentsTotal = 0
  if (activeSession) {
    const { data: payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("cash_session_id", activeSession.id)

    todayPaymentsTotal = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0)
  }

  return (
    <CashSessionGate
      restaurantId={profile.restaurant_id}
      cashierId={profile.id}
      activeSession={activeSession}
      todayPaymentsTotal={todayPaymentsTotal}
    >
      <CashierClient
        initialOrders={orders ?? []}
        cashierId={profile.id}
        restaurantId={profile.restaurant_id}
        cashSessionId={activeSession?.id ?? null}
      />
    </CashSessionGate>
  )
}