import z from "zod";

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .max(10)
    .min(3, "Username must be atleast 8 chars long.")
    .optional(),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email({ message: "Invalid Email address." }),
  password: z
    .string()
    .max(30, "Password cannot be longer than 30 chars.")
    .min(8, "Password must be atleast 8 chars long."),
});
export const updateUserSchema = z.object({
  username: z
    .string()
    .trim()
    .max(10)
    .min(3, "Username must be atleast 8 chars long.")
    .optional(),
  email: z
    .email({ message: "Invalid Email address." })
    .trim()
    .min(1, "Email is required")
    .optional(),
});

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .max(30, "Password cannot be longer than 30 chars.")
    .min(8, "Password must be atleast 8 chars long."),
});

