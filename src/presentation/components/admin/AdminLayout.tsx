import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { Menu } from 'lucide-react';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background relative overflow-hidden">
      {/* Color blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px]" />
        <div className="absolute top-1/4 right-[-100px] w-[500px] h-[500px] rounded-full bg-primary/12 blur-[120px]" />
        <div className="absolute bottom-[-80px] left-1/3 w-[550px] h-[550px] rounded-full bg-primary/15 blur-[140px]" />
      </div>
      <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 min-w-0 relative z-10 flex flex-col">
        {/* Mobile topbar */}
        <div className="md:hidden h-14 flex items-center px-4 border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-muted-foreground hover:bg-muted/40 transition-colors">
            <Menu size={22} />
          </button>
        </div>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
