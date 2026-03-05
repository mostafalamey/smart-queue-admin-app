import { type FormEvent, useState } from "react";
import { useGetIdentity, useLogout, useNotification } from "@refinedev/core";
import { useNavigate } from "react-router";
import { InputPassword } from "@/components/refine-ui/form/input-password";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { apiJson } from "@/lib/api-client";
import { getStoredUser, setStoredUser, type StoredUser } from "@/lib/stored-user";
import { AlertCircle, Loader2 } from "lucide-react";

const PASSWORD_MIN_LENGTH = 12;

function validatePassword(pw: string): string | null {
  if (pw.length < PASSWORD_MIN_LENGTH) return `Minimum ${PASSWORD_MIN_LENGTH} characters.`;
  if (!/[A-Z]/.test(pw)) return "Must include an uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Must include a lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Must include a digit.";
  if (!/[^A-Za-z0-9]/.test(pw)) return "Must include a symbol.";
  return null;
}

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { open } = useNotification();
  const navigate = useNavigate();
  const { mutate: logout } = useLogout();
  const { data: identity } = useGetIdentity<{
    id: string;
    email: string;
    role: string;
    departmentId?: string;
    mustChangePassword: boolean;
  }>();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const pwError = validatePassword(newPassword);
    if (pwError) {
      setError(pwError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must differ from current password.");
      return;
    }

    setLoading(true);

    try {
      await apiJson<{ success: boolean }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      // Update stored user to clear mustChangePassword
      const source = identity ?? getStoredUser();
      if (source) {
        setStoredUser({
          id: source.id,
          email: source.email,
          role: source.role as StoredUser["role"],
          departmentId: source.departmentId,
          mustChangePassword: false,
        });
      }

      open?.({
        type: "success",
        message: "Password changed successfully.",
      });

      navigate("/");
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string };
      const messages: Record<string, string> = {
        INVALID_CREDENTIALS: "Current password is incorrect.",
        INVALID_REQUEST: apiErr?.message ?? "Invalid request.",
      };
      setError(messages[apiErr?.code ?? ""] ?? apiErr?.message ?? "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicators
  const checks = [
    { label: `${PASSWORD_MIN_LENGTH}+ characters`, ok: newPassword.length >= PASSWORD_MIN_LENGTH },
    { label: "Uppercase letter", ok: /[A-Z]/.test(newPassword) },
    { label: "Lowercase letter", ok: /[a-z]/.test(newPassword) },
    { label: "Digit", ok: /[0-9]/.test(newPassword) },
    { label: "Symbol", ok: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  return (
    <div
      className={cn(
        "min-h-svh flex items-center justify-center",
        "bg-background",
        "relative overflow-hidden"
      )}
    >
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
            Change Password
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            You must set a new password before continuing
          </p>
        </div>

        {/* Form card */}
        <div
          className={cn(
            "rounded-2xl border border-border bg-card p-8",
            "shadow-xl"
          )}
        >
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
              <Label htmlFor="current-password">Current Password</Label>
              <InputPassword
                id="current-password"
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                autoFocus
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <InputPassword
                id="new-password"
                placeholder="••••••••••••"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />

              {/* Strength checks */}
              {newPassword.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                  {checks.map((c) => (
                    <span
                      key={c.label}
                      className={cn(
                        "text-xs flex items-center gap-1.5 transition-colors",
                        c.ok ? "text-accent" : "text-muted-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block w-1.5 h-1.5 rounded-full",
                          c.ok ? "bg-accent" : "bg-muted-foreground/40"
                        )}
                      />
                      {c.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <InputPassword
                id="confirm-password"
                placeholder="••••••••••••"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-xs text-destructive mt-1">Passwords do not match.</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating…
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>

          {/* Escape hatch — logout if this isn't a forced flow */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => logout()}
              className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Sign out instead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
