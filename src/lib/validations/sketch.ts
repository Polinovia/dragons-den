import { z } from "zod";

const visibilitySchema = z.enum(["PRIVATE", "FRIENDS", "PUBLIC"]);

export const sketchSchema = z.object({
  title: z
    .string()
    .trim()
    .max(140)
    .optional()
    .transform((v) => (v ? v : undefined)),
  body: z.string().trim().min(1, "Write something first.").max(4000),
  visibility: visibilitySchema,
});

export const continuationSchema = z.object({
  body: z.string().trim().min(1, "Say something first.").max(4000),
  visibility: visibilitySchema,
});
