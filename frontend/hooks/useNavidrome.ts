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

export type NavidromeError =
  | {
      kind: "playlist";
    }
  | {
      kind: "proxyUnavailable";
      status: number;
    }
  | {
      kind: "unexpected";
    };

export function useNavidrome() {
  const [playlist, setPlaylist] = useState<NavidromeTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<NavidromeError | null>(null);

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
            setError({ kind: "playlist" });
          } else {
            setError({ kind: "proxyUnavailable", status: response.status });
          }

          return;
        }

        const tracks: NavidromeTrack[] = await response.json();
        if (!isMounted) return;
        setPlaylist(tracks);
      } catch (err) {
        if (!isMounted) return;
        console.error("Navidrome Fetch Error:", err);
        setError({ kind: "unexpected" });
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
