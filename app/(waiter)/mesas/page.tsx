import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MesasClient } from "@/components/waiter/mesas-client"

export default async function MesasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, restaurants(name)")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  const { data: tables } = await supabase
    .from("tables")
    .select("*")
    .eq("restaurant_id", profile.restaurant_id)
    .order("number")

  return (
    <MesasClient
      waiterName={profile.name}
      tables={tables ?? []}
    />
  )
}