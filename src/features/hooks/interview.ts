import { useState, useEffect } from "react";

export function useInterview(id?: string) {
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return; // no ID yet

    const fetchInterview = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/interview/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch interview");
        }

        setInterview(data.interview);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
        setInterview(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id]);

  return { interview, loading, error };
}