"use client";
import Sidebar from "@/src/components/sidebar";
import Header from "@/src/components/header";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Sidebar cố định bên trái */}
      <aside className="w-64 h-screen sticky top-0 flex-shrink-0 border-r bg-white z-20">
        <Sidebar />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header cố định phía trên */}
        <header className="h-16 sticky top-0 z-10 border-b bg-white/80 backdrop-blur-md flex-shrink-0">
          <Header />
        </header>

        {/* Nội dung thay đổi theo từng trang */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}