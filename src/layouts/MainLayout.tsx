import React from 'react';
import { Outlet } from '@tanstack/react-router';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { SidebarInset } from '../components/ui/sidebar';
import { Spinner } from '../components/ui/spinner';

interface MainLayoutProps {
  isLoading?: boolean;
}

export default function MainLayout({ isLoading }: MainLayoutProps) {
  return (
    <>
      <Sidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden relative">
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
