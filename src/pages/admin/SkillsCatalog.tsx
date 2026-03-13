/**
 * SkillsCatalog — Grid Card Layout · Violet Luxury
 * Matches the Skillify screenshot: 4-col card grid, icon + name + badges.
 */

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  BoltIcon,
  XMarkIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { skillsApi } from "../../api/skillsApi";
import type { SkillDto, SkillCategoryDto } from "./types";
import { getApiError } from "./utils";
import { getSkillIconUrl } from "./skillIcons";
import { ConfirmModal } from "../../components/ConfirmModal";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type FormState = { name: string; categoryId: number; levelMin: number; levelMax: number };

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const PAGE_SIZE = 25;

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export function SkillsCatalog() {
  const [page, setPage]                     = useState(0);
  const [pageData, setPageData]             = useState<{ content: SkillDto[]; totalElements: number; totalPages: number } | null>(null);
  const [categories, setCategories]         = useState<SkillCategoryDto[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [search, setSearch]                 = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [createModal, setCreateModal]       = useState(false);
  const [editModal, setEditModal]           = useState<SkillDto | null>(null);
  const [form, setForm]                     = useState<FormState>({ name: "", categoryId: 0, levelMin: 1, levelMax: 5 });
  const [submitLoading, setSubmitLoading]   = useState(false);
  const [deletingId, setDeletingId]         = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm]   = useState<SkillDto | null>(null);
  const [updateConfirm, setUpdateConfirm]   = useState(false);

  const skills = pageData?.content ?? [];

  const loadCategories = useCallback(() => {
    skillsApi.listCategories()
      .then((res) => setCategories(res.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  const loadSkills = useCallback(() => {
    setLoading(true);
    skillsApi.listSkillsPaginated({
        categoryId: categoryFilter ?? undefined,
        page,
        size: PAGE_SIZE,
        search: searchDebounced || undefined,
      })
      .then((res) => {
        const data = res.data;
        setPageData(data ? { content: data.content, totalElements: data.totalElements, totalPages: data.totalPages } : null);
        setError(null);
      })
      .catch((err) => { setError(getApiError(err, "Erreur lors du chargement")); setPageData(null); })
      .finally(() => setLoading(false));
  }, [categoryFilter, page, searchDebounced]);

  useEffect(() => { setPage(0); }, [categoryFilter, searchDebounced]);
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadSkills(); }, [loadSkills]);

  const resetForm = () =>
    setForm({ name: "", categoryId: categories[0]?.id ?? 0, levelMin: 1, levelMax: 5 });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name || !form.categoryId) return;
    setSubmitLoading(true);
    skillsApi.createSkill({ name, categoryId: form.categoryId, levelMin: form.levelMin, levelMax: form.levelMax })
      .then(() => { loadSkills(); setCreateModal(false); resetForm(); toast.success("Compétence créée"); })
      .catch((err) => toast.error(getApiError(err, "Échec de la création")))
      .finally(() => setSubmitLoading(false));
  };

  const handleUpdateClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    const name = form.name.trim();
    if (!name || !form.categoryId) return;
    const unchanged = name === editModal.name && form.categoryId === editModal.categoryId && form.levelMin === editModal.levelMin && form.levelMax === editModal.levelMax;
    if (unchanged) {
      setEditModal(null);
      resetForm();
      return;
    }
    setUpdateConfirm(true);
  };

  const confirmUpdate = () => {
    if (!editModal) return;
    const name = form.name.trim();
    setUpdateConfirm(false);
    setSubmitLoading(true);
    skillsApi.updateSkill(editModal.id, { name, categoryId: form.categoryId, levelMin: form.levelMin, levelMax: form.levelMax })
      .then(() => { loadSkills(); setEditModal(null); resetForm(); toast.success("Compétence mise à jour"); })
      .catch((err) => toast.error(getApiError(err, "Échec de la mise à jour")))
      .finally(() => setSubmitLoading(false));
  };

  const handleDeleteClick = (s: SkillDto) => {
    setDeleteConfirm(s);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const s = deleteConfirm;
    setDeleteConfirm(null);
    setDeletingId(s.id);
    skillsApi.deleteSkill(s.id)
      .then(() => { loadSkills(); toast.success("Compétence supprimée"); })
      .catch((err) => toast.error(getApiError(err, "Échec de la suppression")))
      .finally(() => setDeletingId(null));
  };

  const openEdit = (s: SkillDto) => {
    setEditModal(s);
    setForm({ name: s.name, categoryId: s.categoryId, levelMin: s.levelMin, levelMax: s.levelMax });
  };

  const openCreate = () => {
    resetForm();
    if (categories.length) setForm((f) => ({ ...f, categoryId: categories[0].id }));
    setCreateModal(true);
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.3s ease both; }

        @keyframes cardHover {
          to { transform: translateY(-3px); }
        }
      `}</style>

      <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
        {/* ── Toolbar ── */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 border-b border-violet-500/10 px-6 py-2">
          {/* Left: search + category filter */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[240px] max-w-[400px] flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une compétence…"
                className="w-full rounded-xl border border-violet-500/20 bg-white py-2.5 pl-9 pr-4 text-sm text-violet-900 outline-none transition-all duration-150 focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            {/* Category filter */}
            <div className="relative flex shrink-0 items-center">
            <FunnelIcon className="pointer-events-none absolute left-3.5 h-4 w-4 text-violet-400" />
            <select
              value={categoryFilter ?? ""}
              onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : null)}
              className="cursor-pointer appearance-none rounded-xl border border-violet-500/20 bg-white py-2.5 pl-10 pr-8 text-sm text-violet-900 outline-none transition-all duration-150 focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDownIcon className="w-3 h-3 absolute right-2.5 text-violet-400 pointer-events-none" />
            </div>
          </div>

          {/* Right: count + CTA */}
          <div className="flex items-center gap-3">
            {/* Count badge */}
            <p className="flex items-center gap-1.5 text-xs text-violet-400 font-medium shrink-0">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                }`}
              />
              {loading
                ? "Chargement…"
                : pageData ? `${pageData.totalElements} compétence${pageData.totalElements !== 1 ? "s" : ""}` : "—"}
            </p>

            {/* CTA */}
            <button
              type="button"
              onClick={openCreate}
              disabled={categories.length === 0}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-none bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition-all duration-150 hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/50 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
              Nouvelle compétence
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <main className="relative z-10 flex-1 overflow-auto px-6 py-2 flex flex-col">

          {/* No categories */}
          {categories.length === 0 && !loading && (
            <EmptyState
              icon={<BoltIcon className="w-7 h-7 text-violet-400" />}
              title="Aucune catégorie disponible"
              description="Créez d'abord une catégorie depuis le menu Catégories pour pouvoir ajouter des compétences."
            />
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="grid grid-cols-1 gap-x-3 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl border border-violet-500/10 bg-violet-500/[0.06] animate-pulse" style={{ animationDelay: `${i * 60}ms` }} />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-600">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100">
                <XMarkIcon className="w-3 h-3 text-red-500" />
              </div>
              {error}
            </div>
          )}

          {/* Empty skills */}
          {!loading && !error && categories.length > 0 && skills.length === 0 && (
            <EmptyState
              icon={<BoltIcon className="w-7 h-7 text-violet-400" />}
              title="Aucune compétence"
              description="Créez votre première compétence pour commencer à construire votre référentiel."
              action={{ label: "Créer une compétence", onClick: openCreate }}
            />
          )}

          {/* ── Skills grid ── */}
          {!loading && !error && skills.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 content-start">
              {skills.map((s, i) => (
                <SkillCard
                  key={s.id}
                  skill={s}
                  index={i}
                  isDeleting={deletingId === s.id}
                  onEdit={() => openEdit(s)}
                  onDelete={() => handleDeleteClick(s)}
                />
              ))}
            </div>
          )}
        </main>

        {/* ── Pagination (fixée en bas) ── */}
        {!loading && !error && skills.length > 0 && pageData && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-violet-500/10 px-6 pb-3 pt-2">
            <p className="text-sm text-slate-400">
              Page {page + 1} sur {pageData.totalPages}
              {" · "}
              {Math.min(page * PAGE_SIZE + 1, pageData.totalElements)}–{Math.min((page + 1) * PAGE_SIZE, pageData.totalElements)} sur {pageData.totalElements}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500 shadow-sm transition-all duration-150 hover:border-violet-300 hover:text-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pageData.totalPages - 1 || loading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(124,58,237,0.35)] transition-all duration-150 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Suivant
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Modals ── */}
      {createModal && (
        <SkillFormModal
          title="Nouvelle compétence"
          categories={categories}
          form={form}
          setForm={setForm}
          onSubmit={handleCreate}
          onClose={() => setCreateModal(false)}
          submitLoading={submitLoading}
        />
      )}
      {editModal && (
        <SkillFormModal
          title="Modifier la compétence"
          categories={categories}
          form={form}
          setForm={setForm}
          onSubmit={handleUpdateClick}
          onClose={() => setEditModal(null)}
          submitLoading={submitLoading}
        />
      )}

      <ConfirmModal
        open={!!deleteConfirm}
        title="Confirmer la suppression"
        message={deleteConfirm ? `Supprimer la compétence « ${deleteConfirm.name} » ?` : ""}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <ConfirmModal
        open={updateConfirm && !!editModal}
        title="Confirmer la modification"
        message={editModal ? `Enregistrer les modifications pour « ${editModal.name} » ?` : ""}
        confirmLabel="Enregistrer"
        variant="primary"
        loading={submitLoading}
        onConfirm={confirmUpdate}
        onCancel={() => setUpdateConfirm(false)}
      />
    </>
  );
}

