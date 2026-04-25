"use server";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import { buildAuthUrl } from "@/lib/meta/api";

/** Gera URL de OAuth para conectar a conta Meta de um cliente. State = clientId:nonce */
export async function getMetaAuthUrlAction(clientId: string) {
  await requireAdmin();
  const nonce = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(`meta_oauth_${nonce}`, clientId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  const state = `${clientId}:${nonce}`;
  return { url: buildAuthUrl(process.env.META_REDIRECT_URI!, state) };
}
