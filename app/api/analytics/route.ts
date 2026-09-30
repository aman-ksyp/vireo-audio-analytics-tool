import { NextResponse } from 'next/server'
import { getAnalytics } from '@/lib/analytics-data'

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q') ?? ''
  return NextResponse.json(await getAnalytics(query), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
