import { getRoleLabel } from "./authModel.js";

export function mapAuthProfile(profile) {
  if (!profile) return null;
  return {
    ...profile,
    role: getRoleLabel(profile.role),
  };
}
