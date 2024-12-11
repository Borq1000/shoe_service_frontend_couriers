"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FiUpload } from "react-icons/fi";
import { toast } from "react-hot-toast";

interface ProfileImageUploadProps {
  onImageUpload: (file: File) => void;
  currentImage?: string;
}

export default function ProfileImageUpload({
  onImageUpload,
  currentImage,
}: ProfileImageUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        console.log("Файл принят:", {
          name: file.name,
          type: file.type,
          size: file.size,
        });
        onImageUpload(file);
      }
    },
    [onImageUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    multiple: false,
    maxSize: 5 * 1024 * 1024, // 5MB
    onDropRejected: (fileRejections) => {
      console.error("Файл отклонен:", fileRejections);
      const error = fileRejections[0]?.errors[0];
      if (error.code === "file-too-large") {
        toast.error("Файл слишком большой. Максимальный размер 5MB");
      } else if (error.code === "file-invalid-type") {
        toast.error(
          "Неподдерживаемый формат файла. Разрешены: JPEG, JPG, PNG, GIF, WebP"
        );
      } else {
        toast.error(`Ошибка: ${error.message}`);
      }
    },
  });

  return (
    <div className="flex flex-col items-center">
      {currentImage && (
        <div className="mb-4">
          <img
            src={currentImage}
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover"
          />
        </div>
      )}

      <div
        {...getRootProps()}
        className={`w-full max-w-md p-6 border-2 border-dashed rounded-lg cursor-pointer
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-500"
          }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <FiUpload className="w-8 h-8 text-gray-400 mb-2" />
          {isDragActive ? (
            <p className="text-sm text-gray-600">Перетащите файл сюда...</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                Перетащите изображение сюда или
              </p>
              <button className="mt-2 text-blue-500 hover:text-blue-600">
                выберите файл
              </button>
            </>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Поддерживаются JPG, JPEG, PNG
          </p>
        </div>
      </div>
    </div>
  );
}
