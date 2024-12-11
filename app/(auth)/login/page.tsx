import LoginForm from "../../../components/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex items-center justify-center md:h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4 md:-mt-32">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3 md:h-16"></div>
        <LoginForm />

        <Link href="/reset-password">Забыли пароль?</Link>
      </div>
    </main>
  );
}
