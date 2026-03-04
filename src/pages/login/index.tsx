import { useState } from "react";
import { useLogin } from "@refinedev/core";
import { InputPassword } from "@/components/refine-ui/form/input-password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    login(
      { email, password },
      {
        onError: (err) => {
          setError(err?.message ?? "Login failed. Please try again.");
        },
      }
    );
  };

  return (
    <div
      className={cn(
        "min-h-svh flex items-center justify-center",
        "bg-background",
        "relative overflow-hidden"
      )}
    >
      {/* Subtle geometric background accents */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-6">
        {/* Branding */}
        <div className="flex flex-col items-center mb-10">
          <img
            src="/logo.svg"
            alt="Smart Queue"
            className="w-14 h-14 mb-4"
          />
          <h1
            className="text-2xl font-bold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Smart Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administration Portal
          </p>
        </div>

        {/* Login card */}
        <div
          className={cn(
            "rounded-2xl border border-border bg-card p-8",
            "shadow-xl"
          )}
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-card-foreground">
              Sign in
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enter your credentials to continue
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              className={cn(
                "flex items-start gap-2.5 p-3 rounded-lg mb-5",
                "bg-destructive/10 text-destructive text-sm",
                "border border-destructive/20"
              )}
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@hospital.local"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <InputPassword
                id="password"
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          On-premise hospital queue management
        </p>
      </div>
    </div>
  );
}
