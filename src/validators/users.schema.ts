import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email("Email n'est pas vailde"),
  name: z.string().min(2).max(100),
  password: z.string().min(6).max(100),
  phone: z.string(),
});

export const updateUserSchema = z.object({
  id: z.int(),
  email: z.string().email("Email n'est pas vailde").optional(),
  name: z.string().min(2).max(100).optional(),
  password: z.string().min(6).max(100).optional(),
  role: z.enum(["SUPERADMIN", "PASTOR", "MODERATOR", "USER"]).optional(),
  phone: z.string().optional(),
});
// export const userIdSchema = z.object({
//   userId: z.string().uuid("ID utilisateur n'est pas valide"),
// });
