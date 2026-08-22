import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { jsonError } from '@/lib/utils';

export async function GET(request, { params }) {
  const { id } = await params;
  const centre = await get('SELECT * FROM centres WHERE id = ?', [id]);
  if (!centre) return jsonError(404, 'Centre introuvable.');
  return NextResponse.json({ centre });
}
