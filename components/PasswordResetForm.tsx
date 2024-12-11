// PasswordResetForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPasswordSchema } from "@/schemas"; // Импорт схемы валидации

export default function PasswordWeakForm({
  uid,
  token,
}: {
  uid: string;
  token: string;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Валидация с использованием Zod
    const validationResult = resetPasswordSchema.safeParse({
      newPassword,
      confirmPassword,
    });

    if (!validationResult.success) {
      setError(
        validationResult.error.formErrors.fieldErrors.confirmPassword?.[0] ||
          "Validation error"
      );
      return;
    }

    const response = await fetch(
      `http://127.0.0.1:8000/authentication/reset-password/${uid}/${token}/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_password: newPassword }),
      }
    );

    if (response.ok) {
      alert("Password reset successfully!");
      router.push("/login");
    } else {
      const responseData = await response.json();
      alert(responseData.message || "An error occurred. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        className="w-full p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        className="w-full p-2 border rounded"
      />
      {error && <div className="text-red-500">{error}</div>}
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Reset Password
      </button>
    </form>
  );
}
