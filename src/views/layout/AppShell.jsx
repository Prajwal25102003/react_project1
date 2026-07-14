import { Outlet } from 'react-router-dom'
import { useHeader } from '../../controllers/headerController.js'
import { useNav, useSidebar } from '../../controllers/navController.js'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

function AppShell() {
  const { groups, promo } = useNav()
  const { sidebarToggle, toggleSidebar, closeSidebar } = useSidebar()
  const header = useHeader()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        groups={groups}
        promo={promo}
        sidebarToggle={sidebarToggle}
        onClose={closeSidebar}
      />

      <div className="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <Header
          sidebarToggle={sidebarToggle}
          onToggleSidebar={toggleSidebar}
          menuToggle={header.menuToggle}
          onToggleMenu={header.toggleMenu}
          searchQuery={header.searchQuery}
          onSearchChange={header.setSearchQuery}
          darkMode={header.darkMode}
          onToggleDarkMode={header.toggleDarkMode}
          notificationsOpen={header.notificationsOpen}
          notifying={header.notifying}
          onToggleNotifications={header.toggleNotifications}
          onCloseNotifications={header.closeNotifications}
          notifications={header.notifications}
          notificationsRef={header.notificationsRef}
          user={header.user}
          userOpen={header.userOpen}
          onToggleUserMenu={header.toggleUserMenu}
          userMenuItems={header.userMenuItems}
          userRef={header.userRef}
        />
        <main>
          <div className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppShell
