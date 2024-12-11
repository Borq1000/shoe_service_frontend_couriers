import { cookies } from "next/headers";

export async function POST(request: Request) {
  const body = await request.json();
  const prefix = "authToken-"; // Произвольный префикс
  const payload = {
    refresh: cookies().get(`${prefix}refresh-token`)?.value,
  };

  const res = await fetch(
    `${process.env.API_BASE_URL}/authentication/api/token/refresh/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();

  return new Response(
    JSON.stringify({
      success: res.ok,
      status: res.status,
      data,
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
