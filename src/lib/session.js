import { randomUUID } from "crypto";
import cookie from "cookie";

export function getOrSetSessionId(req, res) {
  // Try cookies first
  const cookies = req.headers?.cookie ? cookie.parse(req.headers.cookie) : {};
  let sessionId = cookies?.sessionId || null;

  if (!sessionId) {
    sessionId = randomUUID();
    // Set cookie for 30 days
    const cookieStr = cookie.serialize("sessionId", sessionId, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });
    // In Next.js API routes / getServerSideProps you can set header
    if (res && res.setHeader) res.setHeader("Set-Cookie", cookieStr);
  }

  return sessionId;
}