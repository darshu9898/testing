import { getServerSession } from "next-auth";
import { authOptions } from "../pages/api/auth/[...nextauth]";

export async function getContext(req, res) {
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id || null;
  const sessionId = req.cookies?.sessionId || null;
  return { userId, sessionId };
}
