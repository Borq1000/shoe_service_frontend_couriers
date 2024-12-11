# Задачи для фронтенда клиентского приложения

## Проверка существующего функционала

1. **Создание заказов**
   - [x] Проверить корректность отправки POST запроса на `/api/orders/client/orders/`
   - [x] Убедиться, что все необходимые данные передаются в запросе
   - [x] Проверить обработку ответа от сервера

## Необходимые доработки

1. **Добавление NotificationProvider**

   - [ ] Создать компонент для работы с WebSocket:

     ```typescript
     // providers/notification-provider.tsx
     "use client";

     import { createContext, useContext, useEffect, useState } from "react";
     import { useSession } from "next-auth/react";
     import toast from "react-hot-toast";

     interface NotificationContextType {
       socket: WebSocket | null;
     }

     const NotificationContext = createContext<NotificationContextType>({
       socket: null,
     });

     export function NotificationProvider({
       children,
     }: {
       children: React.ReactNode;
     }) {
       const { data: session } = useSession();
       const [socket, setSocket] = useState<WebSocket | null>(null);

       useEffect(() => {
         if (!session?.accessToken) return;

         const wsProtocol =
           window.location.protocol === "https:" ? "wss:" : "ws:";
         const wsUrl = `${wsProtocol}//127.0.0.1:8000/ws/notifications/?token=${session.accessToken}`;

         const ws = new WebSocket(wsUrl);

         ws.onopen = () => {
           console.log("WebSocket соединение установлено");
           setSocket(ws);
         };

         ws.onmessage = (event) => {
           const data = JSON.parse(event.data);
           toast(data.message, {
             duration: 4000,
             position: "top-right",
             icon: "🔔",
           });
         };

         return () => {
           ws.close();
         };
       }, [session]);

       return (
         <NotificationContext.Provider value={{ socket }}>
           {children}
         </NotificationContext.Provider>
       );
     }
     ```

2. **Подключение NotificationProvider**

   - [ ] Добавить провайдер в корневой layout:

     ```typescript
     // app/layout.tsx
     import { NotificationProvider } from "@/providers/notification-provider";

     export default function RootLayout({
       children,
     }: {
       children: React.ReactNode;
     }) {
       return (
         <html>
           <body>
             <NotificationProvider>{children}</NotificationProvider>
           </body>
         </html>
       );
     }
     ```

3. **Компонент для отображения уведомлений**

   - [ ] Добавить компонент для отображения истории уведомлений:

     ```typescript
     // components/NotificationsList.tsx
     "use client";

     import { useEffect, useState } from "react";
     import { useSession } from "next-auth/react";

     interface Notification {
       id: number;
       type: string;
       message: string;
       created_at: string;
       is_read: boolean;
     }

     export function NotificationsList() {
       const { data: session } = useSession();
       const [notifications, setNotifications] = useState<Notification[]>([]);

       useEffect(() => {
         if (!session?.accessToken) return;

         fetch("http://127.0.0.1:8000/api/notifications/", {
           headers: {
             Authorization: `Bearer ${session.accessToken}`,
           },
         })
           .then((res) => res.json())
           .then(setNotifications)
           .catch(console.error);
       }, [session]);

       return (
         <div className="space-y-4">
           {notifications.map((notification) => (
             <div
               key={notification.id}
               className={`p-4 rounded-lg ${
                 notification.is_read ? "bg-gray-100" : "bg-blue-50"
               }`}
             >
               <p className="font-medium">{notification.message}</p>
               <p className="text-sm text-gray-500">
                 {new Date(notification.created_at).toLocaleString()}
               </p>
             </div>
           ))}
         </div>
       );
     }
     ```

4. **Улучшение обработки WebSocket**

   - [ ] Добавить обработку ошибок соединения
   - [ ] Реализовать автоматическое переподключение
   - [ ] Добавить индикато�� состояния соединения

5. **Страница уведомлений**

   - [ ] Создать страницу для просмотра всех уведомлений:

     ```typescript
     // app/notifications/page.tsx
     import { NotificationsList } from "@/components/NotificationsList";

     export default function NotificationsPage() {
       return (
         <div className="container mx-auto py-8">
           <h1 className="text-2xl font-bold mb-6">Уведомления</h1>
           <NotificationsList />
         </div>
       );
     }
     ```

6. **Индикатор новых уведомлений**
   - [ ] Добавить счетчик непрочитанных уведомлений в header
   - [ ] Реализовать обновление счетчика при получении новых уведомлений
   - [ ] Добавить возможность отметить уведомления как прочитанные

## Тестирование

1. **Функциональное тестирование**

   - [ ] Проверить получение уведомлений при изменении статуса заказа
   - [ ] Протестировать отображение toast-уведомлений
   - [ ] Проверить ра��оту истории уведомлений

2. **WebSocket тестирование**

   - [ ] Проверить установку соединения
   - [ ] Протестировать переподключение при потере связи
   - [ ] Проверить корректное закрытие соединения

3. **UI тестирование**
   - [ ] Проверить отображение уведомлений на разных устройствах
   - [ ] Протестировать доступность интерфейса
   - [ ] Проверить анимации и переходы

## Оптимизация

1. **Производительность**

   - [ ] Оптимизировать рендеринг списка уведомлений
   - [ ] Добавить виртуализацию для большого количества уведомлений
   - [ ] Реализовать кэширование истории уведомлений

2. **UX улучшения**
   - [ ] Добавить звуковые уведомления (опционально)
   - [ ] Реализовать фильтрацию уведомлений по типу
   - [ ] Добавить возможность настройки уведомлений

## Документация

1. **Компоненты**

   - [ ] Документировать NotificationProvider
   - [ ] Описать доступные хуки и контекст
   - [ ] Добавить примеры использования

2. **Интеграция**
   - [ ] Описать процесс подключения уведомлений
   - [ ] Добавить инструкции по тестированию
   - [ ] Документировать форматы сообщений

# Реализация системы уведомлений для клиентского приложения

## Описание

Необходимо реализовать систему уведомлений в реальном времени для клиентского приложения, аналогичную той, что реализована в приложении для курьеров. Система должна информировать клиентов об изменениях статуса их заказов и других важных событиях.

## Технические требования

### 1. Настройка WebSocket соединения

```typescript
// providers/notification-provider.tsx
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
```

### 2. Типы уведомлений для клиентов

- Изменение статуса заказа:
  - Курьер принял заказ
  - Курьер в пути
  - Заказ доставлен в мастерскую
  - Начат ремонт
  - Ремонт завершен
  - Заказ готов к возврату
  - Курьер везет заказ обратно
  - Заказ доставлен клиенту

### 3. Компонент уведомлений

```typescript
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
      return;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//127.0.0.1:8000/ws/notifications/?token=${session.accessToken}`;

    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectInterval = 3000;
    let isServerError = false;

    function connect() {
      // ... WebSocket connection logic ...

      ws.onmessage = (event) => {
        try {
          const data: OrderUpdateData = JSON.parse(event.data);

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
              <div className="font-semibold">{data.title}</div>
              <div>{data.message}</div>
              {data.status && (
                <div className="text-sm text-gray-500">
                  Статус: {data.status}
                </div>
              )}
            </div>
          );

          toast.custom(
            (t) => (
              <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto">
                <div className="p-4">
                  <NotificationContent />
                </div>
                <div className="border-t border-gray-200 p-2 text-right">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="text-sm text-gray-600 hover:text-gray-800"
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
        } catch (error) {
          console.error("Ошибка при обработке уведомления:", error);
        }
      };
    }

    connect();

    return () => {
      if (ws?.readyState === WebSocket.OPEN) {
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
```

### 4. Интеграция с бэкендом

1. WebSocket эндпоинт должен фильтровать уведомления по роли пользователя (client)
2. Формат сообщений от сервера:

```json
{
  "orderId": 123,
  "title": "Статус заказа изменен",
  "message": "Ваш заказ принят курьером",
  "status": "awaiting_courier"
}
```

### 5. Необходимые изменения в UI

1. Добавить страницу детального просмотра заказа:

   - Создать компонент `OrderDetails`
   - Реализовать маршрут `/my-orders/[id]`
   - Добавить отображение истории статусов

2. Обновить компонент `MyOrders`:
   - Добавить автоматическое обновление списка при получении уведомления
   - Добавить индикаторы новых статусов

### 6. Тестирование

1. Проверить все сценарии уведомлений:

   - Подключение WebSocket
   - Получение уведомлений
   - Переподключение при потере соединения
   - Корректное закрытие соединения

2. Проверить UI:
   - Отображение уведомлений
   - Переход к заказу по клику
   - Автоматическое обновление данных

### 7. Рекомендации по реализации

1. Использовать контекст для глобального доступа к WebSocket соединению
2. Реализовать механизм переподключения при потере связи
3. Добавить логирование для отладки
4. Использовать TypeScript для типизации данных
5. Добавить обработку ошибок и пользовательские сообщения

## Ожидаемый результат

- Клиенты получают мгновенные уведомления об изменениях в их заказах
- Уведомления кликабельны и ведут на страницу соответствующего заказа
- Система устойчива к потере соединения и автоматически переподключается
- Пользовательский интерфейс информативен и удобен в использовании

## Приоритет: Высокий

## Оценка времени: 8-12 часов
