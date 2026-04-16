import { useEffect, useState } from "react";
import { toast } from "sonner";
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
  const [refuseOpen, setRefuseOpen] = useState(false);
  const [refuseReason, setRefuseReason] = useState("");
  const [selected, setSelected] = useState<AssignmentDto | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    assignmentsApi
      .myPending({
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

  const accept = (a: AssignmentDto) => {
    setActingId(a.id);
    assignmentsApi
      .accept(a.id)
      .then(() => {
        toast.success("Affectation acceptée");
        load();
      })
      .catch((err) => toast.error(err.response?.data?.error ?? "Erreur"))
      .finally(() => setActingId(null));
  };

  const openRefuse = (a: AssignmentDto) => {
    setSelected(a);
    setRefuseReason("");
    setRefuseOpen(true);
  };

  const confirmRefuse = () => {
    if (!selected) return;
    const reason = refuseReason.trim();
    if (!reason) {
      toast.error("Justificatif obligatoire");
      return;
    }
    setActingId(selected.id);
    assignmentsApi
      .refuse(selected.id, reason)
      .then(() => {
        toast.success("Affectation refusée");
        setRefuseOpen(false);
        setSelected(null);
        load();
      })
      .catch((err) => toast.error(err.response?.data?.error ?? "Erreur"))
      .finally(() => setActingId(null));
  };

  return (
    <section className="flex min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-6 py-4">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <FiltersPanel
            title="Mes invitations de projet"
            resultsLabel={loading ? "…" : `${items.length} invitation${items.length !== 1 ? "s" : ""}`}
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
              Vous pouvez accepter ou refuser. En cas de refus, un justificatif est obligatoire et sera journalisé.
            </p>
          </FiltersPanel>

          <div className="relative flex min-h-0 flex-1 flex-col overflow-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
            <EmployeeAssignmentsTable
              rows={items}
              loading={loading}
              actingId={actingId}
              onAccept={accept}
              onRefuse={openRefuse}
            />
          </div>
        </div>
      </div>

      {refuseOpen ? (
        <div className="app-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center px-4">
          <div
            className="absolute inset-0"
            onClick={() => {
              if (actingId !== null) return;
              setRefuseOpen(false);
              setSelected(null);
            }}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-violet-500/16 bg-white/[0.92] px-7 py-6 shadow-[0_18px_48px_rgba(109,40,217,0.14)]">
            <h3 className="text-sm font-bold text-violet-950">Refuser l&apos;affectation</h3>
            <p className="mt-1.5 text-sm text-slate-600">
              Justificatif obligatoire. Il sera journalisé et ne pourra pas être modifié.
            </p>
            <label className="mt-4 block text-[11px] font-bold uppercase tracking-widest text-slate-500">
              Justificatif
              <textarea
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15"
                placeholder="Expliquez brièvement la raison du refus…"
              />
            </label>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={actingId !== null}
                onClick={() => {
                  setRefuseOpen(false);
                  setSelected(null);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmRefuse}
                disabled={actingId !== null}
                className="rounded-xl bg-red-500 px-4 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 hover:bg-red-600"
              >
                {actingId !== null ? "…" : "Refuser"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

