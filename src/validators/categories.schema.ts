import { z } from "zod";

export const createCategoriesSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10),
  userId: z.int(),
});

export const updateCategoriesSchema = z.object({
  id: z.int(),
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(10).optional(),
});
