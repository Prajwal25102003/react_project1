function HexLogo({ className, stroke = 'currentColor' }) {
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
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M20 10L28 14.5V25.5L20 30L12 25.5V14.5L20 10Z"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M20 16V24M16.5 18.5L20 24L23.5 18.5"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LeftPanel() {
  return (
    <aside className="flex w-[20%] flex-col bg-[#0E4752] px-4 py-5">
      <header className="flex items-center justify-center">
        <div className="relative leading-tight text-center">
          <img
            src="/logo.png?v=4"
            alt=""
            className="absolute top-1/2 right-full mr-3 h-12 w-12 -translate-y-1/2 object-contain"
          />
          <p className="text-lg font-bold tracking-[0.08em] text-[#E8C547]">
            EMP:SYS
          </p>
          <p className="text-xs font-medium tracking-[0.12em] text-white">
            SEC-OPS
          </p>
        </div>
      </header>

      <div className="flex-1" />

      <footer className="flex items-center justify-center border-t border-white/15 pt-4">
        <div className="relative leading-tight text-center">
          <HexLogo className="absolute top-1/2 right-full mr-3 h-9 w-8 -translate-y-1/2 text-[#E8C547]" />
          <p className="text-sm font-semibold tracking-[0.2em] text-[#E8C547]">
            EMP:SYS
          </p>
          <p className="mt-0.5 text-[10px] font-medium tracking-[0.18em] text-white/80">
            SECURE NODE
          </p>
        </div>
      </footer>
    </aside>
  )
}

export default LeftPanel
