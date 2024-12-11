"use client";

import { FC, useState, useEffect, useRef } from "react";
import { FiShoppingCart, FiBell, FiUser, FiMenu, FiX } from "react-icons/fi";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNotification } from "@/providers/notification-provider";

interface NotificationData {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    id: number;
    title: string;
    message: string;
    type: string;
    order: {
      id: number;
      service: string;
      status: string;
    } | null;
    created_at: string;
    is_read: boolean;
  }>;
}

const NavBar: FC = () => {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    NotificationData["results"]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Получение уведомлений при загрузке
  useEffect(() => {
    if (session?.accessToken) {
      console.log("Загрузка уведомлений...");
      fetch("http://127.0.0.1:8000/api/notifications/", {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      })
        .then((res) => {
          console.log("Статус ответа API:", res.status);
          return res.json();
        })
        .then((data: NotificationData) => {
          console.log("Получены уведомления:", data);
          setNotifications(data.results);
          setUnreadCount(data.results.filter((n) => !n.is_read).length);
        })
        .catch((error) => {
          console.error("Ошибка при загрузке уведомлений:", error);
          setNotifications([]);
          setUnreadCount(0);
        });
    }
  }, [session]);

  // Обработка новых уведомлений через WebSocket
  useEffect(() => {
    if (!session?.accessToken) {
      console.log("Нет токена для WebSocket подключения");
      return;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//127.0.0.1:8000/ws/notifications/?token=${session.accessToken}`;
    console.log("Попытка подключения к WebSocket:", wsUrl);

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket соединение установлено успешно");
    };

    ws.onmessage = (event) => {
      console.log("Получено WebSocket сообщение:", event.data);
      try {
        const newNotification = JSON.parse(event.data);
        setNotifications((prev) => [newNotification, ...prev]);
        if (!newNotification.is_read) {
          setUnreadCount((prev) => prev + 1);
        }
      } catch (error) {
        console.error("Ошибка при об��аботке уведомления:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket ошибка:", error);
    };

    ws.onclose = (event) => {
      console.log("WebSocket соединение закрыто:", {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
      });
    };

    return () => {
      console.log("Закрытие WebSocket соединения");
      ws.close();
    };
  }, [session]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Закрытие меню при клике вне меню
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Закрытие меню при изменении маршрута
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Функция для удаления уведомления
  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Предотвращаем переход по ссылке
    if (session?.accessToken) {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/api/notifications/${id}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );
        if (response.ok) {
          setNotifications(notifications.filter((n) => n.id !== id));
          if (!notifications.find((n) => n.id === id)?.is_read) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      } catch (error) {
        console.error("Ошибка при удалении уведомления:", error);
      }
    }
  };

  // Функция для очистки всех уведомлений
  const clearAllNotifications = async () => {
    if (session?.accessToken && notifications.length > 0) {
      try {
        const promises = notifications.map((notification) =>
          fetch(`http://127.0.0.1:8000/api/notifications/${notification.id}/`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          })
        );
        await Promise.all(promises);
        setNotifications([]);
        setUnreadCount(0);
      } catch (error) {
        console.error("Ошибка при очистке уведомлений:", error);
      }
    }
  };

  return (
    <nav className="bg-gray-100 py-5 px-5">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <img src="/logo2.png" alt="ShoeMaster Logo" className="h-10 mr-2" />
          </Link>
        </div>

        {/* Ссылки для десктопа */}
        <ul className="hidden md:flex space-x-6 text-gray-600">
          <li>
            <Link
              href="/my-orders"
              className={`hover:text-gray-900 ${
                pathname === "/my-orders" ? "text-blue-600 font-semibold" : ""
              }`}
            >
              Мои заказы
            </Link>
          </li>
          <li>
            <Link
              href="/history-orders"
              className={`hover:text-gray-900 ${
                pathname === "/history-orders"
                  ? "text-blue-600 font-semibold"
                  : ""
              }`}
            >
              История заказов
            </Link>
          </li>
        </ul>

        {/* Иконки */}
        <div className="hidden md:flex space-x-4 text-gray-600">
          {/* Уведомления */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={`hover:text-gray-900 focus:outline-none p-2 rounded-full relative
                ${isNotificationsOpen ? "bg-gray-200" : ""}`}
            >
              <FiBell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Уведомления</h3>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Очистить все
                      </button>
                    )}
                  </div>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-3 text-gray-500">
                    Нет новых уведомлений
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer relative group ${
                        !notification.is_read ? "bg-blue-50" : ""
                      }`}
                    >
                      {notification.order ? (
                        <Link href={`/orders/${notification.order.id}`}>
                          <div
                            onClick={() => {
                              if (
                                !notification.is_read &&
                                session?.accessToken
                              ) {
                                fetch(
                                  `http://127.0.0.1:8000/api/notifications/${notification.id}/mark_as_read/`,
                                  {
                                    method: "POST",
                                    headers: {
                                      Authorization: `Bearer ${session.accessToken}`,
                                    },
                                  }
                                )
                                  .then(() => {
                                    setNotifications(
                                      notifications.map((n) =>
                                        n.id === notification.id
                                          ? { ...n, is_read: true }
                                          : n
                                      )
                                    );
                                    setUnreadCount(
                                      Math.max(0, unreadCount - 1)
                                    );
                                  })
                                  .catch(console.error);
                              }
                            }}
                          >
                            <div className="text-sm font-medium">
                              {notification.title}
                            </div>
                            <div className="text-sm text-gray-600">
                              {notification.message}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(
                                notification.created_at
                              ).toLocaleString()}
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div>
                          <div className="text-sm font-medium">
                            {notification.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {notification.message}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={(e) => deleteNotification(notification.id, e)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User menu (existing code) */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={toggleUserMenu}
              className={`hover:text-gray-900 focus:outline-none p-2 rounded-full
                ${isUserMenuOpen ? "bg-gray-200" : ""}
                ${pathname.startsWith("/profile") ? "text-blue-600" : ""}`}
            >
              <FiUser className="h-6 w-6" />
            </button>
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                <Link href="/profile">
                  <span
                    className={`block px-4 py-2 text-gray-700 hover:bg-gray-100
                    ${
                      pathname === "/profile" ? "bg-gray-100 text-blue-600" : ""
                    }`}
                  >
                    Мой профиль
                  </span>
                </Link>
                <Link href="/profile/edit">
                  <span
                    className={`block px-4 py-2 text-gray-700 hover:bg-gray-100
                    ${
                      pathname === "/profile/edit"
                        ? "bg-gray-100 text-blue-600"
                        : ""
                    }`}
                  >
                    Редактировать профиль
                  </span>
                </Link>
                <div className="border-t border-gray-100 my-2"></div>
                <button
                  onClick={() => signOut()}
                  className="w-full text-left block px-4 py-2 text-red-600 hover:bg-gray-100"
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Кнопка мобильного меню */}
        <div className="md:hidden flex items-center">
          <button
            className="text-gray-700 focus:outline-none"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? (
              <FiX className="h-6 w-6" />
            ) : (
              <FiMenu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 space-y-2 text-gray-600">
          <Link
            href="/my-orders"
            className={`block hover:text-gray-900 py-2 ${
              pathname === "/my-orders" ? "text-blue-600 font-semibold" : ""
            }`}
          >
            Мои заказы
          </Link>
          <Link
            href="/history-orders"
            className={`block hover:text-gray-900 py-2 ${
              pathname === "/history-orders"
                ? "text-blue-600 font-semibold"
                : ""
            }`}
          >
            История заказов
          </Link>
          <div className="border-t border-gray-200 my-2"></div>
          <Link
            href="/profile"
            className={`block hover:text-gray-900 py-2 ${
              pathname === "/profile" ? "text-blue-600 font-semibold" : ""
            }`}
          >
            Мой профиль
          </Link>
          <Link
            href="/profile/edit"
            className={`block hover:text-gray-900 py-2 ${
              pathname === "/profile/edit" ? "text-blue-600 font-semibold" : ""
            }`}
          >
            Редактировать профиль
          </Link>
          <div className="border-t border-gray-200 my-2"></div>
          <button
            onClick={() => signOut()}
            className="block w-full text-left py-2 text-red-600 hover:text-red-700"
          >
            Выйти
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
