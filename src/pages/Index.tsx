import { useState, useEffect } from "react";
import Dashboard from "./Dashboard";
import NotFound from "./NotFound";

interface User {
  id: string;
  email: string;
  imacx_id: string;
  loginTime: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("vitaminDUser");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (err) {
      console.error("Error parsing user data:", err);
      localStorage.removeItem("vitaminDUser");
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Unauthenticated users see NotFound on "/"
    return <NotFound />;
  }

  return <Dashboard />;
};

export default Index;
