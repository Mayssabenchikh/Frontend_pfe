import { useState } from "react";
import {
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Bars3Icon,
  ChevronDownIcon,
} from "../../icons/heroicons/outline";
import type { NavId } from "./types";
import { getAvatarColor, getDisplayNameInitials } from "./utils";

type Props = {
  displayName: string | null;
  initials: string | null;
  avatarUrl?: string | null;
  avatarSeed?: string | null;
  onLogout: () => void;
  roleLabel?: string;
  onNavigate?: (view: NavId) => void;
  onProfile?: () => void;
  onMenuToggle: () => void;
};

export function AdminHeader({
  displayName,
  initials,
  avatarUrl,
  avatarSeed,
  onLogout,
  roleLabel,
  onNavigate,
  onProfile,
  onMenuToggle,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const safeName = displayName || "Administrateur";
  const safeInitials = initials?.trim() || getDisplayNameInitials(safeName) || "AD";
  const seed = avatarSeed?.trim() || safeName;
  const safeRole = roleLabel?.trim() || "Administrateur";

  return (
    <header className="admin-header-fixed z-30 flex items-center justify-between border-b border-violet-100/70 bg-white/70 px-4 shadow-md shadow-slate-200/50 backdrop-blur-xl md:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-2 md:gap-3">
        <button
          type="button"
          className="hamburger-btn flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-500 shadow-sm transition-all duration-200 ease-in-out hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
          onClick={onMenuToggle}
          aria-label="Menu"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="group flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-1.5 py-1 pr-2 shadow-sm transition-all duration-200 ease-in-out hover:border-violet-200 hover:bg-violet-50"
            aria-label="Menu utilisateur"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={safeName}
                className="h-8 w-8 shrink-0 rounded-full object-cover shadow-md"
              />
            ) : (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${getAvatarColor(seed)[0]}, ${getAvatarColor(seed)[1]})`,
                }}
              >
                {safeInitials}
              </div>
            )}

            <div className="hidden min-w-0 text-left lg:block">
              <p className="max-w-[140px] truncate text-sm font-semibold text-slate-700">{safeName}</p>
              <p className="text-[11px] text-slate-400">{safeRole}</p>
            </div>
            <ChevronDownIcon
              className={`hidden h-4 w-4 text-slate-400 transition-transform duration-200 ease-in-out lg:block ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-14 z-50 min-w-[220px] overflow-hidden rounded-2xl border border-slate-100/90 bg-white/95 shadow-lg shadow-slate-300/40 backdrop-blur-xl">
              <div className="flex flex-col gap-1 p-1.5">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (onProfile) return onProfile();
                    if (onNavigate) return onNavigate("profile" as NavId);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-all duration-200 ease-in-out hover:bg-violet-50 hover:text-violet-700"
                >
                  <UserCircleIcon className="h-4 w-4" />
                  Mon profil
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-500 transition-all duration-200 ease-in-out hover:bg-red-50"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  Déconnexion
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </header>
  );
}
