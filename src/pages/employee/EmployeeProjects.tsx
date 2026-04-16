import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { employeeProjectsApi, type ProjectDto } from "../../api/projectsApi";
import { FiltersPanel } from "../../components/FiltersPanel";
import { EmployeeProjectsTable } from "./EmployeeProjectsTable";

export function EmployeeProjects() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ProjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [order, setOrder] = useState<"recent" | "oldest">("recent");

  const load = useCallback(() => {
    setLoading(true);
    employeeProjectsApi
      .list({
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        from: from || undefined,
        to: to || undefined,
        order,
        page: 0,
        size: 500,
      })
      .then((res) => setItems(res.data?.content ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [search, statusFilter, priorityFilter, from, to, order]);

  useEffect(() => {
    const t = window.setTimeout(() => load(), 250);
    return () => window.clearTimeout(t);
  }, [load]);

  const onOpen = (p: ProjectDto) => navigate(`/employee/projects/${p.id}`);

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <FiltersPanel
            title="Mes projets"
            resultsLabel={loading ? "…" : `${items.length} projet${items.length !== 1 ? "s" : ""}`}
            onReset={() => {
              setSearch("");
              setStatusFilter("");
              setPriorityFilter("");
              setFrom("");
              setTo("");
              setOrder("recent");
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="lg:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Recherche</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom ou description…"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                >
                  <option value="">Tous</option>
                  <option value="DRAFT">Brouillon</option>
                  <option value="ACTIVE">En cours</option>
                  <option value="CLOSED">Terminé</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Priorité</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                >
                  <option value="">Toutes</option>
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Du</label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Au</label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Ordre</label>
                <select
                  value={order}
                  onChange={(e) => setOrder(e.target.value as any)}
                  className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                >
                  <option value="recent">Plus récent</option>
                  <option value="oldest">Plus ancien</option>
                </select>
              </div>
            </div>
          </FiltersPanel>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <EmployeeProjectsTable rows={items} loading={loading} onOpen={onOpen} />
          </div>
        </div>
      </div>
    </section>
  );
}

