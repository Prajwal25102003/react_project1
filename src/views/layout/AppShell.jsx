import { Outlet } from "react-router-dom";
import { useHeader } from "../../controllers/headerController.js";
import { useNav, useSidebar } from "../../controllers/navController.js";
import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";

function AppShell() {
  const header = useHeader();
  const { groups } = useNav(header.notifications);
  const { sidebarToggle, toggleSidebar, closeSidebar } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        groups={groups}
        sidebarToggle={sidebarToggle}
        onClose={closeSidebar}
      />

      <div className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <Header
          sidebarToggle={sidebarToggle}
          onToggleSidebar={toggleSidebar}
          menuToggle={header.menuToggle}
          onToggleMenu={header.toggleMenu}
          notificationsOpen={header.notificationsOpen}
          onToggleNotifications={header.toggleNotifications}
          onCloseNotifications={header.closeNotifications}
          notifications={header.notifications}
          notificationsLoading={header.notificationsLoading}
          hasUnread={header.hasUnread}
          notificationsRef={header.notificationsRef}
          onAcknowledgeNotification={header.acknowledgeNotification}
          user={header.user}
          userOpen={header.userOpen}
          onToggleUserMenu={header.toggleUserMenu}
          userMenuItems={header.userMenuItems}
          userRef={header.userRef}
          onSignOut={header.handleSignOut}
        />
        <main className="min-w-0 w-full">
          <div className="mx-auto min-w-0 w-full max-w-(--breakpoint-2xl) p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
