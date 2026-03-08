import { useState } from "react";
import { ArrowRightOnRectangleIcon, UserCircleIcon, Bars3Icon } from "@heroicons/react/24/outline";
import type { NavId } from "./types";

type Props = {
  displayName: string | null;
  initials: string | null;
  avatarUrl?: string | null;
  onLogout: () => void;
  onNavigate: (view: NavId) => void;
  onMenuToggle: () => void;
};

export function AdminHeader({ displayName, initials, avatarUrl, onLogout, onNavigate, onMenuToggle }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const safeName = displayName || "Administrateur";
  const safeInitials = initials?.trim() || safeName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "AD";

  return (
    <header className="admin-header-fixed flex items-center justify-between px-4 md:px-6 bg-white border-b border-slate-100 shadow-sm z-30">

      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — visible only on mobile */}
        <button
          type="button"
          className="hamburger-btn flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition"
          onClick={onMenuToggle}
          aria-label="Menu"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 p-1 cursor-pointer hover:bg-violet-50 hover:border-indigo-200 transition"
          aria-label="Menu utilisateur"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={safeName} className="w-8 h-8 rounded-full object-cover shadow shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-700 to-violet-700 flex items-center justify-center text-xs font-bold text-white shadow shrink-0">
              {safeInitials}
            </div>
          )}
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-12 z-50 min-w-[180px] rounded-2xl border border-slate-100 bg-white shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-800">{safeName}</p>
                <p className="text-xs text-slate-400">Administrateur</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => { setMenuOpen(false); onNavigate("profile"); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                >
                  <UserCircleIcon className="w-4 h-4 text-indigo-600" />
                  Mon profil
                </button>
                <div className="h-px bg-slate-100 my-1" />
                <button
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
