import { Link } from "react-router-dom";
import { ChevronRightIcon, ClipboardDocumentListIcon, FolderIcon, UserCircleIcon } from "../../icons/heroicons/outline";

const quickLinks = [
  {
    to: "/training-manager/programs",
    title: "Mes parcours",
    description: "Créer, modifier et publier vos parcours de formation.",
    icon: ClipboardDocumentListIcon,
  },
  {
    to: "/training-manager/programs",
    title: "Modules",
    description: "Sélectionner un parcours puis éditer ses modules et contenus.",
    icon: FolderIcon,
  },
  {
    to: "/training-manager/profile",
    title: "Profil",
    description: "Gérer vos informations, avatar et mot de passe.",
    icon: UserCircleIcon,
  },
];

export function TrainingManagerDashboard() {
  return (
    <div className="space-y-6 px-4 pb-12 pt-2 sm:px-6 sm:pt-4">
      <section className="tm-card overflow-hidden">
        <div className="bg-gradient-to-r from-violet-700 via-indigo-700 to-slate-900 px-6 py-8 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-violet-200">Training Manager</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Tableau de bord</h1>
          <p className="mt-2 max-w-2xl text-sm text-violet-100/95">
            Gérez vos parcours, modules, contenus pédagogiques et quiz IA depuis un espace unifié.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            className="tm-card group p-5 transition hover:-translate-y-0.5 hover:border-violet-300/70 hover:shadow-[0_16px_40px_-22px_rgba(79,70,229,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            <item.icon className="h-6 w-6 text-violet-700" />
            <h2 className="mt-4 text-base font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-violet-700">
              Ouvrir
                <ChevronRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
