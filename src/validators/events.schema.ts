import { z } from "zod";

export const createEventsSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10),
  eventDate: z.date(),
  userId: z.int(),
});

export const updateEventsSchema = z.object({
  id: z.int(),
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(10).optional(),
  eventDate: z.date().optional(),
});
