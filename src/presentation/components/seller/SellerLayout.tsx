import { useState } from 'react';
import { SellerSidebar } from './SellerSidebar';
import { SellerTopbar } from './SellerTopbar';

export function SellerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background relative overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px]" />
        <div className="absolute top-1/4 right-[-100px] w-[500px] h-[500px] rounded-full bg-primary/12 blur-[120px]" />
        <div className="absolute bottom-[-80px] left-1/3 w-[550px] h-[550px] rounded-full bg-primary/15 blur-[140px]" />
      </div>
      <SellerSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 min-w-0 relative z-10 flex flex-col">
        <SellerTopbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
