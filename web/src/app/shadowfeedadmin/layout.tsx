import { AdminAuthGate } from './components/AdminAuthGate';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] font-mono text-white">
      <AdminAuthGate>
        {children}
      </AdminAuthGate>
    </div>
  );
}
