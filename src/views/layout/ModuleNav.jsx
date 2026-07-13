function ModuleIcon({ id, className }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': true,
  }

  switch (id) {
    case 'dashboard':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )
    case 'employees':
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="3" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a3 3 0 0 1 0 5.74" />
        </svg>
      )
    case 'departments':
      return (
        <svg {...common}>
          <path d="M12 3v6" />
          <circle cx="12" cy="3" r="2" />
          <path d="M6 21v-6M12 21v-6M18 21v-6" />
          <path d="M6 15h12" />
          <circle cx="6" cy="21" r="2" />
          <circle cx="12" cy="21" r="2" />
          <circle cx="18" cy="21" r="2" />
        </svg>
      )
    case 'attendance':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )
    case 'leave-requests':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 3v4M16 3v4" />
          <path d="M9 15l2 2 4-4" />
        </svg>
      )
    default:
      return null
  }
}

function ModuleNav({ modules, activeModuleId, onSelectModule }) {
  return (
    <nav
      className="mt-6 flex flex-col gap-1 overflow-y-auto sm:mt-8 sm:gap-1.5"
      aria-label="Modules"
    >
      {modules.map((module) => {
        const isActive = module.id === activeModuleId

        return (
          <button
            key={module.id}
            type="button"
            onClick={() => onSelectModule(module.id)}
            className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[#E8943A] text-white'
                : 'text-white/85 hover:bg-white/10'
            }`}
          >
            <ModuleIcon id={module.id} className="h-5 w-5 shrink-0" />
            <span>{module.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

export default ModuleNav
