import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';
import { createSessionToken } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { name, password } = await request.json();
    if (!name || !password) return NextResponse.json({ error: 'Admin name/email and password are required.' }, { status: 400 });
    const supabase = createSupabaseAdmin();
    const { data: admin, error } = await supabase.from('admin').select('*').or(`admin_name.ilike.${name},email.ilike.${name}`).maybeSingle();
    if (error || !admin) return NextResponse.json({ error: 'Invalid admin login.' }, { status: 401 });
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return NextResponse.json({ error: 'Invalid admin login.' }, { status: 401 });
    const token = createSessionToken({ role: 'admin', id: admin.id, name: admin.admin_name });
    return NextResponse.json({ session: { role: 'admin', id: admin.id, name: admin.admin_name, token, expires_at: Date.now() + 12 * 60 * 60 * 1000 } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Login failed.' }, { status: 500 });
  }
}
