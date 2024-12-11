import { cookies } from "next/headers";

export async function POST(request: Request) {
  const body = await request.json();
  const res = await fetch(
    `${process.env.API_BASE_URL}/authentication/api/token/verify/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${body.accessToken}`,
      },
    }
  );

  const prefix = "authToken-"; // Произвольный префикс
  cookies()
    .getAll()
    .forEach((cookie) => {
      if (cookie.name.startsWith(`${prefix}`)) {
        cookies().delete(cookie.name);
      }
    });

  return new Response(
    JSON.stringify({
      success: res.ok,
      status: res.status,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
