import { useHealthStatus } from '../../controllers/healthController.js'
import { useNavModules } from '../../controllers/navController.js'
import { useSidebar } from '../../controllers/layoutController.js'
import LeftPanel from './LeftPanel.jsx'
import RightPanel from './RightPanel.jsx'
import MobileHeader from './MobileHeader.jsx'

function AppShell() {
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar()
  const { modules, activeModuleId, selectModule } = useNavModules()
  const { nodeLabel } = useHealthStatus()

  function handleSelectModule(moduleId) {
    selectModule(moduleId)
    closeSidebar()
  }

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#E9ECF3]">
      <MobileHeader onOpenSidebar={openSidebar} />

      {isSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/45 md:hidden"
          aria-label="Close menu"
          onClick={closeSidebar}
        />
      ) : null}

      <LeftPanel
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        modules={modules}
        activeModuleId={activeModuleId}
        onSelectModule={handleSelectModule}
        nodeLabel={nodeLabel}
      />

      <RightPanel />
    </div>
  )
}

export default AppShell
