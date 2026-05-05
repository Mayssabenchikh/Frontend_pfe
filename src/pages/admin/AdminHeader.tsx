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
    <header className="admin-header-fixed z-[120] flex items-center justify-between border-b border-violet-100/80 px-3 shadow-[0_10px_34px_-30px_rgba(76,29,149,0.65)] backdrop-blur-xl sm:px-4 md:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className="hamburger-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-white text-slate-600 shadow-sm shadow-violet-100/70 transition-all duration-200 ease-in-out hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 md:h-10 md:w-10"
          onClick={onMenuToggle}
          aria-label="Menu"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="group flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border border-violet-100 bg-white/95 py-1.5 pl-1.5 pr-2.5 shadow-sm shadow-violet-100/60 transition-all duration-200 ease-in-out hover:border-violet-200 hover:bg-violet-50/80 hover:shadow-md hover:shadow-violet-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30 sm:gap-3 sm:pr-3"
            aria-label="Menu utilisateur"
            aria-expanded={menuOpen}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={safeName}
                className="h-9 w-9 shrink-0 rounded-xl border border-white object-cover shadow-sm ring-1 ring-violet-100"
              />
            ) : (
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-white shadow-sm ring-1 ring-violet-100"
                style={{
                  background: `linear-gradient(135deg, ${getAvatarColor(seed)[0]}, ${getAvatarColor(seed)[1]})`,
                }}
              >
                {safeInitials}
              </div>
            )}

            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-[112px] truncate text-sm font-extrabold leading-5 text-slate-900 md:max-w-[170px]">{safeName}</p>
              <p className="hidden max-w-[170px] truncate text-[11px] font-bold uppercase tracking-wide text-violet-600 md:block">{safeRole}</p>
            </div>
            <ChevronDownIcon
              className={`hidden h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ease-in-out group-hover:text-violet-700 sm:block ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-[110]" onClick={() => setMenuOpen(false)} />
            <div className="fixed left-3 right-3 top-[calc(5rem+env(safe-area-inset-top,0px)+8px)] z-[130] max-h-[min(70vh,calc(100dvh-6rem))] overflow-y-auto overflow-x-hidden rounded-2xl border border-violet-100 bg-white p-2 shadow-2xl shadow-violet-200/50 sm:absolute sm:left-auto sm:right-0 sm:top-16 sm:max-h-none sm:min-w-[250px] sm:overflow-visible">
              <div className="mb-1.5 flex items-center gap-3 rounded-xl bg-violet-50/80 px-3 py-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={safeName} className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-violet-100" />
                ) : (
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold text-white"
                    style={{ background: `linear-gradient(135deg, ${getAvatarColor(seed)[0]}, ${getAvatarColor(seed)[1]})` }}
                  >
                    {safeInitials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-slate-950">{safeName}</p>
                  <p className="truncate text-xs font-bold uppercase tracking-wide text-violet-700">{safeRole}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    if (onProfile) return onProfile();
                    if (onNavigate) return onNavigate("profile" as NavId);
                  }}
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition-all duration-200 ease-in-out hover:bg-violet-50 hover:text-violet-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/30"
                >
                  <UserCircleIcon className="h-4 w-4" />
                  Mon profil
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onLogout(); }}
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-bold text-rose-600 transition-all duration-200 ease-in-out hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/25"
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
