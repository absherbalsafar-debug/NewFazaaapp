export type RegistrationRole = "client" | "provider";

export function getRegistrationRole(search: string): RegistrationRole {
  return new URLSearchParams(search).get("role") === "provider" ? "provider" : "client";
}

export function getPostAuthPath(role: RegistrationRole): "/" | "/provider-dashboard" {
  return role === "provider" ? "/provider-dashboard" : "/";
}

export function buildGoogleAuthPayload(
  payload: { sub: string; email?: string; name?: string; picture?: string },
  role: RegistrationRole,
) {
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    avatarUrl: payload.picture,
    role,
  };
}