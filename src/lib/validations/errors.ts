import type { ZodIssue } from "zod";

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationErrorPayload = {
  message: string;
  issues: ValidationIssue[];
};

export function formatZodIssues(issues: ZodIssue[]): ValidationIssue[] {
  return issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export function buildValidationError(
  message: string,
  issues: ZodIssue[]
): ValidationErrorPayload {
  return {
    message,
    issues: formatZodIssues(issues),
  };
}
