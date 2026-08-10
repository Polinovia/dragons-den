import { z } from "zod";

export const storySchema = z.object({
  title: z.string().trim().min(1, "Give it a title.").max(140),
  synopsis: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v ? v : undefined)),
  visibility: z.enum(["PRIVATE", "FRIENDS", "PUBLIC"]),
  allowContributions: z
    .string()
    .nullish()
    .transform((v) => v === "on"),
});
