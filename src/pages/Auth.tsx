import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@supabase/supabase-js";

const EDGE_FUNCTION_URL =
  "https://jjtvugsixtauuwyyzkoc.supabase.co/functions/v1/imacx-login";

const supabase = createClient(
  "https://jjtvugsixtauuwyyzkoc.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqdHZ1Z3NpeHRhdXV3eXl6a29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMzMxMTIsImV4cCI6MjA3NDYwOTExMn0.NbIzQIouOFTQfbvZVHI4TnHtBT08uct2nuMMwx6HhHc"
);

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleIMACXLogin = useCallback(
    async (id: string) => {
      setIsLoading(true);

      try {
        const { data: beUser, error: beError } = await supabase
          .from("users")
          .select("*")
          .eq("imacx_id", id)
          .maybeSingle();

        console.log("BE User check:", beUser, "Error:", beError);

        if (beUser) {
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

            if (!result.session?.user) {
              throw new Error("Invalid session response");
            }

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

            localStorage.setItem("vitaminDUser", JSON.stringify(userData));

            toast({
              title: "Authentication successful",
              description: `Welcome back, ${beUser.name}!`,
            });

            navigate("/", { replace: true });
          } catch (edgeFunctionError: any) {
            console.error(
              "Edge Function failed, logging in anyway:",
              edgeFunctionError
            );

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

            localStorage.setItem("vitaminDUser", JSON.stringify(userData));

            toast({
              title: "Authentication successful",
              description: `Welcome back, ${beUser.name}!`,
            });

            navigate("/", { replace: true });
          }
        } else {
          const { data: bmUsers, error: bmError } = await supabase
            .from("usersbm")
            .select("*")
            .eq("imacx_id", id)
            .order("id", { ascending: true });

          console.log("BM Users check:", bmUsers, "Error:", bmError);

          if (!bmUsers || bmUsers.length === 0) {
            throw new Error("Invalid IMACX ID - User not found in any table");
          }

          const bmUser = bmUsers[0];
          const bmUserId =
            bmUser.id &&
            bmUser.id !== "undefined" &&
            bmUser.id.length > 0
              ? bmUser.id
              : crypto.randomUUID();

          const allBeTerritories = bmUsers
            .map((row: any) => row.beterritory)
            .filter((t: string) => t && t.trim().length > 0)
            .join(",");

          const userData = {
            id: bmUserId,
            email: bmUser.email || `${id}@company.com`,
            imacx_id: id,
            role: "BM",
            territory: bmUser.territory,
            beterritory: allBeTerritories,
            name: bmUser.name,
            phone: bmUser.phone,
            loginTime: new Date().toISOString(),
          };

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

        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        });

        // If auto-login fails, go to NotFound via root (user not logged)
        navigate("/", { replace: true });
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, toast]
  );

  useEffect(() => {
    const encodedParam = searchParams.get("data");
    if (!encodedParam) {
      // No token given: do not show any login UI, just send them to "/"
      navigate("/", { replace: true });
      return;
    }

    let decodedId: string | null = null;
    try {
      decodedId = atob(encodedParam);
      if (!decodedId) throw new Error("Invalid encoded data");
    } catch (err) {
      toast({
        title: "Invalid Link",
        description: "Please try again.",
        variant: "destructive",
      });
      navigate("/", { replace: true });
      return;
    }

    handleIMACXLogin(decodedId);
  }, [searchParams, handleIMACXLogin, toast, navigate]);

  // Optional minimal loading UI (user never sees a form here)
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Authenticating...</p>
      </div>
    );
  }

  // When not loading, nothing to show; redirects will already have happened
  return null;
};

export default Auth;
