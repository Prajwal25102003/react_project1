import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { mapAuthProfile } from "../models/profileModel.js";
import { fetchAuthProfile } from "../services/authService.js";

export function useProfile() {
  const navigate = useNavigate();
  const location = useLocation();
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

  function handleBack() {
    if (location.key !== "default") {
      navigate(-1);
      return;
    }
    navigate("/dashboard");
  }

  return {
    profile,
    loading,
    error,
    handleBack,
  };
}
