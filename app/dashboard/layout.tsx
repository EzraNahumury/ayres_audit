import Sidebar from "@/app/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ marginLeft: 230, minHeight: "100vh", background: "#f5f6fa" }}>
        {children}
      </main>
    </div>
  );
}
