// PasswordResetPage.tsx
"use client";

import { useParams } from "next/navigation";
import PasswordResetForm from "@/components/PasswordResetForm";

export default function PasswordResetPage() {
  const { uid, token } = useParams();

  // Проверяем, доступны ли uid и token перед рендером формы
  if (!uid || !token) {
    return <div>Invalid password reset link.</div>;
  }

  return (
    <main className="flex items-center justify-center h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3"></div>
        <PasswordResetForm uid={uid as string} token={token as string} />
      </div>
    </main>
  );
}
