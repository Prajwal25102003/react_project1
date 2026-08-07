import { useEffect, useState } from "react";
import { DATA_REFRESH_EVENT } from "../utils/dataRefresh.js";

export function useListData(fetcher, fallbackError) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadRows() {
      try {
        setLoading(true);
        setError("");
        const data = await fetcher();
        if (!cancelled) {
          setRows(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || fallbackError);
          setRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRows();

    return () => {
      cancelled = true;
    };
  }, [fetcher, fallbackError, reloadToken]);

  useEffect(() => {
    function handleDataRefresh() {
      setReloadToken((token) => token + 1);
    }
    window.addEventListener(DATA_REFRESH_EVENT, handleDataRefresh);
    return () => {
      window.removeEventListener(DATA_REFRESH_EVENT, handleDataRefresh);
    };
  }, []);

  function reload() {
    setReloadToken((token) => token + 1);
  }

  return { rows, loading, error, reload };
}
