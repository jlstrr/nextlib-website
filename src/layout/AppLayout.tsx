import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import BottomNavigation from "./BottomNavigation";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <AppSidebar />
        <Backdrop />
      </div>

      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${
          isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
        }`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6 pb-20 lg:pb-6">
          <Outlet />
        </div>
      </div>
      
      {/* Bottom Navigation - only shown on mobile */}
      <BottomNavigation />
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
