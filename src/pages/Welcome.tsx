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
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
          Smart Queue Admin
        </p>
        <h1
          className="text-3xl font-bold tracking-tight text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a section to get started.
        </p>
      </div>

      {/* Section cards */}
      <div className="grid gap-4 sm:grid-cols-2">
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
            className="cursor-pointer group border border-border transition-all duration-200 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CardHeader className="flex flex-row items-start gap-4 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <CardTitle
                  className="text-sm font-semibold leading-tight mb-1"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {label}
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
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
