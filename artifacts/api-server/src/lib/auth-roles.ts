export type RegistrationRole = "client" | "provider";

export function normalizeRegistrationRole(role: unknown): RegistrationRole {
  return role === "provider" ? "provider" : "client";
}

export function shouldCreateProviderProfile(role: unknown): boolean {
  return normalizeRegistrationRole(role) === "provider";
}