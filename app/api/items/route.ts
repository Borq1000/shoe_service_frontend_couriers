import { auth } from "@/auth";

export async function GET() {
  const session = await auth();

  const res = await fetch("http://127.0.0.1:8000/profiles/me/", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
  const data = await res.json();

  return Response.json({ data });
}
