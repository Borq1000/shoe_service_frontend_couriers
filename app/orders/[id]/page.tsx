"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

interface OrderDetails {
  id: number;
  service_details: {
    name: string;
    description: string | null;
    price: number;
  };
  city: string;
  street: string;
  building_num: string;
  building?: string;
  floor?: string;
  apartment?: string;
  comment?: string;
  image?: string;
  created_at: string;
  courier: string | null;
}

// Функция для получения деталей заказа
async function fetchOrderDetails(
  orderId: number,
  accessToken: string
): Promise<OrderDetails> {
  const response = await fetch(
    `http://127.0.0.1:8000/api/orders/courier/orders/${orderId}/`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Ошибка загрузки деталей заказа");
  }

  return response.json();
}

// Функция для отклика на заказ
async function assignOrder(orderId: number, accessToken: string) {
  const response = await fetch(
    `http://127.0.0.1:8000/api/orders/courier/orders/${orderId}/assign/`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = "Ошибка при отклике на заказ";
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.detail || errorMessage;
    } catch (e) {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return { success: true };
}

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const orderId = parseInt(params.id);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { mutate: assign, isPending: isAssigning } = useMutation({
    mutationFn: () => {
      if (!session?.accessToken) {
        throw new Error("Необходима авторизация");
      }
      return assignOrder(orderId, session.accessToken);
    },
    onSuccess: () => {
      setSuccessMessage("Вы успешно откликнулись на заказ!");
      setTimeout(() => setSuccessMessage(null), 2000);

      setOrder((prevOrder) => {
        if (!prevOrder) return null;
        return {
          ...prevOrder,
          courier: session?.user?.email || null,
        };
      });
    },
    onError: (error: Error) => {
      setError(error.message || "Не удалось откликнуться на заказ");
      setTimeout(() => setError(null), 2000);
    },
  });

  useEffect(() => {
    if (!session?.accessToken) {
      router.push("/login");
      return;
    }

    fetchOrderDetails(orderId, session.accessToken)
      .then((data) => {
        setOrder(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки деталей заказа:", err);
        setError("Ошибка загрузки деталей заказа");
        setIsLoading(false);
      });
  }, [session, orderId, router]);

  if (isLoading) {
    return <p className="text-center">Загрузка деталей заказа...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">{error}</p>;
  }

  if (!order) {
    return <p className="text-center">Заказ не найден.</p>;
  }

  // Проверяем, откликнулся л�� уже курьер на этот заказ
  const hasAssignedCourier = order.courier !== null;

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">
        Детали заказа #{order.id}
      </h1>

      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-4 rounded-lg shadow-md">
          <p>{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-4 rounded-lg shadow-md">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {order.service_details.name}
        </h2>
        <div className="mb-4">
          <p className="text-gray-600">
            <span className="font-semibold">Описание услуги:</span>{" "}
            {order.service_details.description || "Нет описания"}
          </p>
        </div>
        <div className="mb-4">
          <p className="text-gray-600">
            <span className="font-semibold">Адрес:</span> г {order.city}, ул{" "}
            {order.street}, {order.building_num}
          </p>
        </div>
        <div className="mb-4">
          <p className="text-gray-600">
            <span className="font-semibold">Дополнительна�� информация:</span>
          </p>
          <ul className="list-disc list-inside text-gray-600">
            {order.building && <li>Корпус: {order.building}</li>}
            {order.floor && <li>Этаж: {order.floor}</li>}
            {order.apartment && <li>Квартира: {order.apartment}</li>}
          </ul>
        </div>
        {order.comment && (
          <div className="mb-4">
            <p className="text-gray-600">
              <span className="font-semibold">Комментарий клиента:</span>{" "}
              {order.comment}
            </p>
          </div>
        )}
        {order.image && (
          <div className="mb-4">
            <p className="text-gray-600 font-semibold mb-2">
              Изображение заказа:
            </p>
            <img
              src={order.image}
              alt="Изображение заказа"
              className="w-full h-64 object-cover rounded-lg"
            />
          </div>
        )}
        <div className="mb-4">
          <p className="text-gray-600">
            <span className="font-semibold">Дата создания:</span>{" "}
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="mb-6">
          <p className="text-gray-700 font-bold text-xl">
            Цена: {order.service_details.price} руб.
          </p>
        </div>

        {!hasAssignedCourier ? (
          <button
            className={`w-full py-3 text-white bg-blue-500 hover:bg-blue-600 rounded-full transition duration-300 ${
              isAssigning || successMessage
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            onClick={() => assign()}
            disabled={isAssigning || !!successMessage}
          >
            {isAssigning ? "Отправка..." : "Откликнуться на заказ"}
          </button>
        ) : (
          <p className="text-green-600 font-semibold text-center">
            Вы уже откликнулись на этот заказ
          </p>
        )}
      </div>
    </div>
  );
}
