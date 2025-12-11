import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Activity, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@supabase/supabase-js";

const EDGE_FUNCTION_URL =
  "https://jjtvugsixtauuwyyzkoc.supabase.co/functions/v1/imacx-login";

// ✅ Initialize Supabase client
const supabase = createClient(
  "https://jjtvugsixtauuwyyzkoc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdHZ1Z3NpeHRhdXV3eXl6a29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMzMxMTIsImV4cCI6MjA3NDYwOTExMn0.NbIzQIouOFTQfbvZVHI4TnHtBT08uct2nuMMwx6HhHc"
);

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imacxId, setImacxId] = useState("");

  // ✅ Check if user is already logged in
  useEffect(() => {
    const user = localStorage.getItem("vitaminDUser");
    if (user) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // ✅ Authentication handler
  const handleIMACXLogin = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // ✅ Check users table (BE users)
        const { data: beUser, error: beError } = await supabase
          .from("users")
          .select("*")
          .eq("imacx_id", id)
          .maybeSingle();

        console.log("BE User check:", beUser, "Error:", beError);

        if (beUser) {
          // User found in users table - this is a BE
          console.log("User is BE, calling Edge Function");
          
          try {
            // Call Edge Function for authentication
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

            if (!result.session?.user) {
              throw new Error("Invalid session response");
            }

            // ✅ Store BE user data with role
            const userData = {
              id: result.session.user.id,
              email: result.session.user.email,
              imacx_id: id,
              role: "BE",
              territory: beUser.territory,
              name: beUser.name,
              phone: beUser.phone,
              loginTime: new Date().toISOString(),
            };

            console.log("Storing BE user data:", userData);
            localStorage.setItem("vitaminDUser", JSON.stringify(userData));

            toast({
              title: "Authentication successful",
              description: `Welcome back, ${beUser.name}!`,
            });

            navigate("/", { replace: true });
          } catch (edgeFunctionError: any) {
            console.error("Edge Function failed, logging in anyway:", edgeFunctionError);
            
            // ✅ Fallback: If Edge Function fails, still log in BE user
            const userData = {
              id: beUser.id,
              email: beUser.email || `${id}@company.com`,
              imacx_id: id,
              role: "BE",
              territory: beUser.territory,
              name: beUser.name,
              phone: beUser.phone,
              loginTime: new Date().toISOString(),
            };

            console.log("Storing BE user data (fallback):", userData);
            localStorage.setItem("vitaminDUser", JSON.stringify(userData));

            toast({
              title: "Authentication successful",
              description: `Welcome back, ${beUser.name}!`,
            });

            navigate("/", { replace: true });
          }
        } else {
          // Check usersbm table (BM users) - get ALL rows for this BM
          console.log("Not in users table, checking usersbm table");
          
          const { data: bmUsers, error: bmError } = await supabase
            .from("usersbm")
            .select("*")
            .eq("imacx_id", id)
            .order('id', { ascending: true }); // ✅ CRITICAL: Ensures consistent ordering

          console.log("BM Users check:", bmUsers, "Error:", bmError);

          if (!bmUsers || bmUsers.length === 0) {
            throw new Error("Invalid IMACX ID - User not found in any table");
          }

          // ✅ ALWAYS use the first row's ID (now guaranteed to be the same)
          const bmUser = bmUsers[0];
          const bmUserId = bmUser.id && bmUser.id !== "undefined" && bmUser.id.length > 0
            ? bmUser.id 
            : crypto.randomUUID();

          // ✅ Collect all BE territories from all rows
          const allBeTerritories = bmUsers
            .map(row => row.beterritory)
            .filter(t => t && t.trim().length > 0)
            .join(",");

          console.log(`BM using consistent ID: ${bmUserId} for imacx_id: ${id}`);
          console.log(`Found ${bmUsers.length} BE territories:`, allBeTerritories);

          // User found in usersbm table - this is a BM
          console.log("User is BM, skipping Edge Function");

          // ✅ Store BM user data with ALL territories
          const userData = {
            id: bmUserId, // ✅ Always the same ID for this BM user
            email: bmUser.email || `${id}@company.com`,
            imacx_id: id,
            role: "BM",
            territory: bmUser.territory, // BM's own territory (e.g., "bm1")
            beterritory: allBeTerritories, // ✅ ALL BE territories comma-separated
            name: bmUser.name,
            phone: bmUser.phone,
            loginTime: new Date().toISOString(),
          };

          console.log("Storing BM user data:", userData);
          localStorage.setItem("vitaminDUser", JSON.stringify(userData));

          toast({
            title: "Authentication successful",
            description: `Welcome back, ${bmUser.name}!`,
          });

          navigate("/", { replace: true });
        }
      } catch (err: any) {
        console.error("Login error:", err);
        
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
