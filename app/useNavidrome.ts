import { useState, useEffect } from "react";

export interface NavidromeTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // в секундах
  coverArt: string;
  streamUrl: string; // Готовая ссылка для <audio src="...">
  coverUrl: string; // Готовая ссылка для <img src="...">
}

export function useNavidrome() {
  const [playlist, setPlaylist] = useState<NavidromeTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPlaylist = async () => {
      setLoading(true);
      setError(null);

      try {
        // Обращаемся к нашему безопасному внутреннему API-прокси
        const response = await fetch(`/api/navidrome?action=playlist`);

        if (!isMounted) return;

        if (!response.ok) {
          // Защита от падения, если сервер возвращает HTML (например, 404 Not Found)
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await response.json();
            throw new Error(errData.error || "Failed to receive playlist");
          } else {
            throw new Error(`Proxy server not available (Status: ${response.status}). Make sure that route.ts is in app/api/navidrome/`);
          }
        }

        const tracks: NavidromeTrack[] = await response.json();
        setPlaylist(tracks);
      } catch (err) {
        if (!isMounted) return;
        console.error("Navidrome Fetch Error:", err);
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPlaylist();

    return () => {
      isMounted = false;
    };
  }, []);

  return { playlist, loading, error };
}