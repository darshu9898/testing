import { supabase } from "./supabase";
import prisma from "./prisma";
import { getOrSetSessionId } from "./session";

export async function getContext(req, res) {
  // Ensure a sessionId exists for guests
  const sessionId = getOrSetSessionId(req, res);

  // Try to read Supabase session token (cookie-based)
  const accessToken = req.cookies?.["sb-access-token"] || null;

  let supabaseUser = null;
  let userId = null; // your internal Users.userId

  if (accessToken) {
    try {
      const { data } = await supabase.auth.getUser(accessToken);
      supabaseUser = data?.user || null;
    } catch (err) {
      supabaseUser = null;
    }
  }

  if (supabaseUser) {
    // Upsert user in Prisma by supabaseId
    const upserted = await prisma.users.upsert({
      where: { supabaseId: supabaseUser.id },
      update: {
        userEmail: supabaseUser.email,
        userName: supabaseUser.user_metadata?.full_name || supabaseUser.email || "User",
      },
      create: {
        supabaseId: supabaseUser.id,
        userEmail: supabaseUser.email,
        userName: supabaseUser.user_metadata?.full_name || supabaseUser.email || "User",
      },
    });

    userId = upserted.userId;
  }

  return { userId, sessionId, supabaseUser };
}