import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  showSidebars?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showSidebars = false,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className={`pt-16 ${showSidebars ? '' : 'container mx-auto px-4'}`}>
        {children}
      </main>
    </div>
  );
};
