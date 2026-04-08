import { useState, useEffect } from "react";
import { getCurrentUser } from "../supabase";

export const useCurrentUser = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        // Fallback to deepakrajput0006@gmail.com if not logged in
        setUserEmail(user?.email || "deepakrajput0006@gmail.com");
      } catch (error) {
        console.error("Error fetching user:", error);
        setUserEmail("deepakrajput0006@gmail.com");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  return { userEmail, isLoading };
};
