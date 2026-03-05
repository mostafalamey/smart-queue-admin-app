import type { AccessControlProvider } from "@refinedev/core";
import { getStoredUser } from "@/lib/stored-user";

/**
 * RBAC rules per the admin-app-spec.md:
 *   Admin   → all 6 tabs
 *   IT      → User Experience + Mapping
 *   Manager → Queue Control + Analytics
 *
 * Resource names must match the `name` field in each Refine resource declaration.
 */
const ROLE_RESOURCES: Record<string, readonly string[]> = {
  ADMIN: [
    "queue-control",
    "analytics",
    "departments-structure",
    "mapping",
    "organization",
    "user-experience",
  ],
  IT: ["user-experience", "mapping"],
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
