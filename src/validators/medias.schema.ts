import { z } from "zod";

export const createMediaSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string(),
  preacher: z.string().max(100),
  datePreached: z.date(),
  mediaUrl: z.string(),
  isVideo: z.boolean(),
  youtubeID: z.string(),
  thumbnailUrl: z.string(),
  categoryId: z.int(),
});

export const updateMediaSchema = z.object({
  id: z.int(),
  title: z.string().min(5).max(100).optional(),
  description: z.string().optional(),
  preacher: z.string().max(100).optional(),
  mediaUrl: z.string().optional(),
  isVideo: z.boolean().optional(),
  youtubeID: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  categoryId: z.number().int().optional(),
});
