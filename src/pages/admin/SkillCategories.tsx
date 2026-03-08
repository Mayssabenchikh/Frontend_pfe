/**
 * SkillCategories — Light Mode · Violet Luxury
 *
 * Design: Crisp white canvas with violet/indigo gradient accents,
 * soft violet tinted shadows, silk-like glassmorphism on cards,
 * and premium micro-interactions.
 */

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { PlusIcon, PencilSquareIcon, TrashIcon, ArrowPathIcon, TagIcon, XMarkIcon, SparklesIcon, MagnifyingGlassIcon, ChevronLeftIcon, ChevronRightIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { skillsApi } from "../../api/skillsApi";
import type { SkillCategoryDto } from "./types";
import { getApiError } from "./utils";
import { getCategoryIconUrl, getCategoryDescription } from "./skillIcons";
import { ConfirmModal } from "../../components/ConfirmModal";
import { AlertModal } from "../../components/AlertModal";

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const PAGE_SIZE = 12;

export function SkillCategories() {
  const [page, setPage]                   = useState(0);
  const [search, setSearch]               = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [pageData, setPageData]           = useState<{ content: SkillCategoryDto[]; totalElements: number; totalPages: number } | null>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [createModal, setCreateModal]     = useState(false);
  const [editModal, setEditModal]         = useState<SkillCategoryDto | null>(null);
  const [newName, setNewName]             = useState("");
  const [editName, setEditName]           = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingId, setDeletingId]       = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<SkillCategoryDto | null>(null);
  const [blockDelete, setBlockDelete]     = useState<SkillCategoryDto | null>(null);
  const [updateConfirm, setUpdateConfirm] = useState(false);

  const categories = pageData?.content ?? [];

  const load = useCallback(() => {
    setLoading(true);
    skillsApi.listCategoriesPaginated({ page, size: PAGE_SIZE, search: searchDebounced || undefined })
      .then((res) => {
        const data = res.data;
        setPageData(data ? { content: data.content, totalElements: data.totalElements, totalPages: data.totalPages } : null);
        setError(null);
      })
      .catch((err) => { setError(getApiError(err, "Erreur lors du chargement")); setPageData(null); })
      .finally(() => setLoading(false));
  }, [page, searchDebounced]);

  useEffect(() => { setPage(0); }, [searchDebounced]);
  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => { load(); }, [load]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim(); if (!name) return;
    setSubmitLoading(true);
    skillsApi.createCategory(name)
      .then(() => { load(); setCreateModal(false); setNewName(""); toast.success("Catégorie créée avec succès"); })
      .catch((err) => toast.error(getApiError(err, "Échec de la création")))
      .finally(() => setSubmitLoading(false));
  };

  const handleUpdateClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    const name = editName.trim();
    if (!name) return;
    if (name === editModal.name) {
      setEditModal(null);
      setEditName("");
      return;
    }
    setUpdateConfirm(true);
  };

  const confirmUpdate = () => {
    if (!editModal) return;
    const name = editName.trim();
    setUpdateConfirm(false);
    setSubmitLoading(true);
    skillsApi.updateCategory(editModal.id, name)
      .then(() => { load(); setEditModal(null); setEditName(""); toast.success("Catégorie mise à jour"); })
      .catch((err) => toast.error(getApiError(err, "Échec de la mise à jour")))
      .finally(() => setSubmitLoading(false));
  };

  const handleDeleteClick = (c: SkillCategoryDto) => {
    if ((c.skillsCount ?? 0) > 0) {
      setBlockDelete(c);
      return;
    }
    setDeleteConfirm(c);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const c = deleteConfirm;
    setDeleteConfirm(null);
    setDeletingId(c.id);
    skillsApi.deleteCategory(c.id)
      .then(() => { load(); toast.success("Catégorie supprimée"); })
      .catch((err) => toast.error(getApiError(err, "Échec de la suppression")))
      .finally(() => setDeletingId(null));
  };

  const openEdit = (c: SkillCategoryDto) => { setEditModal(c); setEditName(c.name); };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
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
          {/* Left: search */}
          <div className="relative flex-1 min-w-[240px] max-w-[400px]">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-violet-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une catégorie…"
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

          {/* Right: count + CTA (même style que SkillsCatalog) */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Count badge */}
            <p className="flex items-center gap-1.5 text-xs text-violet-400 font-medium shrink-0">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                }`}
              />
              {loading
                ? "Chargement…"
                : pageData ? `${pageData.totalElements} catégorie${pageData.totalElements !== 1 ? "s" : ""}` : "—"}
            </p>

            {/* CTA — même style que Nouvel utilisateur */}
            <button
              type="button"
              onClick={() => { setNewName(""); setCreateModal(true); }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                borderRadius: 10, border: "none", padding: "9px 18px",
                fontSize: 13, fontWeight: 600, color: "#fff",
                background: "linear-gradient(135deg,#4338ca,#6d28d9)",
                cursor: "pointer", boxShadow: "0 4px 16px rgba(67,56,202,0.4)",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 6px 24px rgba(67,56,202,0.55)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(67,56,202,0.4)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <PlusIcon className="w-4 h-4" />
              Nouvelle catégorie
            </button>
          </div>
        </div>

        {/* ──────────────────────────────────────────
            Content
        ────────────────────────────────────────── */}
        <main className="relative z-10 flex-1 overflow-auto px-6 py-2">

          {/* Loading skeletons (grille de cartes) */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 0.85, 0.7, 0.55, 0.4, 0.25].map((op, i) => (
                <div
                  key={i}
                  className="h-[160px] rounded-2xl animate-pulse"
                  style={{
                    background: `rgba(139,92,246,${op * 0.06})`,
                    border: "1px solid rgba(139,92,246,0.1)",
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-3 p-4 rounded-2xl text-sm text-red-600"
              style={{
                background: "rgba(239,68,68,0.06)",
                border: "1px solid rgba(239,68,68,0.18)",
              }}
            >
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-red-100">
                <XMarkIcon className="w-3 h-3 text-red-500" />
              </div>
              {error}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && categories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-28 text-center gap-5">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{
                    background: "rgba(139,92,246,0.08)",
                    border: "1px solid rgba(139,92,246,0.18)",
                  }}
                >
                  <SparklesIcon className="w-7 h-7 text-violet-500" />
                </div>
                <div
                  className="absolute inset-0 rounded-3xl -z-10"
                  style={{
                    background: "radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 70%)",
                    filter: "blur(20px)",
                  }}
                />
              </div>
              <div>
                <p className="text-sm font-bold text-violet-900">Aucune catégorie pour l'instant</p>
                <p className="text-xs text-violet-400 mt-1.5 max-w-[260px] leading-relaxed">
                  Créez votre première catégorie pour structurer vos compétences.
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setNewName(""); setCreateModal(true); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                  text-xs font-semibold text-violet-700
                  border border-violet-300 bg-violet-50 hover:bg-violet-100
                  transition-all duration-200 active:scale-95
                  focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Créer une catégorie
              </button>
            </div>
          )}

          {/* Grid de cartes */}
          {!loading && !error && categories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((c, i) => (
                <CategoryCard
                  key={c.id}
                  category={c}
                  index={i}
                  isDeleting={deletingId === c.id}
                  onEdit={() => openEdit(c)}
                  onDelete={() => handleDeleteClick(c)}
                />
              ))}
            </div>
          )}
        </main>

        {/* ── Pagination (fixée en bas) ── */}
        {!loading && !error && categories.length > 0 && pageData && (
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
        <Modal
          title="Nouvelle catégorie"
          subtitle="Donnez un nom clair et descriptif."
          icon={<PlusIcon className="w-4 h-4 text-violet-600" />}
          onClose={() => setCreateModal(false)}
        >
          <form onSubmit={handleCreate} className="space-y-5">
            <FormField label="Nom de la catégorie">
              <StyledInput
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="ex : Développement web"
                autoFocus
              />
            </FormField>
            <ModalActions
              onCancel={() => setCreateModal(false)}
              submitLabel="Créer la catégorie"
              submitLoading={submitLoading}
              disabled={!newName.trim()}
            />
          </form>
        </Modal>
      )}

      {editModal && (
        <Modal
          title="Modifier la catégorie"
          subtitle={`Renommer « ${editModal.name} »`}
          icon={<PencilSquareIcon className="w-3.5 h-3.5 text-violet-600" />}
          onClose={() => setEditModal(null)}
        >
          <form onSubmit={handleUpdateClick} className="space-y-5">
            <FormField label="Nouveau nom">
              <StyledInput
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nom de la catégorie"
                autoFocus
              />
            </FormField>
            <ModalActions
              onCancel={() => setEditModal(null)}
              submitLabel="Enregistrer"
              submitLoading={submitLoading}
              disabled={!editName.trim()}
            />
          </form>
        </Modal>
      )}

      <AlertModal
        open={!!blockDelete}
        title="Suppression impossible"
        message={blockDelete ? (
          <>La catégorie « {blockDelete.name} » contient {blockDelete.skillsCount} compétence{(blockDelete.skillsCount ?? 0) > 1 ? "s" : ""}. Supprimez d&apos;abord les compétences ou déplacez-les vers une autre catégorie.</>
        ) : null}
        onClose={() => setBlockDelete(null)}
      />

      <ConfirmModal
        open={!!deleteConfirm}
        title="Confirmer la suppression"
        message={deleteConfirm ? `Supprimer la catégorie « ${deleteConfirm.name} » ?` : ""}
        confirmLabel="Supprimer"
        variant="danger"
        loading={deletingId !== null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <ConfirmModal
        open={updateConfirm && !!editModal}
        title="Confirmer la modification"
        message={editModal ? `Renommer « ${editModal.name} » en « ${editName.trim()} » ?` : ""}
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
   CategoryCard
───────────────────────────────────────────── */
interface CategoryCardProps {
  category: SkillCategoryDto;
  index: number;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function CategoryCard({ category, index, isDeleting, onEdit, onDelete }: CategoryCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const iconUrl = getCategoryIconUrl(category.name);
  const sampleSkills = category.sampleSkillNames?.length
    ? category.sampleSkillNames.join(", ")
    : getCategoryDescription(category.name);
  const count = category.skillsCount ?? 0;

  return (
    <article
      className="fade-up group relative flex flex-col p-5 rounded-2xl transition-all duration-250"
      style={{
        background: "rgba(255,255,255,0.9)",
        border: "1px solid rgba(139,92,246,0.12)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        animationDelay: `${index * 45}ms`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.border = "1px solid rgba(139,92,246,0.2)";
        el.style.boxShadow = "0 4px 20px rgba(139,92,246,0.1)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.border = "1px solid rgba(139,92,246,0.12)";
        el.style.boxShadow = "0 2px 12px rgba(0,0,0,0.04)";
        setMenuOpen(false);
      }}
    >
      {/* En-tête : icône + titre + menu */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.15)",
            }}
          >
            {iconUrl ? (
              <img src={iconUrl} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <TagIcon className="w-5 h-5 text-violet-500" />
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-800 truncate">{category.name}</h3>
        </div>
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Options"
            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
          >
            <EllipsisVerticalIcon className="w-4 h-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
              <div
                className="absolute right-0 top-full mt-1 py-1 rounded-xl shadow-lg z-20 min-w-[120px]"
                style={{
                  background: "rgba(255,255,255,0.98)",
                  border: "1px solid rgba(139,92,246,0.15)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                }}
              >
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onEdit(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-violet-700 hover:bg-violet-50"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" />
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onDelete(); }}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {isDeleting ? <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" /> : <TrashIcon className="w-3.5 h-3.5" />}
                  Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Nombre de compétences */}
      <p className="text-xs font-semibold text-slate-700 mb-2">
        {count} compétence{count !== 1 ? "s" : ""}
      </p>

      {/* Compétences réelles (exemples backend) */}
      {sampleSkills && (
        <p className="text-xs text-slate-500 mb-4 line-clamp-2">
          {sampleSkills}
        </p>
      )}

    </article>
  );
}

/* ─────────────────────────────────────────────
   Modal — frosted light glass
───────────────────────────────────────────── */
interface ModalProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, subtitle, icon, onClose, children }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(109,40,217,0.12)", backdropFilter: "blur(10px)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.97)",
          border: "1px solid rgba(139,92,246,0.2)",
          backdropFilter: "blur(32px)",
          boxShadow:
            "0 32px 80px rgba(109,40,217,0.2), 0 8px 32px rgba(109,40,217,0.1), 0 0 0 1px rgba(255,255,255,0.8) inset",
        }}
      >
        {/* Top violet gradient rule */}
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(124,58,237,0.6) 50%, transparent)",
          }}
        />

        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-6 pb-5">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.25)",
                }}
              >
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-sm font-bold text-violet-950 leading-none tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-violet-400 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex items-center justify-center w-7 h-7 rounded-lg
              text-slate-400 hover:text-violet-700 bg-slate-50 hover:bg-violet-50
              border border-slate-200 hover:border-violet-200
              transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-300"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-7 pb-7">{children}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   FormField
───────────────────────────────────────────── */
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-bold uppercase tracking-[0.12em] text-violet-400">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
   StyledInput — light violet focus
───────────────────────────────────────────── */
function StyledInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-4 py-3 rounded-xl text-sm text-violet-950
        placeholder:text-slate-300 bg-violet-50/60
        focus:outline-none transition-all duration-200"
      style={{ border: "1px solid rgba(139,92,246,0.2)" }}
      onFocus={(e) => {
        e.currentTarget.style.border = "1px solid rgba(124,58,237,0.55)";
        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)";
        e.currentTarget.style.background = "#ffffff";
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

/* ─────────────────────────────────────────────
   ModalActions
───────────────────────────────────────────── */
interface ModalActionsProps {
  onCancel: () => void;
  submitLabel: string;
  submitLoading: boolean;
  disabled?: boolean;
}

function ModalActions({ onCancel, submitLabel, submitLoading, disabled }: ModalActionsProps) {
  return (
    <div className="flex items-center justify-end gap-3 pt-1">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500
          bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300
          transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-300"
      >
        Annuler
      </button>

      <button
        type="submit"
        disabled={submitLoading || disabled}
        className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
          text-xs font-semibold text-white overflow-hidden
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-200 active:scale-[0.97]
          focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
          boxShadow:
            "0 4px 18px rgba(124,58,237,0.38), inset 0 1px 0 rgba(255,255,255,0.22)",
        }}
      >
        {submitLoading && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
        {submitLoading ? "Traitement…" : submitLabel}
      </button>
    </div>
  );
}