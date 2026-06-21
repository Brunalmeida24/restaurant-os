import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // 1. Confirma que quem está chamando é um owner autenticado
  const supabaseServer = await createServerClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("role, restaurant_id")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "owner") {
    return NextResponse.json({ error: "Apenas o proprietário pode cadastrar funcionários" }, { status: 403 })
  }

  // 2. Lê os dados do novo funcionário
  const { name, email, password, role } = await request.json()

  if (!name || !email || !password || !role) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
  }

  if (!["waiter", "cashier", "cook"].includes(role)) {
    return NextResponse.json({ error: "Role inválida" }, { status: 400 })
  }

  // 3. Usa a service role key para criar o usuário no Auth
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (createError || !newUser.user) {
    return NextResponse.json({ error: createError?.message ?? "Erro ao criar usuário" }, { status: 400 })
  }

  // 4. Cria o perfil vinculado
  const { error: profileError } = await supabaseAdmin.from("profiles").insert({
    id: newUser.user.id,
    restaurant_id: profile.restaurant_id,
    name,
    role,
  })

  if (profileError) {
    // Se falhar ao criar o perfil, remove o usuário criado (rollback)
    await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, userId: newUser.user.id })
}