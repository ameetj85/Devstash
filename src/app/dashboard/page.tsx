import TopBar from "@/components/dashboard/top-bar";
import Sidebar from "@/components/dashboard/sidebar";
import MainContent from "@/components/dashboard/main-content";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
}
