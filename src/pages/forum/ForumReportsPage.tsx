import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import { getRealmRoles } from "../../auth/roles";
import { forumService } from "../../services/forumService";
import type { ForumReportDto, ForumReportStatus } from "../../types/forum";
import { ForumLoadingState } from "../../components/forum/ForumLoadingState";

export function ForumReportsPage() {
  const { keycloak } = useKeycloak();
  const roles = getRealmRoles(keycloak.tokenParsed ?? undefined);
  const isAdmin = roles.includes("ADMIN");
  const [items, setItems] = useState<ForumReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAdmin) return;
    forumService
      .getReports()
      .then((r) => setItems(r.data))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!isAdmin) {
    return <Navigate to="/forum" replace />;
  }

  const review = async (uuid: string, status: ForumReportStatus) => {
    await forumService.reviewReport(uuid, { status, adminNotes: notes[uuid] || null });
    const r = await forumService.getReports();
    setItems(r.data);
  };

  if (loading) return <ForumLoadingState />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Signalements forum</h1>
      <ul className="space-y-3">
        {items.map((rep) => (
          <li key={rep.uuid} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-800">{rep.targetType}</span>
              <span>{rep.status}</span>
              <span>{new Date(rep.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-900">{rep.reason}</p>
            {rep.details ? <p className="mt-1 text-sm text-slate-600">{rep.details}</p> : null}
            <p className="mt-2 text-xs text-slate-500">
              Par {rep.reporter.fullName} · cible {rep.targetUuid}
            </p>
            {rep.status === "PENDING" ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                <textarea
                  placeholder="Notes admin"
                  value={notes[rep.uuid] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [rep.uuid]: e.target.value }))}
                  className="min-h-[72px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => review(rep.uuid, "REVIEWED")}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white"
                  >
                    Traité
                  </button>
                  <button
                    type="button"
                    onClick={() => review(rep.uuid, "REJECTED")}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    Rejeter
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Revu le {rep.reviewedAt ? new Date(rep.reviewedAt).toLocaleString() : "—"}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
