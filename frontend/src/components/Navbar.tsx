import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          to="/home"
          className="flex items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-ink">
            <span className="h-3 w-3 rounded-[3px] bg-mint-node shadow-[0_0_8px_#34E0A1]" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-ink">DeskFlex</span>
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight text-ink">{user.name}</p>
              <p className="font-mono text-[11px] leading-tight text-ink-soft">{user.email}</p>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-white">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <button
              onClick={logout}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
