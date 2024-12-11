"use server";

import { auth } from "@/auth";

export async function handleOrder(formData: FormData) {
  const session = await auth();

  console.log(session);

  if (!session) {
    throw new Error("You must be authenticated to perform this action");
  }

  // Добавляем ID пользователя в formData, используя session
  formData.append("customer", session.user.id);

  try {
    const response = await fetch("http://127.0.0.1:8000/api/orders/orders/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    console.log("Server response:", data); // Логирование ответа сервера

    if (!response.ok) {
      throw new Error(data.message || "Failed to create order");
    }

    return data; // Возвращает результат успешного создания заказа
  } catch (error) {
    console.error("Error while creating order:", error); // Логирование ошибки
    throw new Error(
      error.message || "An error occurred while creating the order"
    );
  }
}
