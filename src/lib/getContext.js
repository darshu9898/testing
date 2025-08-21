// lib/getContext.js
import { createServerClient } from '@supabase/ssr';
import prisma from './prisma';
import { getOrSetSessionId } from './session';

/**
 * getContext(req, res)
 * returns: { user, userId, sessionId, accessToken, supabase }
 *
 * - user: supabase user object (or null)
 * - userId: your internal numeric Users.userId (or null for guests)
 * - sessionId: guest session UUID cookie (always present, for guests)
 * - accessToken: supabase access token string (or null)
 * - supabase: server-bound supabase client (if you need it)
 */
export async function getContext(req, res) {
  // 1) ensure guest sessionId exists (this will set cookie if missing)
  //    getOrSetSessionId should return the sessionId (and set cookie in res when needed).
  const sessionId = getOrSetSessionId(req, res);

  // 2) create a server-bound Supabase client that reads cookies from req
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      // provide a minimal cookie getter so the client reads auth cookies
      cookies: {
        get(name) {
          return req.cookies ? req.cookies[name] : undefined;
        },
      },
    }
  );

  // 3) Try to read Supabase session & user (if logged in)
  let supabaseUser = null;
  let accessToken = null;
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session ?? null;
    supabaseUser = session?.user ?? null;
    accessToken = session?.access_token ?? null;
  } catch (err) {
    console.error('supabase.auth.getSession error:', err);
    supabaseUser = null;
    accessToken = null;
  }

  // 4) If Supabase user exists, upsert into Prisma Users and return internal numeric userId
  let userId = null; // numeric id from your Users table (Users.userId)
  if (supabaseUser) {
    try {
      // prisma.users.upsert expects the model name in lowercase (users). Matches your schema Users model.
      const upserted = await prisma.users.upsert({
        where: { supabaseId: supabaseUser.id }, // supabaseId must be UNIQUE in your schema
        update: {
          userEmail: supabaseUser.email,
          userName: supabaseUser.user_metadata?.full_name || supabaseUser.email || 'User',
          // keep updatedAt if you have it in schema; otherwise omit
          updatedAt: new Date(),
        },
        create: {
          supabaseId: supabaseUser.id,
          userEmail: supabaseUser.email,
          userName: supabaseUser.user_metadata?.full_name || supabaseUser.email || 'User',
        },
      });

      // your Prisma Users model uses userId as the PK (see schema). Pull that.
      userId = upserted.userId ?? upserted.id ?? null;
    } catch (e) {
      console.error('Prisma users.upsert error:', e);
      // don't throw — keep userId null so caller can decide how to handle
      userId = null;
    }
  }

  // 5) If not logged in, sessionId from getOrSetSessionId will be used by callers.
  //    Note: getOrSetSessionId already created or returned the cookie; we returned it above.

  return {
    user: supabaseUser,
    userId,        // numeric internal id (null for guests)
    sessionId,     // guest session cookie id (always present)
    accessToken,   // supabase access token (JWT) or null
    supabase,      // server-bound supabase client
  };
}
