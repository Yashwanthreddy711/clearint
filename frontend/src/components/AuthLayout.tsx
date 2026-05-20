import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6"
      style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      <div className="fade-up w-full max-w-md flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <span className="text-indigo-400 text-xs font-medium w-fit mb-4">
            Clearint
          </span>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-zinc-500 text-sm">{subtitle}</p>
        </div>

        {children}

        <p className="text-zinc-500 text-sm text-center">{footer}</p>
      </div>
    </div>
  );
}
