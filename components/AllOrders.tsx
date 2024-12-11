"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { IoClose } from "react-icons/io5";
import OrderFilters, { FilterOptions } from "./OrderFilters";

// Функция для расчета расстояния между двумя точками
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Радиус Земли в километрах
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const BACKEND_URL = "http://127.0.0.1:8000";

// Функция для получения заказов
async function fetchOrders(accessToken: string) {
  try {
    console.log("Fetching orders with token:", accessToken);
    const response = await fetch(`${BACKEND_URL}/api/orders/courier/orders/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("URL не найден. Проверьте правильность адреса API.");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Ошибка ${response.status}: ${response.statusText}`
      );
    }

    const text = await response.text();
    console.log("Raw response:", text);

    try {
      const data = JSON.parse(text);
      console.log("Parsed orders data:", data);

      // Проверяем структуру данных
      if (data.results && Array.isArray(data.results)) {
        // Если данные в формате { results: [] }
        return data.results;
      } else if (Array.isArray(data)) {
        // Если данные сразу в виде массива
        return data;
      } else {
        console.error("Unexpected data format:", data);
        throw new Error("Неверный формат данных от сервера");
      }
    } catch (e) {
      console.error("JSON parse error:", e);
      throw new Error("Ошибка при разборе ответа сервера");
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
}

// Функция для отклика на заказ
async function assignOrder(orderId: number, accessToken: string) {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/orders/courier/orders/${orderId}/assign/`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Ошибка ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error assigning order:", error);
    throw error;
  }
}

interface LocationState {
  lat: number;
  lon: number;
  source: "geolocation" | "manual" | "default";
}

export default function AllOrders() {
  const { data: session } = useSession();
  const [userLocation, setUserLocation] = useState<LocationState | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [hiddenOrders, setHiddenOrders] = useState<number[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    status: "",
    sortBy: "date_desc",
    distance: 50,
  });

  const { mutate: assign } = useMutation({
    mutationFn: ({ orderId }: { orderId: number }) =>
      assignOrder(orderId, session?.accessToken as string),
    onSuccess: (_, { orderId }) => {
      setFilteredOrders((prev) => prev.filter((order) => order.id !== orderId));
      setSuccessMessage("Вы успешно откликнулись на заказ!");
      setTimeout(() => setSuccessMessage(null), 2000);
    },
    onError: (error: any) => {
      setError(error.message || "Не удалось откликнуться на заказ");
      setTimeout(() => setError(null), 5000);
    },
  });

  // Получение координат пользователя
  useEffect(() => {
    // Попытка получить сохраненные координаты
    const savedLocation = localStorage.getItem("userLocation");
    const savedDevMode = localStorage.getItem("devMode") === "true";
    setIsDevMode(savedDevMode);

    if (savedLocation && !isDevMode) {
      setUserLocation(JSON.parse(savedLocation));
      return;
    }

    // В режиме разработки используем координаты по умолчанию
    if (isDevMode) {
      const defaultLocation = {
        lat: 55.7558, // Координаты центра Москвы
        lon: 37.6173,
        source: "default" as const,
      };
      setUserLocation(defaultLocation);
      return;
    }

    // Получение реальных координат
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            source: "geolocation" as const,
          };
          setUserLocation(location);
          localStorage.setItem("userLocation", JSON.stringify(location));
          setLocationError(null);
        },
        (error) => {
          console.error("Ошибка получения координат:", error);
          setLocationError(
            "Не удалось получить ваше местоположение. Исполь��уются координаты по умолчанию."
          );
          // Используем координаты по умолчанию при ошибке
          const defaultLocation = {
            lat: 55.7558,
            lon: 37.6173,
            source: "default" as const,
          };
          setUserLocation(defaultLocation);
        }
      );
    }
  }, [isDevMode]);

  // Получение заказов
  useEffect(() => {
    if (session?.accessToken) {
      setIsLoading(true);
      setError(null);
      console.log("Starting to fetch orders...");

      fetchOrders(session.accessToken)
        .then((data) => {
          console.log("Processing orders data:", data);
          // Проверяем, что data существует
          if (data) {
            const validOrders = data.filter(
              (order: any) =>
                order && order.status === "pending" && !order.courier
            );
            console.log("Valid orders after filtering:", validOrders);
            setOrders(validOrders);
          } else {
            throw new Error("Нет данных от сервера");
          }
        })
        .catch((error) => {
          console.error("Ошибка загрузки заказов:", error);
          setError(error.message || "Не удалось загрузить заказы");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [session]);

  // Применение фильтров и сортировки
  useEffect(() => {
    if (orders.length > 0) {
      let filtered = orders
        .filter((order) => !hiddenOrders.includes(order.id))
        .map((order) => {
          if (userLocation && order.latitude && order.longitude) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lon,
              parseFloat(order.latitude),
              parseFloat(order.longitude)
            );
            return { ...order, distance };
          }
          return { ...order, distance: null };
        });

      // Применяем фильтр по расстоянию только если не в режиме разработки
      if (!isDevMode) {
        filtered = filtered.filter((order) => {
          if (order.distance !== null) {
            return order.distance <= filters.distance;
          }
          return true;
        });
      }

      filtered = filtered
        .filter((order) => {
          // Фильтр по статусу
          if (filters.status) {
            return order.status === filters.status;
          }
          return true;
        })
        .filter((order) => {
          // Поиск по адресу
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return (
              order.city?.toLowerCase().includes(searchLower) ||
              order.street?.toLowerCase().includes(searchLower) ||
              order.building_num?.toLowerCase().includes(searchLower)
            );
          }
          return true;
        });

      // Сортировка
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case "date_asc":
            return (
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
            );
          case "date_desc":
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          case "distance_asc":
            return (a.distance || Infinity) - (b.distance || Infinity);
          case "distance_desc":
            return (b.distance || -Infinity) - (a.distance || -Infinity);
          default:
            return 0;
        }
      });

      setFilteredOrders(filtered);
    }
  }, [orders, hiddenOrders, userLocation, filters, isDevMode]);

  const hideOrder = (orderId: number) => {
    setHiddenOrders((prev) => [...prev, orderId]);
  };

  const toggleDevMode = () => {
    const newDevMode = !isDevMode;
    setIsDevMode(newDevMode);
    localStorage.setItem("devMode", String(newDevMode));
    if (!newDevMode) {
      // При выключении режима разработки очищаем сохраненную локацию
      localStorage.removeItem("userLocation");
    }
  };

  // Сопоставление статусов с русскими значениями
  const statusMapping: { [key: string]: string } = {
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

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4 relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Доступные заказы</h1>
        <button
          onClick={toggleDevMode}
          className={`px-4 py-2 rounded ${
            isDevMode ? "bg-yellow-500" : "bg-gray-500"
          } text-white`}
        >
          {isDevMode ? "Режим разработки" : "Обычный режим"}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      {locationError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          {locationError}
        </div>
      )}

      {userLocation && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
          Ваше местоположение:{" "}
          {userLocation.source === "geolocation"
            ? "Определено"
            : "По умолчанию"}
          {isDevMode && " (Режим разработки)"}
        </div>
      )}

      <OrderFilters currentFilters={filters} onFilterChange={setFilters} />

      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-4 rounded-lg shadow-md">
          <p>{successMessage}</p>
        </div>
      )}

      {isLoading ? (
        <p className="text-center">Загрузка заказов...</p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-center text-gray-500">Нет доступных заказов.</p>
      ) : (
        filteredOrders.map((order) => (
          <div
            key={order.id}
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-4 relative group"
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
            <div className="flex justify-between items-center border-t border-gray-300 pt-4">
              {order.distance !== null ? (
                <span className="text-gray-500 text-sm">
                  Расстояние: {order.distance.toFixed(2)} км
                </span>
              ) : (
                <span className="text-gray-500 text-sm">
                  Расстояние неизвестно
                </span>
              )}
              <button
                className={`px-4 py-2 rounded-full text-white bg-blue-500 hover:bg-blue-600 transition ${
                  successMessage ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => assign({ orderId: order.id })}
                disabled={successMessage ? true : false}
              >
                Откликнуться
              </button>
            </div>
            <button
              onClick={() => hideOrder(order.id)}
              className="absolute -top-2 -right-2 shadow-black shadow bg-white text-black rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-label="Скрыть заказ"
            >
              <IoClose size={20} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}
