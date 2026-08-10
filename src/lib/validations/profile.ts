import { z } from "zod";

export const SUPPORTED_LOCALES = ["en"] as const;

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(60),
  bio: z
    .string()
    .trim()
    .max(280)
    .optional()
    .transform((v) => (v ? v : null)),
  locale: z.enum(SUPPORTED_LOCALES),
});
