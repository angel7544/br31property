export type Role = "owner" | "staff" | "customer";

export function hasRole(userRoles: Role[], required: Role | Role[]) {
  const req = Array.isArray(required) ? required : [required];
  return req.some((r) => userRoles.includes(r));
}
