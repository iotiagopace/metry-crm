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
  return getTeamMembers().find((member) => member.email.toLowerCase() === user.email.toLowerCase()) ?? null;
}

export function canSeeAssigned(user: CurrentUser | null, ownerId?: string) {
  const member = getCurrentTeamMember(user);
  if (!member || member.role === "admin") return true;
  return ownerId === user?.id;
}
