import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  
  if (!username) {
    return new NextResponse('Missing username', { status: 400 });
  }

  try {
    const res = await fetch(`https://github.com/${username}.png?size=200`, {
      next: { revalidate: 86400 } // Cache for 24 hours
    });
    
    if (!res.ok) {
      throw new Error('Failed to fetch avatar');
    }
    
    const blob = await res.blob();
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error('Avatar fetch error:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
