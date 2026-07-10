import { z } from "zod";

const nameRegex = /^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/;

const nameSchema = z
  .string()
  .min(2, "Must be at least 2 characters")
  .max(50, "Must be at most 50 characters")
  .regex(nameRegex, "Must contain only letters, spaces, or hyphens");

export const registerSchema = z
  .object({
    email: z.email("Invalid email address"),
    first_name: nameSchema,
    last_name: nameSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one digit"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const signInSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export type SignInFormData = z.infer<typeof signInSchema>;

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(6, "Code must be 6 digits")
    .regex(/^\d{6}$/, "Code must contain only digits"),
});

export type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;
