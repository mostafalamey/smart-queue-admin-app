import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStoredUser } from "@/lib/stored-user";
import { ROLE_RESOURCES } from "@/providers/access-control-provider";
import {
  ChartNoAxesCombined,
  ListStart,
  Building,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router";

/* ── Resource metadata ──────────────────────────────────────────────────── */

const RESOURCE_META: Record<
  string,
  { label: string; description: string; icon: React.ElementType; path: string }
> = {
  "queue-control": {
    label: "Queue Control",
    description: "Monitor live queues, call next patient, manage serving flow.",
    icon: ListStart,
    path: "/queue-control",
  },
  analytics: {
    label: "Analytics",
    description: "View wait-time trends, service statistics, and performance reports.",
    icon: ChartNoAxesCombined,
    path: "/analytics",
  },
  organization: {
    label: "Organization",
    description: "Manage departments, users, mapping, transfer reasons, and hospital settings.",
    icon: Building,
    path: "/organization/metadata",
  },
  "user-experience": {
    label: "User Experience",
    description: "Customize kiosk appearance, display screens, and patient flows.",
    icon: UsersRound,
    path: "/user-experience",
  },
};

/* ── Component ──────────────────────────────────────────────────────────── */

export default function Welcome() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const allowed = user ? ROLE_RESOURCES[user.role] ?? [] : [];
  const sections = allowed
    .map((key) => RESOURCE_META[key])
    .filter(Boolean);

  const displayName = user?.name || user?.email || "there";
  const firstName = displayName.split(/\s+/)[0];

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a section to get started.
        </p>
      </div>

      {/* Section cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map(({ label, description, icon: Icon, path }) => (
          <Card
            key={path}
            tabIndex={0}
            role="link"
            onClick={() => navigate(path)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(path);
              }
            }}
            className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CardHeader className="flex flex-row items-start gap-3 p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon size={18} />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold leading-tight">
                  {label}
                </CardTitle>
                <CardDescription className="mt-0.5 text-xs leading-snug">
                  {description}
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
