import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trainingApi, type TrainingCourse, type UpsertTrainingCourseRequest } from "../../api/trainingApi";

const EMPTY_FORM: UpsertTrainingCourseRequest = {
  category: "",
  skillName: "",
  employeeSkillLevel: 0,
  targetSkillLevel: 1,
  courseName: "",
  courseLevel: "intermediaire",
  playlistUrl: "",
  active: true,
};

export function AdminTrainingsCatalog() {
  const [rows, setRows] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<UpsertTrainingCourseRequest>(EMPTY_FORM);
  const [editing, setEditing] = useState<TrainingCourse | null>(null);
  const [saving, setSaving] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);

  async function loadRows() {
    setLoading(true);
    try {
      const { data } = await trainingApi.listCoursesAdmin();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Impossible de charger les formations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, []);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => a.courseName.localeCompare(b.courseName));
  }, [rows]);

  function beginEdit(row: TrainingCourse) {
    setEditing(row);
    setForm({
      category: row.category,
      skillName: row.skillName,
      employeeSkillLevel: row.employeeSkillLevel,
      targetSkillLevel: row.targetSkillLevel,
      courseName: row.courseName,
      courseLevel: row.courseLevel,
      playlistUrl: row.playlistUrl,
      active: row.active,
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (form.targetSkillLevel <= form.employeeSkillLevel) {
      toast.error("Le niveau cible doit être supérieur au niveau actuel.");
      return;
    }
    setSaving(true);
    try {
      if (editing) await trainingApi.updateCourseAdmin(editing.uuid, form);
      else await trainingApi.createCourseAdmin(form);
      toast.success(editing ? "Formation mise à jour" : "Formation créée");
      setEditing(null);
      setForm(EMPTY_FORM);
      await loadRows();
    } catch {
      toast.error("Impossible d'enregistrer la formation");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(uuid: string) {
    if (!window.confirm("Supprimer cette formation ?")) return;
    try {
      await trainingApi.deleteCourseAdmin(uuid);
      toast.success("Formation supprimée");
      await loadRows();
    } catch {
      toast.error("Suppression impossible");
    }
  }

  async function onImportCsv() {
    if (!csvFile) return;
    try {
      const { data } = await trainingApi.importCsvAdmin(csvFile);
      toast.success(`${data.imported} formations importées`);
      setCsvFile(null);
      await loadRows();
    } catch {
      toast.error("Import CSV impossible");
    }
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f7ff] px-3 py-3 sm:px-6 sm:py-4">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <form onSubmit={onSave} className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">{editing ? "Modifier formation" : "Nouvelle formation"}</h3>
          <div className="mt-3 space-y-2">
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Catégorie" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Compétence" value={form.skillName} onChange={(e) => setForm((p) => ({ ...p, skillName: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" min={0} max={5} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Niveau actuel" value={form.employeeSkillLevel} onChange={(e) => setForm((p) => ({ ...p, employeeSkillLevel: Number(e.target.value) }))} />
              <input type="number" min={0} max={5} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Niveau cible" value={form.targetSkillLevel} onChange={(e) => setForm((p) => ({ ...p, targetSkillLevel: Number(e.target.value) }))} />
            </div>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Nom de formation" value={form.courseName} onChange={(e) => setForm((p) => ({ ...p, courseName: e.target.value }))} />
            <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" value={form.courseLevel} onChange={(e) => setForm((p) => ({ ...p, courseLevel: e.target.value }))}>
              <option value="debutant">Débutant</option>
              <option value="intermediaire">Intermédiaire</option>
              <option value="avance">Avancé</option>
            </select>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="URL YouTube / playlist" value={form.playlistUrl} onChange={(e) => setForm((p) => ({ ...p, playlistUrl: e.target.value }))} />
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))} />
              Formation active
            </label>
            <div className="flex items-center gap-2">
              <button disabled={saving} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">{saving ? "Enregistrement..." : editing ? "Mettre à jour" : "Créer"}</button>
              {editing && <button type="button" onClick={() => { setEditing(null); setForm(EMPTY_FORM); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700">Annuler</button>}
            </div>
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 text-xs font-semibold text-slate-700">Importer dataset CSV</p>
            <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} className="w-full text-xs" />
            <button type="button" onClick={onImportCsv} disabled={!csvFile} className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
              Importer
            </button>
          </div>
        </form>

        <div className="min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-4 text-sm text-slate-500">Chargement...</div>
          ) : (
            <div className="max-h-full overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Formation</th>
                    <th className="px-3 py-2">Catégorie</th>
                    <th className="px-3 py-2">Skill</th>
                    <th className="px-3 py-2">Niveaux</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => (
                    <tr key={row.uuid} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-800">{row.courseName}</p>
                        <a href={row.playlistUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">{row.playlistUrl}</a>
                      </td>
                      <td className="px-3 py-2">{row.category}</td>
                      <td className="px-3 py-2">{row.skillName}</td>
                      <td className="px-3 py-2">{row.employeeSkillLevel} → {row.targetSkillLevel}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => beginEdit(row)} className="rounded-md border border-slate-200 px-2 py-1 text-xs">Modifier</button>
                          <button type="button" onClick={() => onDelete(row.uuid)} className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600">Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
