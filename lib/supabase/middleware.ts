import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/signup");
  const isPublic = isAuthPage || path.startsWith("/api/meta/callback") || path === "/";
  const isApiCron = path.startsWith("/api/cron");

  if (isApiCron) return response;

  // Sem usuário → manda pro login (exceto rotas públicas)
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  // Logado entrando em login/signup → redirect baseado no role
  if (user && isAuthPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    if (profile?.role === "admin") url.pathname = "/dashboard";
    else if (profile?.role === "client") url.pathname = "/meu-relatorio";
    else url.pathname = "/aguardando-aprovacao";
    return NextResponse.redirect(url);
  }

  // Logado: validar role x rota
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "pending";
    const isAdminRoute = ["/dashboard", "/clientes", "/relatorios", "/api-meta"].some((p) =>
      path.startsWith(p),
    );
    const isClientRoute = path.startsWith("/meu-relatorio");
    const isPendingRoute = path.startsWith("/aguardando-aprovacao");

    if (role === "pending" && !isPendingRoute && path !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/aguardando-aprovacao";
      return NextResponse.redirect(url);
    }
    if (role === "client" && isAdminRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/meu-relatorio";
      return NextResponse.redirect(url);
    }
    if (role === "admin" && isClientRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return response;
}
