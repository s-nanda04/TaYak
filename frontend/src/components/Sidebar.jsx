import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navTo = (path) => {
    onClose();
    if (location.pathname !== path) navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    onClose();
    navigate("/");
  };

  const links = [
    {
      label: "Dashboard",
      path: "/feed",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      label: "Leaderboard",
      path: "/leaderboard",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[200] bg-black/20 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 z-[201] h-full w-[260px] bg-card border-r border-subtle shadow-card flex flex-col transition-transform duration-300 ease-design ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <img src="/tamid-logo.png" alt="TaYak" className="w-7 h-7 rounded-xs object-cover" />
            <span className="font-extrabold text-[18px] text-txt-primary tracking-tight">TaYak</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xs text-txt-secondary hover:text-txt-primary hover:bg-surface transition-colors duration-[120ms]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 pt-4 space-y-1">
          {links.map((link) => {
            const active = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navTo(link.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-body-md transition-all duration-[120ms] ${
                  active
                    ? "bg-surface text-txt-primary font-semibold"
                    : "text-txt-secondary hover:bg-surface hover:text-txt-primary"
                }`}
              >
                {link.icon}
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 pt-3 border-t border-subtle">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-body-md text-error-text hover:bg-error-bg transition-all duration-[120ms]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log out
          </button>
        </div>
      </div>
    </>
  );
}
