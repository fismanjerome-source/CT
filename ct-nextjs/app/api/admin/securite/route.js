import { NextResponse } from 'next/server';
import { get } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { jsonError } from '@/lib/utils';

export async function GET() {
  const session = await getAdminSession();
  if (!session) return jsonError(401, 'Non authentifié.');

  const admin = await get('SELECT nom, email, totp_actif FROM admins WHERE id = ?', [session.adminId]);
  if (!admin) return jsonError(404, 'Compte introuvable.');

  return NextResponse.json({ nom: admin.nom, email: admin.email, totp_actif: !!admin.totp_actif });
}
