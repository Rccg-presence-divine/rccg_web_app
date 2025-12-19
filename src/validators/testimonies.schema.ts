import { z } from "zod";

export const createTestimoniesSchema = z.object({
  title: z.string().min(5).max(100),
  content: z.string().min(10),
});

export const updateTestimoniesSchema = z.object({
  id: z.int(),
  title: z.string().min(5).max(100).optional(),
  content: z.string().min(10).optional(),
});
