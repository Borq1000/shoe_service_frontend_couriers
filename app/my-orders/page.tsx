"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";

const BACKEND_URL = "http://127.0.0.1:8000";

// Типы и интерфейсы
interface ServiceDetails {
  id: number;
  name: string;
  description: string;
  price: string;
}

interface Order {
  id: number;
  service_details: ServiceDetails;
  status: OrderStatus;
  city: string;
  street: string;
  building_num: string;
  created_at: string;
  status_changed_at: string;
}

type OrderStatus =
  | "pending"
  | "courier_assigned"
  | "courier_on_the_way"
  | "at_location"
  | "courier_on_the_way_to_master"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "return";

// Константы
const STATUS_MAPPING: Record<OrderStatus, string> = {
  pending: "Ожидает",
  courier_assigned: "Курьер назначен",
  courier_on_the_way: "Курьер в пути",
  at_location: "На месте выполнения",
  courier_on_the_way_to_master: "Курьер в пути к мастеру",
  in_progress: "В работе",
  completed: "Завершён",
  cancelled: "Отменён",
  return: "Возврат",
};

const STATUS_FLOW: Record<OrderStatus, OrderStatus | undefined> = {
  courier_assigned: "courier_on_the_way",
  courier_on_the_way: "at_location",
  at_location: "courier_on_the_way_to_master",
  courier_on_the_way_to_master: undefined,
  pending: undefined,
  in_progress: undefined,
  completed: undefined,
  cancelled: undefined,
  return: undefined,
};

const ALLOWED_PREVIOUS_STATUS: Record<OrderStatus, OrderStatus | undefined> = {
  courier_on_the_way: "courier_assigned",
  at_location: "courier_on_the_way",
  courier_on_the_way_to_master: "at_location",
  courier_assigned: undefined,
  pending: undefined,
  in_progress: undefined,
  completed: undefined,
  cancelled: undefined,
  return: undefined,
};

// Статусы, при которых можно отменить заказ
const CANCELLABLE_STATUSES: OrderStatus[] = [
  "pending",
  "courier_assigned",
  "courier_on_the_way",
  "at_location",
];

// API функции
async function unassignOrder(orderId: number, accessToken: string) {
  const response = await fetch(
    `${BACKEND_URL}/api/orders/courier/orders/${orderId}/unassign/`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Ошибка при отмене отклика на заказ");
  }

  return response.json();
}

async function updateOrderStatus(
  orderId: number,
  accessToken: string,
  newStatus: OrderStatus
) {
  const response = await fetch(
    `${BACKEND_URL}/api/orders/courier/orders/${orderId}/update_status/`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Ошибка при обновлении статуса заказа");
  }

  return response.json();
}

// Компонент для отображения сообщения
interface MessageProps {
  message: string;
  type: "success" | "error";
}

const Message: React.FC<MessageProps> = ({ message, type }) => {
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  return (
    <div className={`${bgColor} text-white p-4 rounded mb-4 animate-fade-in`}>
      {message}
    </div>
  );
};

// Компонент карточки заказа
interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: number, newStatus: OrderStatus) => void;
  onUnassign: (orderId: number) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStatusUpdate,
  onUnassign,
}) => {
  const { nextStatusInfo, previousStatusInfo } = getStatusInfo(order);
  const canCancel = CANCELLABLE_STATUSES.includes(order.status);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-4 relative group">
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
        <span className="font-semibold">{STATUS_MAPPING[order.status]}</span>
      </p>

      <div className="flex justify-end mt-4 space-x-2">
        {previousStatusInfo && (
          <button
            className={`px-4 py-2 rounded-full text-white ${previousStatusInfo.buttonColor} transition`}
            onClick={() =>
              onStatusUpdate(order.id, previousStatusInfo.previousStatus)
            }
          >
            {previousStatusInfo.buttonText}
          </button>
        )}
        {nextStatusInfo && (
          <button
            className={`px-4 py-2 rounded-full text-white ${nextStatusInfo.buttonColor} transition`}
            onClick={() => onStatusUpdate(order.id, nextStatusInfo.nextStatus)}
          >
            {nextStatusInfo.buttonText}
          </button>
        )}
        {canCancel && (
          <button
            className="px-4 py-2 rounded-full text-white bg-red-500 hover:bg-red-600 transition"
            onClick={() => {
              if (
                window.confirm(
                  "Вы уверены, что хотите отменить отклик на заказ?"
                )
              ) {
                onUnassign(order.id);
              }
            }}
            title={
              canCancel
                ? "Отменить отклик на заказ"
                : "Нельзя отменить заказ на данном этапе"
            }
          >
            Отменить отклик
          </button>
        )}
      </div>

      {!canCancel && order.status !== "completed" && (
        <div className="mt-2 text-sm text-gray-500 italic">
          * Отмена заказа недоступна на данном этапе
        </div>
      )}
    </div>
  );
};

