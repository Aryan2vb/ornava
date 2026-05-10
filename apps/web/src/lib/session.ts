import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export async function getRequiredUserId() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return session.user.id;
}
