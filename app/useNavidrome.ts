import { useState, useEffect } from "react";
import { useLanguage } from "../components/LanguageProvider";

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
  const { t } = useLanguage();
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
            throw new Error(t.musicPlayer.errors.playlist);
          } else {
            throw new Error(
              `${t.musicPlayer.errors.proxyUnavailable} (Status: ${response.status})`,
            );
          }
        }

        const tracks: NavidromeTrack[] = await response.json();
        setPlaylist(tracks);
      } catch (err) {
        if (!isMounted) return;
        console.error("Navidrome Fetch Error:", err);
        setError(err instanceof Error ? err.message : t.musicPlayer.errors.unexpected);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPlaylist();

    return () => {
      isMounted = false;
    };
  }, [t]);

  return { playlist, loading, error };
}
