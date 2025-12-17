import { z } from "zod";

export const createVideoSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(5),
  preacher: z.string().min(5).max(100),
  datePreached: z.date(),
  audioUrl: z.string().min(5),
  videoUrl: z.string().min(5),
  youtubeID: z.string().min(5),
  thumbnailUrl: z.string().min(5),
  userId: z.int(),
  categoryId: z.int(),
});

export const updateVideoSchema = z.object({
  id: z.int(),
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(5).optional(),
  preacher: z.string().min(5).max(100).optional(),
  audioUrl: z.string().min(5).optional(),
  videoUrl: z.string().min(5).optional(),
  youtubeID: z.string().min(5).optional(),
  thumbnailUrl: z.string().min(5).optional(),
  categoryId: z.number().int().optional(),
});
