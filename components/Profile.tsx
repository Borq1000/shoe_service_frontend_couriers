"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import ProfileImageUpload from "./ProfileImageUpload";
import toast from "react-hot-toast";

interface ProfileData {
  id: number;
  email: string;
  first_name: string;
  last_name: string | null;
  phone: string;
  rating: number | null;
  completed_orders_count: number;
  user_type: string;
  image: string | null;
  privacy_settings: {
    show_phone: boolean;
    show_email: boolean;
    show_rating: boolean;
  };
}

export default function Profile() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const BACKEND_URL = "http://127.0.0.1:8000";

  const getFullImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return undefined;
    return imageUrl.startsWith("http") ? imageUrl : `${BACKEND_URL}${imageUrl}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (status === "loading") return;
      if (!session?.accessToken) {
        setError("Необходима авторизация");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "http://127.0.0.1:8000/authentication/profile/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            mode: "cors",
            credentials: "include",
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            setError("Сессия истекла. Пожалуйста, войдите снова");
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Ошибка при загрузке профиля");
        }

        const data = await response.json();
        setProfile(data);
        setError(null);
      } catch (err) {
        console.error("Ошибка загрузк�� профиля:", err);
        if (err instanceof TypeError && err.message.includes("NetworkError")) {
          setError(
            "Ошибка сети. Проверьте подключение к интернету и доступность сервера"
          );
        } else {
          const errorMessage =
            err instanceof Error ? err.message : "Произошла неизвестная ошибка";
          setError(errorMessage);
        }
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [session, status]);

  const handleImageUpload = async (file: File) => {
    if (!session?.accessToken || !profile) return;

    // Проверка размера файла (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл слишком большой. Максимальный размер 5MB");
      return;
    }

    // Проверка типа файла
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Неподдерживаемый формат файла. Разрешены: JPEG, PNG, GIF, WebP"
      );
      return;
    }

    setIsUpdating(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      console.log("Отправка файла:", file.name, file.type, file.size);

      const response = await fetch(`${BACKEND_URL}/authentication/profile/`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Ошибка от сервера:", data);
        if (data.error) {
          throw new Error(data.error);
        } else if (data.image) {
          throw new Error(data.image[0]);
        } else if (data.detail) {
          throw new Error(data.detail);
        } else {
          throw new Error("Ошибка при обновлении изображения");
        }
      }

      // Обновляем профиль с полным URL изображения
      setProfile({
        ...profile,
        ...data,
        image: getFullImageUrl(data.image),
      });
      toast.success("Изображение профиля обновлено");
    } catch (err) {
      console.error("Ошибка при загрузке изображения:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Произошла неизвестная ошибка";
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const updatePrivacySettings = async (
    setting: keyof ProfileData["privacy_settings"]
  ) => {
    if (!session?.accessToken || !profile) return;

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/authentication/profile/privacy/",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            [setting]: !profile.privacy_settings[setting],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка при обновлении настроек приватности");
      }

      const data = await response.json();
      setProfile({
        ...profile,
        privacy_settings: {
          ...profile.privacy_settings,
          [setting]: !profile.privacy_settings[setting],
        },
      });
      toast.success("Настройки приватности обновлены");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Произошла неизвестная ошибка";
      toast.error(errorMessage);
    }
  };

  const defaultPrivacySettings = {
    show_phone: true,
    show_email: true,
    show_rating: true,
  };

  const privacySettings = profile?.privacy_settings || defaultPrivacySettings;

  if (isLoading) {
    return <div className="text-center">Загрузка профиля...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  if (!profile) {
    return <div className="text-center">Профиль не найден</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Профиль курьера</h1>
          <Link
            href="/profile/edit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Редакти��овать
          </Link>
        </div>

        <div className="mb-8">
          <ProfileImageUpload
            onImageUpload={handleImageUpload}
            currentImage={getFullImageUrl(profile.image)}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="font-semibold">Имя:</span>
            <span>{profile.first_name}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="font-semibold">Фамилия:</span>
            <span>{profile.last_name || "Не указана"}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Email:</span>
              <button
                onClick={() => updatePrivacySettings("show_email")}
                className={`text-sm px-2 py-1 rounded ${
                  privacySettings.show_email
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {privacySettings.show_email ? "Публичный" : "Скрытый"}
              </button>
            </div>
            <span>{profile.email}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Телефон:</span>
              <button
                onClick={() => updatePrivacySettings("show_phone")}
                className={`text-sm px-2 py-1 rounded ${
                  privacySettings.show_phone
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {privacySettings.show_phone ? "Публичный" : "Скрытый"}
              </button>
            </div>
            <span>{profile.phone}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Рейтинг:</span>
              <button
                onClick={() => updatePrivacySettings("show_rating")}
                className={`text-sm px-2 py-1 rounded ${
                  privacySettings.show_rating
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {privacySettings.show_rating ? "Публичный" : "Скрытый"}
              </button>
            </div>
            <span>{profile.rating ? `${profile.rating}/5` : "Нет оценок"}</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="font-semibold">Выполнено заказов:</span>
            <span>{profile.completed_orders_count}</span>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/my-orders"
              className="bg-green-500 text-white p-4 rounded-lg text-center hover:bg-green-600 transition-colors"
            >
              Мои заказы
            </Link>
            <Link
              href="/dashboard"
              className="bg-purple-500 text-white p-4 rounded-lg text-center hover:bg-purple-600 transition-colors"
            >
              Статистика
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
