import { NavLink } from 'react-router-dom'

const navItems = [
  { section: 'Assessment', links: [
    { to: '/', label: 'Risk Map' },
    { to: '/insights', label: 'Model Insights' },
    { to: '/regulation', label: 'Fire Regulation' },
  ]},
  { section: 'Data', links: [
    { to: '/registry', label: 'Heritage Registry' },
    { to: '/assessment', label: 'Site Assessment' },
  ]},
]

const Sidebar = () => {
  return (
    <aside className="w-56 bg-[#1A1A1A] text-white flex flex-col h-screen flex-shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[#2A2A2A]">
        <div className="text-xs font-extrabold tracking-widest uppercase leading-tight">
          Fire Vulnerability<br />Assessment Tool
        </div>
        <div className="text-[11px] text-gray-500 mt-1">Franklin District · WA</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navItems.map((group) => (
          <div key={group.section}>
            <div className="px-4 pt-4 pb-1 text-[9px] font-bold tracking-widest text-gray-600 uppercase">
              {group.section}
            </div>
            {group.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 text-[13px] font-medium border-l-[3px] transition-colors ${
                    isActive
                      ? 'bg-[#333] text-white border-[#B03A2E]'
                      : 'text-gray-400 border-transparent hover:bg-[#2A2A2A] hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#2A2A2A] text-[11px] text-gray-600">
        Franklin District · FRK<br />v1.0 MVP
      </div>
    </aside>
  )
}

export default Sidebar