"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  rating: number;
  earnings: number;
  ordersByDay: {
    date: string;
    count: number;
  }[];
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!session?.accessToken) return;

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/api/orders/courier/statistics/",
          {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Ошибка при загрузке статистики");
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Произошла неизвестная ошибка";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [session]);

  if (isLoading) {
    return <div className="text-center">Загрузка статистики...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (!stats) {
    return <div className="text-center">Нет данных</div>;
  }

  const chartData = {
    labels: stats.ordersByDay.map((item) => item.date),
    datasets: [
      {
        label: "Количество заказов",
        data: stats.ordersByDay.map((item) => item.count),
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-8">Статистика работы</h1>

      {/* Основные показатели */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm">Всего заказов</h3>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm">Выполнено заказов</h3>
          <p className="text-3xl font-bold text-green-600">
            {stats.completedOrders}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm">Рейтинг</h3>
          <p className="text-3xl font-bold text-yellow-500">
            {stats.rating.toFixed(1)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm">Заработано</h3>
          <p className="text-3xl font-bold text-blue-600">
            {stats.earnings.toFixed(0)} ₽
          </p>
        </div>
      </div>

      {/* График заказов */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Динамика заказов</h2>
        <div className="h-[400px]">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "top" as const,
                },
                title: {
                  display: true,
                  text: "Количество заказов по дням",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
