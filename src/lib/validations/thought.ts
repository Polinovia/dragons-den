import { z } from "zod";

export const thoughtSchema = z.object({
  body: z.string().trim().min(1, "Write something first.").max(1000),
  visibility: z.enum(["PRIVATE", "FRIENDS", "PUBLIC"]),
});
