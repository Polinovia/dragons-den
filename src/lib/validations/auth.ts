import { z } from "zod";
import { isSecurityQuestionValue } from "@/lib/security-questions";

export const registerSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(60),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "At least 3 characters")
    .max(24, "At most 24 characters")
    .regex(/^[a-z0-9_]+$/, "Only lowercase letters, numbers, and underscores"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  securityQuestion: z.string().refine(isSecurityQuestionValue, "Choose a security question"),
  securityAnswer: z.string().trim().min(2, "Answer is too short"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Missing reset token"),
  password: z.string().min(8, "At least 8 characters"),
});

export const getSecurityQuestionSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export const resetWithSecurityAnswerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  securityAnswer: z.string().trim().min(1, "Answer is required"),
  password: z.string().min(8, "At least 8 characters"),
});
