import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { lat, lng } = await request.json();
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!lat || !lng || !token) {
      return NextResponse.json(
        { error: "Недостаточно данных" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `http://127.0.0.1:8000/orders/in-radius/?lat=${lat}&lng=${lng}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Ошибка получения заказов" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
