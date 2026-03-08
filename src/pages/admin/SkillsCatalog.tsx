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

      <section
        className="relative flex flex-col flex-1 overflow-hidden min-h-0"
        style={{ background: "#f8f7ff" }}
      >
        {/* ── Toolbar ── */}
        <div
          className="relative z-10 flex flex-wrap items-center gap-3 px-6 py-2"
          style={{ borderBottom: "1px solid rgba(139,92,246,0.1)" }}
        >
          {/* Left: search + category filter */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px] max-w-[400px]">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-violet-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une compétence…"
                className="w-full pl-9 pr-4 outline-none transition-all duration-150"
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(139,92,246,0.2)",
                  background: "#fff",
                  padding: "10px 14px 10px 36px",
                  fontSize: 14,
                  color: "#4c1d95",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#7c3aed";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "rgba(139,92,246,0.2)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>
            {/* Category filter */}
            <div className="relative flex items-center shrink-0">
            <FunnelIcon className="w-4 h-4 absolute left-3.5 text-violet-400 pointer-events-none" />
            <select
              value={categoryFilter ?? ""}
              onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : null)}
              className="appearance-none pl-10 pr-8 outline-none cursor-pointer transition-all duration-150"
              style={{
                borderRadius: 12,
                border: "1px solid rgba(139,92,246,0.2)",
                background: "#fff",
                padding: "10px 14px 10px 40px",
                fontSize: 14,
                color: "#4c1d95",
              }}
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
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                borderRadius: 10, border: "none", padding: "9px 18px",
                fontSize: 13, fontWeight: 600, color: "#fff",
                background: "linear-gradient(135deg,#4338ca,#6d28d9)",
                cursor: "pointer", boxShadow: "0 4px 16px rgba(67,56,202,0.4)",
                transition: "all 0.15s",
                opacity: categories.length === 0 ? 0.5 : 1,
              }}
              onMouseEnter={(e) => { if (categories.length > 0) { e.currentTarget.style.boxShadow = "0 6px 24px rgba(67,56,202,0.55)"; e.currentTarget.style.transform = "translateY(-1px)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(67,56,202,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <PlusIcon className="w-4 h-4" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl animate-pulse"
                  style={{
                    background: "rgba(139,92,246,0.06)",
                    border: "1px solid rgba(139,92,246,0.1)",
                    animationDelay: `${i * 60}ms`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-2xl text-sm text-red-600"
              style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}>
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
          <div
            className="shrink-0 flex items-center justify-between gap-3 px-6 pt-2 pb-3"
            style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}
          >
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                  text-slate-500 border border-slate-200
                  hover:border-violet-300 hover:text-violet-600
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-slate-200 disabled:hover:text-slate-500
                  transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-300"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pageData.totalPages - 1 || loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                  text-white disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-150 active:scale-[0.97]
                  focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                  boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                }}
              >
                Suivant
                <ChevronRightIcon className="w-4 h-4" />
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
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="fade-up relative group rounded-xl cursor-default flex flex-col overflow-hidden
        transition-all duration-300 ease-out"
      style={{
        height: "132px",
        minWidth: "0",
        animationDelay: `${index * 35}ms`,
        background: hovered ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.95)",
        border: "1px solid rgba(148,163,184,0.2)",
        boxShadow: hovered
          ? "0 12px 40px -8px rgba(99,102,241,0.2), 0 0 0 1px rgba(139,92,246,0.08)"
          : "0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-4px) scale(1.01)" : "translateY(0) scale(1)",
        backdropFilter: "blur(12px)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Accent bar top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%)" }}
      />

      <div className="flex flex-col gap-1 p-2.5 flex-1 min-h-0 min-w-0">
        {/* Ligne 1 : icône + nom à droite */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0
              shadow-sm transition-transform duration-200 group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(99,102,241,0.06) 100%)",
              border: "1px solid rgba(139,92,246,0.15)",
            }}
          >
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
        <div className="flex items-center gap-1.5 flex-wrap mt-auto">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
            style={{
              background: "rgba(139,92,246,0.08)",
              color: "#5b21b6",
              border: "1px solid rgba(139,92,246,0.12)",
            }}
          >
            {skill.categoryName}
          </span>
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
            style={{
              background: "rgba(99,102,241,0.06)",
              color: "#4338ca",
              border: "1px solid rgba(99,102,241,0.1)",
            }}
          >
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
    <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
      <div className="relative">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.16)" }}
        >
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(109,40,217,0.1)", backdropFilter: "blur(10px)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(139,92,246,0.2)",
          backdropFilter: "blur(32px)",
          boxShadow: "0 32px 80px rgba(109,40,217,0.18), 0 8px 32px rgba(109,40,217,0.1)",
        }}
      >
        <div className="h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.6) 50%, transparent)" }} />

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.22)" }}>
              <BoltIcon className="w-4 h-4 text-violet-600" />
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
              className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                text-xs font-semibold text-white overflow-hidden
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200 active:scale-[0.97]
                focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                boxShadow: "0 4px 18px rgba(124,58,237,0.36), inset 0 1px 0 rgba(255,255,255,0.22)",
              }}
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
      className="w-full px-4 py-2.5 rounded-xl text-sm text-violet-950
        placeholder:text-slate-300 bg-violet-50/60
        focus:outline-none transition-all duration-200"
      style={{ border: "1px solid rgba(139,92,246,0.2)" }}
      onFocus={(e) => {
        e.currentTarget.style.border = "1px solid rgba(124,58,237,0.55)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)";
        e.currentTarget.style.background = "rgba(248,247,255,0.9)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.border = "1px solid rgba(139,92,246,0.2)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.background = "rgba(245,243,255,0.6)";
        props.onBlur?.(e);
      }}
    />
  );
}

function StyledSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full appearance-none px-4 py-2.5 pr-8 rounded-xl text-sm text-violet-950
        bg-violet-50/60 focus:outline-none transition-all duration-200 cursor-pointer"
      style={{ border: "1px solid rgba(139,92,246,0.2)" }}
      onFocus={(e) => {
        e.currentTarget.style.border = "1px solid rgba(124,58,237,0.55)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)";
        e.currentTarget.style.background = "#fff";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.border = "1px solid rgba(139,92,246,0.2)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.background = "rgba(245,243,255,0.6)";
        props.onBlur?.(e);
      }}
    />
  );
}