// Функция для определения информации о статусах
function getStatusInfo(order: Order) {
  const currentStatus = order.status;
  const statusChangedAt = order.status_changed_at;

  if (!statusChangedAt) {
    console.log("status_changed_at is missing");
    return { nextStatusInfo: null, previousStatusInfo: null };
  }

  const statusChangedDate = new Date(statusChangedAt);
  if (isNaN(statusChangedDate.getTime())) {
    console.error(
      `Неверный формат даты в status_changed_at: ${statusChangedAt}`
    );
    return { nextStatusInfo: null, previousStatusInfo: null };
  }

  const timeSinceChange = Date.now() - statusChangedDate.getTime();
  const allowedTime = 10 * 60 * 1000; // 10 минут

  const nextStatus = STATUS_FLOW[currentStatus];
  const previousStatus =
    timeSinceChange <= allowedTime
      ? ALLOWED_PREVIOUS_STATUS[currentStatus]
      : undefined;

  const nextStatusInfo = nextStatus
    ? {
        nextStatus,
        buttonText: `Установить статус "${STATUS_MAPPING[nextStatus]}"`,
        buttonColor: "bg-blue-500 hover:bg-blue-600",
      }
    : null;

  const previousStatusInfo = previousStatus
    ? {
        previousStatus,
        buttonText: `Вернуться к статусу "${STATUS_MAPPING[previousStatus]}"`,
        buttonColor: "bg-gray-500 hover:bg-gray-600",
      }
    : null;

  return { nextStatusInfo, previousStatusInfo };
}

// Основной компонент страницы
function MyOrdersPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchAssignedOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${BACKEND_URL}/api/orders/courier/orders/assigned_orders/`,
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              Accept: "application/json",
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
        setMessage({
          text:
            error instanceof Error
              ? error.message
              : "Ошибка при загрузке заказов",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedOrders();
  }, [session]);

  const { mutate: unassign } = useMutation({
    mutationFn: ({ orderId }: { orderId: number }) =>
      unassignOrder(orderId, session?.accessToken as string),
    onSuccess: (_, variables) => {
      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== variables.orderId)
      );
      setMessage({
        text: "Вы успешно отменили отклик на заказ!",
        type: "success",
      });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      console.error(error);
      setMessage({
        text: error.message || "Не удалось отменить отклик на заказ",
        type: "error",
      });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({
      orderId,
      newStatus,
    }: {
      orderId: number;
      newStatus: OrderStatus;
    }) => updateOrderStatus(orderId, session?.accessToken as string, newStatus),
    onSuccess: (data, variables) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === variables.orderId
            ? {
                ...order,
                status: data.status,
                status_changed_at: data.status_changed_at,
              }
            : order
        )
      );
      setMessage({ text: "Статус заказа успешно обновлён!", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      console.error(error);
      setMessage({
        text: error.message || "Не удалось обновить статус заказа",
        type: "error",
      });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">Заказы в работе</h1>

      {message && <Message message={message.text} type={message.type} />}

      {orders.length === 0 ? (
        <p className="text-center text-gray-500">У вас нет активных заказов.</p>
      ) : (
        orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onStatusUpdate={(orderId, newStatus) =>
              updateStatus({ orderId, newStatus })
            }
            onUnassign={(orderId) => unassign({ orderId })}
          />
        ))
      )}
    </div>
  );
}

export default MyOrdersPage;
