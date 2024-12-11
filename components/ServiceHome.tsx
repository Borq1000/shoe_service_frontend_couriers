"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";

// Define the data type for a service
type Service = {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string; // Assuming 'image' is the URL provided by the API
};

const ServiceHome = () => {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/services/services/`
        );

        // Sort services by id in ascending order
        const sortedServices = response.data.sort(
          (a: Service, b: Service) => a.id - b.id
        );

        setServices(sortedServices);
      } catch (error) {
        console.error("Failed to load services:", error);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="container mx-auto py-12">
      {services.length === 0 ? (
        <p>Загрузка услуг...</p> // Состояние загрузки
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className="relative p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="flex flex-col items-center">
                {service.image && (
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-24 h-24 object-cover mb-4 rounded-full"
                  />
                )}
                <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                  {service.name}
                </h3>
                <p className="text-gray-600 text-center mb-4">
                  {service.description}
                </p>
                <Link href={`/services/${service.slug}`}>
                  <button className="border-2 border-custom-red text-custom-red bg-white py-2 px-4 rounded-full transition duration-300 hover:bg-custom-red hover:text-white">
                    Заказать услугу
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceHome;
