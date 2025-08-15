// context.js
import { getServerSession } from "next-auth";
import { authOptions } from "../pages/api/auth/[...nextauth]";

export async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  console.log(session?.user); // includes id, name, email
}
