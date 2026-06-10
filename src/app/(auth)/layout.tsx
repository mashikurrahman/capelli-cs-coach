export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1e3d] via-[#003087] to-[#1a4a9f] flex items-center justify-center p-4">
      {children}
    </div>
  );
}
