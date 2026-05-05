import { Link } from "react-router-dom";
import { ClipboardDocumentCheckIcon, ClipboardDocumentListIcon, SparklesIcon } from "../../icons/heroicons/outline";

export function TrainingManagerDashboard() {
  return (
    <div className="w-full space-y-8 px-4 pb-12 pt-2 sm:px-6 sm:pt-4">
      <header className="flex flex-col gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-700/90">Responsable formation</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Tableau de bord</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Gere vos parcours, suivez les soumissions et utilisez l'IA pour accelerer les corrections.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <Link
          to="/training-manager/submissions"
          className="tm-card group relative overflow-hidden p-6 transition hover:-translate-y-0.5"
        >
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-50 via-transparent to-indigo-50 opacity-60" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <ClipboardDocumentCheckIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Soumissions a corriger</p>
              <p className="text-xs text-slate-500">Lancer la correction IA et valider les resultats.</p>
            </div>
          </div>
          <div className="relative mt-4 inline-flex items-center gap-2 text-xs font-semibold text-violet-700">
            <SparklesIcon className="h-4 w-4" />
            Ouvrir l'espace IA
          </div>
        </Link>

        <Link
          to="/training-manager/programs"
          className="tm-card group relative overflow-hidden p-6 transition hover:-translate-y-0.5"
        >
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50 via-transparent to-violet-50 opacity-70" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <ClipboardDocumentListIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Mes formations</p>
              <p className="text-xs text-slate-500">Creer, publier et maintenir vos parcours.</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
