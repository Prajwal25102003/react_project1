import ModuleNav from './ModuleNav.jsx'

function HexLogo({ className }) {
  return (
    <svg
      viewBox="0 0 40 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20 2L36.5 11.5V30.5L20 40L3.5 30.5V11.5L20 2Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M20 10L28 14.5V25.5L20 30L12 25.5V14.5L20 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M20 16V24M16.5 18.5L20 24L23.5 18.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CloseIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function BrandBlock({ mark, titleClassName, subtitle, subtitleClassName }) {
  return (
    <div className="relative mx-auto w-fit max-w-full leading-tight text-center">
      <div className="absolute top-1/2 right-full mr-2 -translate-y-1/2 sm:mr-3">
        {mark}
      </div>
      <p className={titleClassName}>EMP:SYS</p>
      <p className={subtitleClassName}>{subtitle}</p>
    </div>
  )
}

function LeftPanel({
  isOpen,
  onClose,
  modules,
  activeModuleId,
  onSelectModule,
  nodeLabel,
}) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] flex-col bg-[#0E4752] px-3 py-4 transition-transform duration-200 ease-out sm:px-4 sm:py-5 md:static md:z-auto md:w-[20%] md:min-w-[14rem] md:max-w-[18rem] md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="mb-2 flex items-center justify-end md:hidden">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white/90 hover:bg-white/10"
          aria-label="Close menu"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <header className="flex items-center justify-center px-6 sm:px-8">
        <div className="relative w-fit leading-tight text-center">
          <img
            src="/logo.png?v=4"
            alt=""
            className="absolute top-1/2 right-full mr-2 h-10 w-10 -translate-y-1/2 object-contain sm:mr-3 sm:h-12 sm:w-12"
          />
          <p className="text-base font-bold tracking-[0.08em] text-[#E8C547] sm:text-lg">
            EMP:SYS
          </p>
          <p className="text-[11px] font-medium tracking-[0.12em] text-white sm:text-xs">
            SEC-OPS
          </p>
        </div>
      </header>

      <ModuleNav
        modules={modules}
        activeModuleId={activeModuleId}
        onSelectModule={onSelectModule}
      />

      <div className="flex-1" />

      <footer className="flex items-center justify-center border-t border-white/15 px-6 pt-4 sm:px-8">
        <BrandBlock
          mark={<HexLogo className="h-8 w-7 text-[#E8C547] sm:h-9 sm:w-8" />}
          titleClassName="text-sm font-semibold tracking-[0.2em] text-[#E8C547]"
          subtitle={nodeLabel}
          subtitleClassName="mt-0.5 text-[10px] font-medium tracking-[0.18em] text-white/80"
        />
      </footer>
    </aside>
  )
}

export default LeftPanel
