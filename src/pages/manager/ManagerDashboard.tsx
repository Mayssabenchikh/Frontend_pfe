import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  ClipboardDocumentListIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
} from "../../icons/heroicons/outline";
import { projectsApi, type ProjectDto, type ProjectPage } from "../../api/projectsApi";

type ManagerOutletContext = {
  managerAvatarUrl: string | null;
  managerName: string;
  managerEmail: string | null;
};

export function ManagerDashboard() {
  const navigate = useNavigate();
  const outletCtx = useOutletContext<ManagerOutletContext | null>();
  const managerName = outletCtx?.managerName ?? "Responsable formation";
  const managerEmail = outletCtx?.managerEmail ?? null;
  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    projectsApi
      .list({ page: 0, size: 100 })
      .then((res) => {
        const data = res.data as ProjectPage;
        setProjects(data.content ?? []);
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const total = projects.length;
  const drafts = projects.filter((p) => p.status === "DRAFT").length;
  const actives = projects.filter((p) => p.status === "ACTIVE").length;
  const closed = projects.filter((p) => p.status === "CLOSED").length;

  const recentPrograms = useMemo(() => projects.slice(0, 4), [projects]);
  const alerts = useMemo(() => {
    const items = [
      { label: "Parcours en brouillon", value: drafts, tone: "warning" as const },
      { label: "Quiz en échec", value: 0, tone: "danger" as const },
      { label: "Contenus incomplets", value: Math.max(0, drafts - 1), tone: "warning" as const },
    ];
    return items;
  }, [drafts]);

  const cards = [
    {
      label: "Parcours",
      value: loading ? "…" : total,
      icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
      iconClass: "text-violet-600",
      iconBgClass: "bg-violet-100",
      note: "Total disponible",
    },
    {
      label: "Modules",
      value: loading ? "…" : "—",
      icon: <BookOpenIcon className="h-5 w-5" />,
      iconClass: "text-indigo-600",
      iconBgClass: "bg-indigo-100",
      note: "Connecter vos contenus",
    },
    {
      label: "Quiz",
      value: loading ? "…" : "—",
      icon: <ClipboardDocumentCheckIcon className="h-5 w-5" />,
      iconClass: "text-violet-700",
      iconBgClass: "bg-violet-50",
      note: "Pilotage des évaluations",
    },
    {
      label: "Statut global",
      value: loading ? "…" : `${actives}/${total || 0}`,
      icon: <PlayCircleIcon className="h-5 w-5" />,
      iconClass: "text-emerald-600",
      iconBgClass: "bg-emerald-100",
      note: "Parcours actifs",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <DashboardHeader
        title="Tableau de bord"
        subtitle="Responsable formation — pilotage des parcours et des évaluations"
        primaryAction={{ label: "Nouveau parcours", onClick: () => navigate("/manager/projects") }}
        secondaryAction={{ label: "Importer contenus", onClick: () => navigate("/manager/learning") }}
      />

      <div className="grid grid-cols-12 gap-6">
        <SectionCard
          title="Vue d'ensemble"
          description="Suivi des parcours, modules et quiz"
          className="col-span-12 xl:col-span-8"
          action={<button className="text-xs font-semibold text-violet-700 hover:text-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">Voir les rapports</button>}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <StatCard key={card.label} {...card} loading={loading} />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Actions rapides"
          description="Lancez vos actions clés en un clic"
          className="col-span-12 xl:col-span-4"
        >
          <QuickActions
            items={[
              {
                label: "Nouveau parcours",
                description: "Créer un parcours et définir les objectifs",
                icon: <PlusIcon className="h-5 w-5" />,
                onClick: () => navigate("/manager/projects"),
              },
              {
                label: "Importer contenus",
                description: "Ajouter des modules externes",
                icon: <ArrowTrendingUpIcon className="h-5 w-5" />,
                onClick: () => navigate("/manager/learning"),
              },
              {
                label: "Gérer contenus",
                description: "Structurer les quiz et ressources",
                icon: <SparklesIcon className="h-5 w-5" />,
                onClick: () => navigate("/manager/learning-programs"),
              },
            ]}
          />
        </SectionCard>

        <SectionCard
          title="Parcours récents / en cours d'édition"
          description="Vos derniers parcours modifiés"
          className="col-span-12 xl:col-span-8"
          action={<button className="text-xs font-semibold text-violet-700 hover:text-violet-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500">Voir tous les parcours</button>}
        >
          <RecentPrograms items={recentPrograms} loading={loading} />
        </SectionCard>

        <SectionCard
          title="Recommandations / alertes"
          description="Points d'attention prioritaires"
          className="col-span-12 xl:col-span-4"
        >
          <Recommendations items={alerts} loading={loading} />
        </SectionCard>

        <SectionCard
          title="Profil / paramètres"
          description="Accès rapide à votre espace"
          className="col-span-12"
        >
          <ProfileCard name={managerName} email={managerEmail} onClick={() => navigate("/manager/profile")} />
        </SectionCard>
      </div>
    </div>
  );
}

type DashboardHeaderProps = {
  title: string;
  subtitle: string;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction: { label: string; onClick: () => void };
};

function DashboardHeader({ title, subtitle, primaryAction, secondaryAction }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-violet-200/60 bg-white/80 p-6 shadow-[0_12px_28px_rgba(76,29,149,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">Responsable formation</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={secondaryAction.onClick}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-violet-200 hover:text-violet-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
        >
          {secondaryAction.label}
        </button>
        <button
          type="button"
          onClick={primaryAction.onClick}
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(124,58,237,0.25)] transition hover:translate-y-[-1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
        >
          {primaryAction.label}
        </button>
      </div>
    </div>
  );
}

type SectionCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

function SectionCard({ title, description, action, className, children }: SectionCardProps) {
  return (
    <section
      className={`flex h-full flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)] ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconClass: string;
  iconBgClass: string;
  note?: string;
  loading?: boolean;
};

function StatCard({ label, value, icon, iconClass, iconBgClass, note, loading }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-200/50 bg-white p-4 shadow-sm">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-50" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
          <div className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">
            {loading ? <span className="inline-block h-7 w-16 rounded-full bg-slate-100" /> : value}
          </div>
          {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${iconBgClass} ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

type QuickActionItem = {
  label: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
};

function QuickActions({ items }: { items: QuickActionItem[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          className="group flex w-full items-start gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-left transition hover:border-violet-200 hover:bg-violet-50/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 shadow-sm">
            {item.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900">{item.label}</span>
            <span className="block text-xs text-slate-500">{item.description}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function RecentPrograms({ items, loading }: { items: ProjectDto[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-16 rounded-2xl border border-slate-100 bg-slate-50" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <ClipboardDocumentListIcon className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Aucun parcours pour le moment</p>
        <p className="text-xs text-slate-500">Créez votre premier parcours pour démarrer.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((project) => (
        <div
          key={project.uuid}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{project.name}</p>
            <p className="text-xs text-slate-500 truncate">{project.description || "Aucune description"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={project.status} />
            <span className="text-xs text-slate-400">Mis à jour {formatDate(project.createdAt)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

type RecommendationItem = {
  label: string;
  value: number;
  tone: "warning" | "danger";
};

function Recommendations({ items, loading }: { items: RecommendationItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-12 rounded-2xl border border-slate-100 bg-slate-50" />
        ))}
      </div>
    );
  }

  const totalAlerts = items.reduce((acc, item) => acc + item.value, 0);
  if (totalAlerts === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircleIcon className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Tout est sous contrôle</p>
        <p className="text-xs text-slate-500">Aucune alerte à signaler.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.tone === "danger" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
              <ExclamationTriangleIcon className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-slate-700">{item.label}</span>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function ProfileCard({ name, email, onClick }: { name: string; email: string | null; onClick: () => void }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{email ?? "Gérer vos informations de profil"}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center justify-center rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
      >
        Ouvrir le profil
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const label = status === "ACTIVE" ? "Publié" : status === "CLOSED" ? "Clôturé" : "Brouillon";
  const cls =
    status === "ACTIVE"
      ? "bg-violet-50 text-violet-700 ring-violet-200"
      : status === "CLOSED"
        ? "bg-slate-100 text-slate-600 ring-slate-200"
        : "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(date);
}

