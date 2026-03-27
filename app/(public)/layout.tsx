export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-1">
      {/* Left: Hero branding area */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between bg-[#1e3a5f] p-12 text-white">
        <div>
          <h1 className="text-3xl font-bold">
            Build<span className="text-[#f59e0b]">Time</span>
          </h1>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-bold leading-tight">
            Zeiterfassung<br />
            für die Baustelle.
          </h2>
          <p className="text-xl text-blue-200">
            Digital. Einfach. Sicher.
          </p>
          <div className="mt-8 flex gap-6 text-sm text-blue-200/80">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
              GPS-verifiziert
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
              DSGVO-konform
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
              Made in Germany
            </div>
          </div>
        </div>
        <p className="text-sm text-blue-300/60">
          &copy; 2026 Nomad Solutions
        </p>
      </div>

      {/* Right: Form area */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <h1 className="text-2xl font-bold text-[#1e3a5f]">
              Build<span className="text-[#f59e0b]">Time</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Zeiterfassung für die Baustelle
            </p>
          </div>
          {children}
          <p className="mt-6 text-center text-xs text-slate-400">
            Ein Tool von{' '}
            <a href="https://nomad-solutions.de" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">
              Nomad Solutions
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
