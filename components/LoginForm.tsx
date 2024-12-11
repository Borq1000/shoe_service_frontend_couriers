"use client";

import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginSchema } from "../schemas";

export default function LoginForm() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });

  async function handleSubmit(e: any) {
    e.preventDefault();
    // Валидируем данные формы
    const result = LoginSchema.safeParse({ email, password });

    if (!result.success) {
      // Устанавливаем ошибки, если валидация не прошла
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0] || "",
        password: fieldErrors.password?.[0] || "",
      });
      return;
    }

    // Если валидация прошла, сбросим ошибки
    setErrors({ email: "", password: "" });

    const res = await signIn("credentials", {
      email,
      password,
      redirect: true,
    });

    if (res?.error) {
      alert("Invalid credentials");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email:
        <br />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border mb-3 h-9"
        />
        {errors.email && <p className="text-red-500">{errors.email}</p>}
      </label>
      <label>
        Password:
        <br />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border mb-3 h-9"
        />
        {errors.password && <p className="text-red-500">{errors.password}</p>}
      </label>{" "}
      <br />
      <button
        type="submit"
        className="w-full py-4 px-10 bg-slate-900 text-white"
      >
        Login
      </button>
    </form>
  );
}
