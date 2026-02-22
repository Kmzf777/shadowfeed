import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminToken = process.env.SHADOWFEED_ADMIN_TOKEN;

  if (adminToken) {
    const cookieStore = await cookies();
    const headersList = await headers();
    const cookieToken = cookieStore.get('sf-admin-token')?.value;
    const headerToken = headersList.get('x-sf-admin-token');

    if (cookieToken !== adminToken && headerToken !== adminToken) {
      notFound();
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-mono text-white">
      {children}
    </div>
  );
}
