import { POST as statusPost } from '@/app/api/admin/auction/status/route';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = JSON.stringify({ action: 'reset' });
  const patched = new Request(request.url, { method: 'POST', headers: request.headers, body });
  return statusPost(patched);
}
