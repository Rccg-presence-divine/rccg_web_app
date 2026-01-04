import { z } from "zod";

export const verifyOtpSchema = z.object({
  code: z.string().length(6),
});