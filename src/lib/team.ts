export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "seller";
  active: boolean;
}

export interface CurrentUser {
  id: string;
  email: string;
  name?: string;
  tenant_id?: string;
  role?: "super_admin" | "tenant_admin" | "seller";
  is_super_admin?: boolean;
}

export function getTeamMembers(): TeamMember[] {
  try {
    return JSON.parse(localStorage.getItem("crm_team_members") || "[]") as TeamMember[];
  } catch {
    return [];
  }
}

export function getCurrentTeamMember(user: CurrentUser | null) {
  if (!user) return null;
  if (user.is_super_admin || user.role) {
    return {
      id: user.id,
      name: user.name ?? user.email,
      email: user.email,
      role: user.is_super_admin ? "admin" : user.role === "seller" ? "seller" : "admin",
      active: true,
    } satisfies TeamMember;
  }
  return getTeamMembers().find((member) => member.email.toLowerCase() === user.email.toLowerCase()) ?? null;
}

export function canSeeAssigned(user: CurrentUser | null, ownerId?: string) {
  if (user?.is_super_admin || user?.role === "tenant_admin") return true;
  const member = getCurrentTeamMember(user);
  if (!member || member.role === "admin") return true;
  return ownerId === user?.id;
}
