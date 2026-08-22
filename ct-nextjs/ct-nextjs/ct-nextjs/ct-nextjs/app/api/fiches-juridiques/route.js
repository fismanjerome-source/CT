import { NextResponse } from 'next/server';
import { all } from '@/lib/db';
import { getSession, getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const sessionPro = await getSession();
  const sessionAdmin = await getAdminSession();
  if (!sessionPro && !sessionAdmin) return jsonError(401, 'Non authentifié.');

  const fiches = await all('SELECT * FROM fiches_juridiques ORDER BY ordre, id');
  return NextResponse.json({ fiches });
}
