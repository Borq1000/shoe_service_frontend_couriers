import PasswordResetRequestForm from "@/components/PasswordResetRequestForm";

export default function PasswordResetRequestPage() {
  return (
    <main className="flex items-center justify-center h-screen">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4">
        <div className="flex h-20 w-full items-end rounded-lg bg-blue-500 p-3"></div>
        <PasswordResetRequestForm />
      </div>
    </main>
  );
}
