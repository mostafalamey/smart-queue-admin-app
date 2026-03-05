import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetIdentity } from "@refinedev/core";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
};

export function UserAvatar() {
  const { data: user, isLoading: userIsLoading } = useGetIdentity<User>();

  if (userIsLoading || !user) {
    return <Skeleton className={cn("h-10", "w-10", "rounded-full")} />;
  }

  return (
    <Avatar className={cn("h-10", "w-10")}>
      {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
    </Avatar>
  );
}

/** Derive initials from a display name or email address. */
const getInitials = (nameOrEmail = ""): string => {
  // If it looks like an email, use the local part before @
  const name = nameOrEmail.includes("@")
    ? nameOrEmail.split("@")[0]
    : nameOrEmail;

  const parts = name
    .replace(/[._-]/g, " ")   // treat separators as spaces
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

UserAvatar.displayName = "UserAvatar";
