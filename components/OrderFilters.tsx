"use client";

import { useState } from "react";
import { FiSearch } from "react-icons/fi";

export interface FilterOptions {
  search: string;
  status: string;
  sortBy: string;
  distance: number;
}

interface OrderFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

export default function OrderFilters({
  onFilterChange,
  currentFilters,
}: OrderFiltersProps) {
  const [searchValue, setSearchValue] = useState(currentFilters.search);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onFilterChange({
      ...currentFilters,
      search: e.target.value,
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Поиск */}
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск по адресу..."
            value={searchValue}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        {/* Фильтр по статусу */}
        <select
          value={currentFilters.status}
          onChange={(e) =>
            onFilterChange({ ...currentFilters, status: e.target.value })
          }
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="awaiting_courier">Ожидает курьера</option>
        </select>

        {/* Сортировка */}
        <select
          value={currentFilters.sortBy}
          onChange={(e) =>
            onFilterChange({ ...currentFilters, sortBy: e.target.value })
          }
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date_desc">Сначала новые</option>
          <option value="date_asc">Сначала старые</option>
          <option value="distance_asc">По возрастанию расстояния</option>
          <option value="distance_desc">По убыванию расстояния</option>
        </select>

        {/* Фильтр по расстоянию */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">До</span>
          <select
            value={currentFilters.distance}
            onChange={(e) =>
              onFilterChange({
                ...currentFilters,
                distance: Number(e.target.value),
              })
            }
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5 км</option>
            <option value={10}>10 км</option>
            <option value={15}>15 км</option>
            <option value={20}>20 км</option>
          </select>
        </div>
      </div>
    </div>
  );
}
