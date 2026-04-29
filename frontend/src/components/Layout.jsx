import Sidebar from './Sidebar';
import { Toaster } from 'react-hot-toast';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#15152A',
            color: '#F1F5F9',
            border: '1px solid #2A2A4A',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#15152A' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#15152A' } },
        }}
      />
    </div>
  );
}
