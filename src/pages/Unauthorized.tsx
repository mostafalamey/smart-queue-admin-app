import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ShieldX } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <ShieldX className="h-16 w-16 text-destructive" strokeWidth={1.5} />
      <h1 className="text-2xl font-semibold tracking-tight">
        Access Denied
      </h1>
      <p className="text-muted-foreground max-w-sm">
        You don't have permission to view this section. Contact your
        administrator if you believe this is a mistake.
      </p>
      <Button variant="outline" onClick={() => navigate("/")}>
        Back to Home
      </Button>
    </div>
  );
}
