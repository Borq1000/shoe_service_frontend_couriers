"use client";

import axios from "axios";
import { useState, useEffect } from "react";

// Обновленный тип для услуги, включающий изображение
type Service = {
  id: number;
  name: string;
  description: string;
  image: string; // Путь к изображению услуги
  price: number; // Добавляем цену услуги
};

function ServiceOrderForm() {
  const [service, setService] = useState<Service>({
    id: 0,
    name: "",
    description: "",
    image: "",
    price: 0,
  });
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const handleOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("service", String(service.id));
    formData.append("address", address);
    formData.append("comment", comment);
    if (image) {
      formData.append("image", image);
    }

    try {
      const token = localStorage.getItem("accessToken"); // Получаем токен из localStorage
      const response = await axios.post(
        `http://127.0.0.1:8000/api/orders/orders/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Включение токена в заголовок
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert("Order successfully created");
      setShowOrderForm(false); // Скрываем форму после отправки
    } catch (error) {
      console.error(
        "Failed to create order:",
        error.response?.data || error.message
      );
      alert("Failed to create order");
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
    }
  };

  return (
    <form onSubmit={handleOrder} className="mt-4">
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Адрес"
        className="block w-full p-2 mb-2 border"
        required
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Комментарий (необязательно)"
        className="block w-full p-2 mb-2 border"
      />
      <input
        type="file"
        onChange={handleImageChange}
        className="block w-full mb-2"
      />
      <button type="submit" className="bg-green-500 text-white p-2 rounded">
        Подтвердить заказ
      </button>
    </form>
  );
}

export default ServiceOrderForm;
