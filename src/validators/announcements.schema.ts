import { z } from "zod";

export const createAnnouncementsSchema = z.object({
  title: z.string().min(5).max(100),
  content: z
    .string()
    .min(10)
    .max(1000, "Le contenu est trop long")
    .describe("Le contenu de l'annonce"),
  userId: z.int(),
});

export const updateAnnouncementsSchema = z.object({
  id: z.int(),
  title: z.string().min(5).max(100).optional(),
  content: z.string().min(10).max(1000, "Le contenu est trop long").optional(),
});
