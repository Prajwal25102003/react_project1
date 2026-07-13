function MenuIcon({ className }) {
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
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

function MobileHeader({ onOpenSidebar }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0E4752] px-3 md:hidden">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10"
        aria-label="Open menu"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      <div className="flex min-w-0 items-center gap-2.5">
        <img
          src="/logo.png?v=4"
          alt=""
          className="h-9 w-9 shrink-0 object-contain"
        />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold tracking-[0.08em] text-[#E8C547]">
            EMP:SYS
          </p>
          <p className="truncate text-[10px] font-medium tracking-[0.12em] text-white/90">
            SEC-OPS
          </p>
        </div>
      </div>
    </header>
  )
}

export default MobileHeader
