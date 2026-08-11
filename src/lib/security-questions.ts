export const SECURITY_QUESTIONS = {
  FIRST_PET: "What was the name of your first pet?",
  CHILDHOOD_STREET: "What street did you grow up on?",
  MOTHERS_MAIDEN_NAME: "What is your mother's maiden name?",
  FIRST_SCHOOL: "What was the name of your first school?",
  FAVORITE_TEACHER: "Who was your favorite teacher?",
} as const;

export type SecurityQuestionValue = keyof typeof SECURITY_QUESTIONS;

export function isSecurityQuestionValue(value: unknown): value is SecurityQuestionValue {
  return typeof value === "string" && value in SECURITY_QUESTIONS;
}
