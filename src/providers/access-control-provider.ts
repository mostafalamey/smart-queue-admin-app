import type { AccessControlProvider } from "@refinedev/core";
import { getStoredUser } from "@/lib/stored-user";

/**
 * RBAC rules per the admin-app-spec.md:
 *   Admin   → all 4 top-level tabs
 *   IT      → Organization + User Experience
 *   Manager → Queue Control + Analytics
 *
 * Organization sub-tabs (Metadata, User Management, Departments Structure,
 * Mapping, Transfer Reasons) inherit access from the "organization" parent.
 *
 * Resource names must match the `name` field in each Refine resource declaration.
 */
export const ROLE_RESOURCES: Record<string, readonly string[]> = {
  ADMIN: [
    "queue-control",
    "analytics",
    "organization",
    "user-experience",
  ],
  IT: ["organization", "user-experience"],
  MANAGER: ["queue-control", "analytics"],
};

export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    const user = getStoredUser();

    // No user → deny
    if (!user) {
      return { can: false, reason: "Not authenticated." };
    }

    // For "list" actions (tab/page access), enforce the role→resource map
    if (action === "list" && resource) {
      const allowed = ROLE_RESOURCES[user.role];
      if (!allowed || !allowed.includes(resource)) {
        return { can: false, reason: "You do not have access to this section." };
      }
    }

    // All other actions (show, edit, create, delete, field, etc.) are allowed
    // by default at the provider level — server-side guards are authoritative.
    return { can: true };
  },
  options: {
    buttons: {
      enableAccessControl: true,
      hideIfUnauthorized: true,
    },
  },
};
