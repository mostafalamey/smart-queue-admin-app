import { useCan } from "@refinedev/core";
import { Navigate } from "react-router";

interface Props {
  resource: string;
  children: React.ReactNode;
}

/**
 * Route-level access guard. Renders children only if the current user
 * has "list" permission for the given resource. Otherwise redirects
 * to the welcome page.
 */
export function RequireAccess({ resource, children }: Props) {
  const { data, isLoading } = useCan({ resource, action: "list" });

  if (isLoading) return null;

  if (!data?.can) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
