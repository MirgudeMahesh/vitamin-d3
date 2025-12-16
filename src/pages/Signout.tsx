import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom"; // react-router v6+ [web:16]
import { LogOut } from "lucide-react"; // or wherever your icon comes from
import { Button } from "@/components/ui/button"; // adjust to your project
import { useToast } from "@/components/ui/use-toast"; // adjust to your project

const Signout: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = useCallback(() => {
    try {
      // Clear user session from storage
      localStorage.removeItem("vitaminDUser");
      sessionStorage.clear();

      toast({
        title: "Signed Out",
        description: "You have been logged out successfully.",
      });

      // Redirect to login page
      navigate("/auth", { replace: true });
    } catch (err: unknown) {
      // Better typing for errors in TypeScript [web:18]
      console.error("Logout error:", err);

      // Force logout anyway
      localStorage.removeItem("vitaminDUser");
      sessionStorage.clear();
      navigate("/auth", { replace: true });
    }
  }, [toast, navigate]);

  return (
    <div>
      <Button variant="ghost" onClick={handleSignOut}>
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </div>
  );
};

export default Signout;