/* ─────────────────────────────────────────────
   SkillCard — grid card with icon, name, badges
───────────────────────────────────────────── */
interface SkillCardProps {
  skill: SkillDto;
  index: number;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function SkillCard({ skill, index, isDeleting, onEdit, onDelete }: SkillCardProps) {
  return (
    <div
      className="fade-up group relative flex h-[132px] min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-[12px] transition-all duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.01] group-hover:bg-white/98 group-hover:shadow-[0_12px_40px_-8px_rgba(99,102,241,0.2),0_0_0_1px_rgba(139,92,246,0.08)]"
      style={{ animationDelay: `${index * 35}ms` }}
    >
      {/* Accent bar top */}
      <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-violet-500 to-indigo-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 p-2.5">
        {/* Ligne 1 : icône + nom à droite */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/10 to-indigo-500/[0.06] shadow-sm transition-transform duration-200 group-hover:scale-105">
            {getSkillIconUrl(skill.name) ? (
              <img src={getSkillIconUrl(skill.name)!} alt="" className="w-7 h-7 object-contain" />
            ) : (
              <BoltIcon className="w-6 h-6 text-violet-500" />
            )}
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-snug truncate min-w-0 flex-1">
            {skill.name}
          </p>
          <div
            className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0
              transition-all duration-200"
          >
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Modifier ${skill.name}`}
              className="flex items-center justify-center w-9 h-9 rounded-lg
                text-slate-500 hover:text-violet-600 hover:bg-violet-50
                transition-all duration-150 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-violet-400/50"
            >
              <PencilSquareIcon className="w-5 h-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label={`Supprimer ${skill.name}`}
              className="flex items-center justify-center w-9 h-9 rounded-lg
                text-slate-500 hover:text-red-500 hover:bg-red-50
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-150 active:scale-95
                focus:outline-none focus:ring-2 focus:ring-red-300/50"
            >
              {isDeleting
            ? <ArrowPathIcon className="w-5 h-5 animate-spin text-red-400" strokeWidth={2} />
            : <TrashIcon className="w-5 h-5" strokeWidth={2} />}
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center rounded-md border border-violet-500/15 bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-800">
            {skill.categoryName}
          </span>
          <span className="inline-flex items-center rounded-md border border-indigo-500/10 bg-indigo-500/[0.06] px-2 py-0.5 text-xs font-medium text-indigo-700">
            Niv. {skill.levelMin}–{skill.levelMax}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   EmptyState
───────────────────────────────────────────── */
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
      <div className="relative">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-500/20 bg-violet-500/10">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-violet-900">{title}</p>
        <p className="text-xs text-violet-400 mt-1.5 max-w-[280px] leading-relaxed">{description}</p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
            text-xs font-semibold text-violet-700
            border border-violet-300 bg-violet-50 hover:bg-violet-100
            transition-all duration-200 active:scale-95
            focus:outline-none focus:ring-2 focus:ring-violet-400"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SkillFormModal
───────────────────────────────────────────── */
interface SkillFormModalProps {
  title: string;
  categories: SkillCategoryDto[];
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  submitLoading: boolean;
}

function SkillFormModal({ title, categories, form, setForm, onSubmit, onClose, submitLoading }: SkillFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-violet-900/10 p-4 backdrop-blur-[10px]">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-violet-500/20 bg-white/[0.97] shadow-[0_32px_80px_rgba(109,40,217,0.18),0_8px_32px_rgba(109,40,217,0.1)] backdrop-blur-[32px]">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-7 pb-4 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
              <BoltIcon className="h-4 w-4 text-violet-600" />
            </div>
            <h2 className="text-sm font-bold text-violet-950 tracking-tight">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer"
            className="flex items-center justify-center w-6 h-6 rounded-md
              text-slate-400 hover:text-violet-700 bg-slate-50 hover:bg-violet-50
              border border-slate-200 hover:border-violet-200
              transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-300">
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="px-7 pb-7 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-violet-400">
              Nom de la compétence
            </label>
            <StyledInput
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ex : Java, Angular, Docker…"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-violet-400">
              Catégorie
            </label>
            <div className="relative">
              <StyledSelect
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: Number(e.target.value) }))}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </StyledSelect>
              <ChevronDownIcon className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-violet-400">
                Niveau min
              </label>
              <StyledInput
                type="number" min={1} max={10}
                value={form.levelMin}
                onChange={(e) => setForm((f) => ({ ...f, levelMin: Math.max(1, Math.min(10, Number(e.target.value) || 1)) }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-violet-400">
                Niveau max
              </label>
              <StyledInput
                type="number" min={1} max={10}
                value={form.levelMax}
                onChange={(e) => setForm((f) => ({ ...f, levelMax: Math.max(1, Math.min(10, Number(e.target.value) || 1)) }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500
                bg-slate-50 hover:bg-slate-100 border border-slate-200
                transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-300">
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitLoading || !form.name.trim() || !form.categoryId}
              className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-[0_4px_18px_rgba(124,58,237,0.36),inset_0_1px_0_rgba(255,255,255,0.22)] transition-all duration-200 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitLoading && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
              {submitLoading ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shared: StyledInput & StyledSelect
───────────────────────────────────────────── */
function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-violet-500/20 bg-violet-50/60 px-4 py-2.5 text-sm text-violet-950 placeholder:text-slate-300 transition-all duration-200 focus:border-violet-500/55 focus:bg-[#f8f7ff]/90 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
    />
  );
}

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full cursor-pointer appearance-none rounded-xl border border-violet-500/20 bg-violet-50/60 px-4 py-2.5 pr-8 text-sm text-violet-950 transition-all duration-200 focus:border-violet-500/55 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
    />
  );
}