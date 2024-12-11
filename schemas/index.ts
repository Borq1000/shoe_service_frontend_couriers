import * as z from "zod";

// Определим схему валидации с использованием zod
export const LoginSchema = z.object({
  email: z.string().email().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const RegistrationSchema = z
  .object({
    first_name: z.string().min(1, "Имя обязательно"),
    email: z.string().email("Неверный формат email"),
    phone: z.string().min(11, "Телефон должен содержать не менее 11 цифр"),
    password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Пароли не совпадают",
    path: ["confirm_password"],
  });

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
