import { useEffect, useState } from "react";
import { mapAuthProfile } from "../models/profileModel.js";
import { fetchAuthProfile } from "../services/authService.js";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const data = await fetchAuthProfile();
        if (!cancelled) setProfile(mapAuthProfile(data));
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load profile");
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    profile,
    loading,
    error,
  };
}
