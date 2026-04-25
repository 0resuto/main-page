import { NextRequest, NextResponse } from "next/server";

interface SubsonicTrack {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  duration?: number;
  coverArt?: string;
}

const SAFE_PROXY_RESPONSE_HEADERS = [
  "accept-ranges",
  "cache-control",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified",
] as const;

function pickProxyResponseHeaders(source: Headers) {
  const headers = new Headers();

  for (const headerName of SAFE_PROXY_RESPONSE_HEADERS) {
    const value = source.get(headerName);
    if (value) {
      headers.set(headerName, value);
    }
  }

  return headers;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get("action");
  const id = searchParams.get("id");

  // Переменные БЕЗ NEXT_PUBLIC_ читаются только на сервере и никогда не попадут в браузер
  const serverUrl = process.env.NAVIDROME_URL;
  const user = process.env.NAVIDROME_USER;
  const token = process.env.NAVIDROME_TOKEN;
  const salt = process.env.NAVIDROME_SALT;
  const playlistId = process.env.NAVIDROME_PLAYLIST_ID;

  if (!serverUrl || !user || !token || !salt || !playlistId) {
    return NextResponse.json({ error: "Отсутствуют серверные настройки Navidrome" }, { status: 500 });
  }

  // Базовая строка авторизации, скрытая на сервере
  const authQuery = `?u=${user}&t=${token}&s=${salt}&v=1.16.1&c=0resuto&f=json`;

  try {
    if (action === "playlist") {
      // Запрашиваем плейлист
      const res = await fetch(`${serverUrl}/rest/getPlaylist${authQuery}&id=${playlistId}`);
      
      // Защита от падения, если удаленный сервер Navidrome недоступен и отдает HTML-страницу ошибки
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return NextResponse.json({ error: "Navidrome вернул неверный формат данных (проверьте настройки NAVIDROME_URL в .env)" }, { status: 502 });
      }

      const data = await res.json();
      const subsonicRes = data["subsonic-response"];
      if (subsonicRes.status === "failed") {
        return NextResponse.json({ error: subsonicRes.error?.message }, { status: 400 });
      }

      const entries = subsonicRes.playlist?.entry || [];
      
      // Формируем безопасные URL-адреса, которые ведут на этот же прокси-роут, а не на реальный сервер
      const tracks = entries.map((track: SubsonicTrack) => ({
        id: track.id,
        title: track.title,
        artist: track.artist || "Неизвестный исполнитель",
        album: track.album || "Неизвестный альбом",
        duration: track.duration || 0,
        // Теперь ссылки безопасные и не содержат токенов:
        streamUrl: `/api/navidrome?action=stream&id=${track.id}`,
        coverUrl: `/api/navidrome?action=cover&id=${track.coverArt || track.id}`
      }));

      return NextResponse.json(tracks);
    } 
    
    if (action === "stream" || action === "cover") {
      // Проксируем аудиопоток или картинку
      const endpoint = action === "stream" ? "stream" : "getCoverArt";
      const sizeParam = action === "cover" ? "&size=300" : "";
      
      const res = await fetch(`${serverUrl}/rest/${endpoint}${authQuery}&id=${id}${sizeParam}`);
      
      // Пропускаем только заголовки, которые реально нужны браузеру для media/image response.
      const headers = pickProxyResponseHeaders(res.headers);

      return new NextResponse(res.body, { status: res.status, headers });
    }
  } catch {
    return NextResponse.json({ error: "Ошибка проксирования Navidrome" }, { status: 500 });
  }
}
