import { Outlet } from '@tanstack/react-router';
import Sidebar from '@shared/components/layout/Sidebar';
import Header from '@shared/components/layout/Header';
import { SidebarInset } from '@shared/components/ui/sidebar';
import { Spinner } from '@shared/components/ui/spinner';

interface MainLayoutProps {
  isLoading?: boolean;
}

export default function MainLayout({ isLoading }: MainLayoutProps) {
  return (
    <>
      <Sidebar />
      <SidebarInset className="flex flex-col h-screen md:peer-data-[variant=inset]:h-[calc(100vh-1rem)] md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:rounded-2xl md:peer-data-[variant=inset]:shadow-sm overflow-hidden relative">
        <Header />
        <main className="flex-1 px-6 lg:px-10 py-10 w-full overflow-y-auto animate-fade-in">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Spinner className="w-8 h-8" />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </SidebarInset>
    </>
  );
}
