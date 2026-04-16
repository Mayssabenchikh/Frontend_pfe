import { useCallback, useEffect, useMemo, useState } from "react";
import { assignmentsApi, type AssignmentEventDto } from "../../api/assignmentsApi";
import { FiltersPanel } from "../../components/FiltersPanel";
import { AssignmentEventsTable } from "../admin/AssignmentEventsTable";

type PageLike<T> = {
  content?: T[];
};

export function ManagerAssignmentsHistory() {
  const [projectQuery, setProjectQuery] = useState("");
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<AssignmentEventDto[]>([]);

  const params = useMemo(
    () => ({
      project: projectQuery.trim() || undefined,
      employee: employeeQuery.trim() || undefined,
      page: 0,
      size: 500,
    }),
    [projectQuery, employeeQuery],
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    assignmentsApi
      .managerEvents(params)
      .then((res) => {
        const data = (res.data ?? {}) as PageLike<AssignmentEventDto>;
        setItems(Array.isArray(data.content) ? data.content : []);
      })
      .catch(() => {
        setItems([]);
        setError("Impossible de charger l'historique.");
      })
      .finally(() => setLoading(false));
  }, [params]);

  useEffect(() => {
    const t = window.setTimeout(() => load(), 250);
    return () => window.clearTimeout(t);
  }, [load]);

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <FiltersPanel
            title="Historique d'affectation"
            resultsLabel={`${items.length} événement${items.length !== 1 ? "s" : ""}`}
            onReset={() => {
              setProjectQuery("");
              setEmployeeQuery("");
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
              <div className="lg:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Projet</label>
                <input
                  value={projectQuery}
                  onChange={(e) => setProjectQuery(e.target.value)}
                  placeholder="Nom du projet…"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Employé</label>
                <input
                  value={employeeQuery}
                  onChange={(e) => setEmployeeQuery(e.target.value)}
                  placeholder="Nom, prénom, email…"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                />
              </div>
            </div>
          </FiltersPanel>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            <AssignmentEventsTable rows={items} loading={loading} error={error} />
          </div>
        </div>
      </div>
    </section>
  );
}

