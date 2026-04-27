import { useEffect, useState } from "react";
import { assignmentsApi, type AssignmentDto } from "../../api/assignmentsApi";
import { FiltersPanel } from "../../components/FiltersPanel";
import { EmployeeAssignmentsTable } from "./EmployeeAssignmentsTable";

export function EmployeeAssignments() {
  const [items, setItems] = useState<AssignmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectQuery, setProjectQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [order, setOrder] = useState<"recent" | "oldest">("recent");

  const load = () => {
    setLoading(true);
    assignmentsApi
      .myAssignments({
        project: projectQuery || undefined,
        from: from || undefined,
        to: to || undefined,
        order,
        page: 0,
        size: 200,
      })
      .then((res) => setItems(Array.isArray(res.data?.content) ? res.data.content : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = window.setTimeout(() => load(), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectQuery, from, to, order]);

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <FiltersPanel
            title="Mes affectations"
            resultsLabel={loading ? "…" : `${items.length} affectation${items.length !== 1 ? "s" : ""}`}
            rightSlot={
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                title="Rafraîchir"
              >
                Rafraîchir
              </button>
            }
            defaultOpen={false}
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
            <p className="mt-2 text-xs text-slate-500">
              Les affectations sont décidées par la direction ; cette page est en lecture seule.
            </p>
          </FiltersPanel>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <EmployeeAssignmentsTable rows={items} loading={loading} />
          </div>
        </div>
      </div>
    </section>
  );
}
