import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

export function generateReference() {
  return `CT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

export function jsonError(status, message) {
  return NextResponse.json({ erreur: message }, { status });
}

export function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}
