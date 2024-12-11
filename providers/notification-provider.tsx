"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface NotificationContextType {
  socket: WebSocket | null;
}

interface OrderUpdateData {
  orderId: number;
  message: string;
  title?: string;
  status?: string;
}

const NotificationContext = createContext<NotificationContextType>({
  socket: null,
});

export const useNotification = () => useContext(NotificationContext);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!session?.accessToken) {
      console.log("NotificationProvider: Нет токена доступа");
      console.log(session);
      return;
    }

    console.log("NotificationProvider: Инициализация WebSocket соединения");
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//127.0.0.1:8000/ws/notifications/?token=${session.accessToken}`;

    console.log("NotificationProvider: Попытка подключения к", wsUrl);

    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectInterval = 3000;
    let isServerError = false;

    function connect() {
      if (isServerError) {
        console.log(
          "NotificationProvider: Не пытаемся переподключиться из-за серверной ошибки"
        );
        return;
      }

      try {
        ws = new WebSocket(wsUrl);

        const connectionTimeout = setTimeout(() => {
          if (ws?.readyState !== WebSocket.OPEN) {
            console.log("NotificationProvider: Таймаут соединения");
            ws?.close();
          }
        }, 5000);

        ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log(
            "NotificationProvider: WebSocket соединение установлено успешно"
          );
          reconnectAttempts = 0;
          isServerError = false;
          setSocket(ws);
        };

        ws.onmessage = (event) => {
          try {
            const data: OrderUpdateData = JSON.parse(event.data);
            console.log(
              "NotificationProvider: Получено WebSocket сообщение:",
              data
            );

            if (data.message) {
              // Кастомный компонент уведомления с возможностью перехода к заказу
              const NotificationContent = () => (
                <div
                  className="cursor-pointer hover:text-blue-500"
                  onClick={() => {
                    if (data.orderId) {
                      router.push(`/my-orders/${data.orderId}`);
                    }
                  }}
                >
                  {data.title && (
                    <div className="font-semibold mb-1">{data.title}</div>
                  )}
                  <div>{data.message}</div>
                  {data.status && (
                    <div className="text-sm text-gray-500 mt-1">
                      Статус: {data.status}
                    </div>
                  )}
                </div>
              );

              toast.custom(
                (t) => (
                  <div
                    className={`${
                      t.visible ? "animate-enter" : "animate-leave"
                    } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                  >
                    <div className="flex-1 w-0 p-4">
                      <div className="flex items-start">
                        <div className="ml-3 flex-1">
                          <NotificationContent />
                        </div>
                      </div>
                    </div>
                    <div className="flex border-l border-gray-200">
                      <button
                        onClick={() => toast.dismiss(t.id)}
                        className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
                      >
                        Закрыть
                      </button>
                    </div>
                  </div>
                ),
                {
                  duration: 5000,
                  position: "top-right",
                }
              );
            }
          } catch (error) {
            console.error(
              "NotificationProvider: Ошибка при обработке сообщения:",
              error
            );
          }
        };

        ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error("NotificationProvider: WebSocket ошибка:", error);

          if ((error as any).target?.readyState === WebSocket.CLOSED) {
            isServerError = true;
            toast.error(
              "Ошибка на сервере уведомлений. Пожалуйста, обратитесь к администратору.",
              { duration: 5000 }
            );
          } else {
            toast.error("Ошибка подключения к серверу уведомлений", {
              duration: 3000,
            });
          }
        };

        ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log("NotificationProvider: WebSocket соединение закрыто:", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            isServerError,
          });
          setSocket(null);

          if (
            !isServerError &&
            !event.wasClean &&
            reconnectAttempts < maxReconnectAttempts
          ) {
            reconnectAttempts++;
            console.log(
              `NotificationProvider: Попытка переподключения ${reconnectAttempts} из ${maxReconnectAttempts}`
            );
            setTimeout(connect, reconnectInterval);
          } else if (reconnectAttempts >= maxReconnectAttempts) {
            console.error(
              "NotificationProvider: Превышено максимальное количество попыток переподключения"
            );
            toast.error(
              "Не удалось установить соединение с сервером уведомлений"
            );
          }
        };
      } catch (error) {
        console.error(
          "NotificationProvider: Ошибка при создании WebSocket соединения:",
          error
        );
      }
    }

    connect();

    return () => {
      if (ws?.readyState === WebSocket.OPEN) {
        console.log(
          "NotificationProvider: Закрытие WebSocket соединения при размонтировании компон��нта"
        );
        ws.close(1000, "Component unmounting");
      }
    };
  }, [session?.accessToken, router]);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
