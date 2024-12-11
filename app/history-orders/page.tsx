"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

function HistoryOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Сопоставление статусов с русскими значениями
  const statusMapping = {
    pending: "Ожидает",
    awaiting_courier: "Ожидает назначения курьера",
    courier_assigned: "Курьер назначен",
    courier_on_the_way: "Курьер в пути",
    at_location: "На месте выполнения",
    in_progress: "В работе",
    completed: "Завершён",
    cancelled: "Отменён",
    return: "Возврат",
  };

  useEffect(() => {
    if (!session?.accessToken) {
      return;
    }

    // Функция для получения завершённых заказов
    const fetchCompletedOrders = async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/orders/courier/orders/completed_orders/",
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Ошибка при получении заказов");
        }

        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedOrders();
  }, [session]);

  if (loading) {
    return <div>Загрузка заказов...</div>;
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">История заказов</h1>
      {orders.length === 0 ? (
        <p className="text-center">У вас нет завершённых заказов.</p>
      ) : (
        orders.map((order) => (
          <div
            key={order.id}
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-4"
          >
            <Link href={`/orders/${order.id}`}>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 hover:underline">
                {order.service_details.name}
              </h2>
            </Link>

            <p className="text-gray-600 mb-1">
              г {order.city}, ул {order.street}, {order.building_num}
            </p>
            <p className="text-gray-600 mb-1">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
            <p className="text-gray-600 mb-1">
              Статус:{" "}
              <span className="font-semibold">
                {statusMapping[order.status]}
              </span>
            </p>
          </div>
        ))
      )}
    </div>
  );
}

export default HistoryOrdersPage;
