import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Activity, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EDGE_FUNCTION_URL =
  "https://jjtvugsixtauuwyyzkoc.supabase.co/functions/v1/imacx-login";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imacxId, setImacxId] = useState("");

  // ✅ Monitor session state
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate("/", { replace: true });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // ✅ Authentication handler
  const handleIMACXLogin = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(EDGE_FUNCTION_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imacx_id: id }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Authentication failed");
        }

        const result = await response.json();

        if (!result.session?.access_token) {
          throw new Error("Invalid session response");
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token:
            result.session.refresh_token || result.session.access_token,
        });

        if (sessionError) throw sessionError;

        toast({
          title: "Authentication successful",
          description: "Welcome back!",
        });

        navigate("/", { replace: true });
      } catch (err: any) {
        const errorMessage =
          err.name === "AbortError"
            ? "Request timeout. Please try again."
            : err.message || "Authentication failed";

        setError(errorMessage);
        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, toast]
  );

  // ✅ Decode and authenticate if ?data exists
  useEffect(() => {
    const encodedParam = searchParams.get("data");
    if (!encodedParam) return;

    let decodedId: string | null = null;
    try {
      decodedId = atob(encodedParam);
      if (!decodedId) throw new Error("Invalid encoded data");
    } catch (err) {
      setError("Invalid or corrupted link.");
      toast({
        title: "Invalid Link",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Clean up URL
    // window.history.replaceState({}, document.title, window.location.pathname);

    handleIMACXLogin(decodedId);
  }, [searchParams, handleIMACXLogin, toast]);

  // ✅ When user manually enters IMACX ID and clicks Login
  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imacxId.trim()) {
      toast({
        title: "Missing IMACX ID",
        description: "Please enter your IMACX ID.",
        variant: "destructive",
      });
      return;
    }

    const encoded = btoa(imacxId.trim());
    navigate(`/auth?data=${encoded}`, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background px-4">
      <div className="bg-card shadow-lg rounded-xl p-8 w-full max-w-md text-center space-y-6">
        <h1 className="text-2xl font-bold text-foreground">
          Vitamin D Camp Login
        </h1>
        <p className="text-muted-foreground text-sm">
          Enter your IMACX ID to authenticate
        </p>

        {isLoading ? (
          <div className="space-y-3">
            <Activity className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Authenticating...</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleManualLogin} className="space-y-4">
              <div className="text-left space-y-2">
                <Label htmlFor="imacx">IMACX ID</Label>
                <Input
                  id="imacx"
                  type="text"
                  placeholder="Enter your IMACX ID"
                  value={imacxId}
                  onChange={(e) => setImacxId(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            </form>

            {error && (
              <p className="text-destructive text-sm mt-3">{error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
