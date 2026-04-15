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
import { AlertBanner } from "../../components/AlertBanner";

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
  const [createIconFile, setCreateIconFile] = useState<File | null>(null);
  const [editIconFile, setEditIconFile] = useState<File | null>(null);

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
      .then(async (res) => {
        const created = res.data;
        if (createIconFile && created?.id) {
          await skillsApi.uploadCategoryIcon(created.id, createIconFile);
        }
        load();
        setCreateModal(false);
        setNewName("");
        setCreateIconFile(null);
        toast.success("Catégorie créée avec succès");
      })
      .catch((err) => toast.error(getApiError(err, "Échec de la création")))
      .finally(() => setSubmitLoading(false));
  };

  const handleUpdateClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    const name = editName.trim();
    if (!name) return;
    if (name === editModal.name && !editIconFile) {
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
    Promise.resolve()
      .then(() => (name !== editModal.name ? skillsApi.updateCategory(editModal.id, name) : null))
      .then(async () => {
        if (editIconFile) {
          await skillsApi.uploadCategoryIcon(editModal.id, editIconFile);
        }
      })
      .then(() => {
        load();
        setEditModal(null);
        setEditName("");
        setEditIconFile(null);
        toast.success("Catégorie mise à jour");
      })
      .catch((err) => toast.error(getApiError(err, "Échec de la mise à jour")))
      .finally(() => setSubmitLoading(false));
  };

  const handleDeleteClick = (c: SkillCategoryDto) => {
    setDeleteConfirm(c);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const c = deleteConfirm;
    setDeleteConfirm(null);
    setDeletingId(c.id);
    skillsApi.deleteCategory(c.id)
      .then(() => {
        load();
        if ((c.skillsCount ?? 0) > 0) {
          toast.success("Catégorie supprimée", {
            description: "Les compétences de cette catégorie (et leurs affectations) ont été supprimées automatiquement.",
          });
        } else {
          toast.success("Catégorie supprimée");
        }
      })
      .catch((err) => toast.error(getApiError(err, "Échec de la suppression")))
      .finally(() => setDeletingId(null));
  };

  const openEdit = (c: SkillCategoryDto) => { setEditModal(c); setEditName(c.name); setEditIconFile(null); };

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

      <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f8f7ff]">
        {/* ── Toolbar ── */}
        <div className="relative z-10 flex flex-wrap items-center gap-3 border-b border-violet-500/10 px-6 py-2">
          {/* Left: search */}
          <div className="relative min-w-[240px] max-w-[400px] flex-1">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une catégorie…"
              className="w-full rounded-xl border border-violet-500/20 bg-white py-2.5 pl-9 pr-4 text-sm text-violet-900 outline-none transition-all duration-150 focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          {/* Right: count + CTA (même style que SkillsCatalog) */}
          <div className="ml-auto flex items-center gap-3">
            {/* Count badge */}
            <p className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-violet-400">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
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
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border-none bg-gradient-to-br from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:-translate-y-px hover:shadow-xl hover:shadow-indigo-500/50"
            >
              <PlusIcon className="h-4 w-4" />
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
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 0.85, 0.7, 0.55, 0.4, 0.25].map((_, i) => (
                <div
                  key={i}
                  className="h-[160px] rounded-2xl border border-violet-500/10 bg-violet-500/[0.06] animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <AlertBanner message={error} />
          )}

          {/* Empty state */}
          {!loading && !error && categories.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-5 py-28 text-center">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-500/20 bg-violet-500/10">
                  <SparklesIcon className="h-7 w-7 text-violet-500" />
                </div>
                <div className="absolute inset-0 -z-10 rounded-3xl bg-violet-400/40 blur-xl" />
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
            <FormField label="Icône (optionnel)">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCreateIconFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-xl border border-violet-500/20 bg-violet-50/60 px-4 py-3 text-sm text-violet-950 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-violet-700"
              />
              {createIconFile ? (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={URL.createObjectURL(createIconFile)}
                    alt=""
                    className="h-12 w-12 rounded-2xl border border-violet-200 bg-white object-contain p-1.5 shadow-sm [image-rendering:auto] contrast-125 saturate-125"
                  />
                  <button
                    type="button"
                    onClick={() => setCreateIconFile(null)}
                    className="text-xs font-semibold text-slate-500 hover:text-violet-700"
                  >
                    Retirer
                  </button>
                </div>
              ) : null}
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
            <FormField label="Icône (optionnel)">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditIconFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-xl border border-violet-500/20 bg-violet-50/60 px-4 py-3 text-sm text-violet-950 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-violet-700"
              />
              {editIconFile ? (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={URL.createObjectURL(editIconFile)}
                    alt=""
                    className="h-12 w-12 rounded-2xl border border-violet-200 bg-white object-contain p-1.5 shadow-sm [image-rendering:auto] contrast-125 saturate-125"
                  />
                  <button
                    type="button"
                    onClick={() => setEditIconFile(null)}
                    className="text-xs font-semibold text-slate-500 hover:text-violet-700"
                  >
                    Retirer
                  </button>
                </div>
              ) : null}
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
        message={deleteConfirm
          ? (deleteConfirm.skillsCount ?? 0) > 0
            ? `Supprimer la catégorie « ${deleteConfirm.name} » ? Cette action supprimera aussi ${deleteConfirm.skillsCount ?? 0} compétence(s) de cette catégorie et leurs affectations (employés/projets).`
            : `Supprimer la catégorie « ${deleteConfirm.name} » ?`
          : ""}
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
  const iconUrl = category.iconUrl || getCategoryIconUrl(category.name);
  const sampleSkills = category.sampleSkillNames?.length
    ? category.sampleSkillNames.join(", ")
    : getCategoryDescription(category.name);
  const count = category.skillsCount ?? 0;

  return (
    <article
      className="fade-up group relative flex flex-col rounded-2xl border border-violet-500/15 bg-white/90 p-5 shadow-sm transition-all duration-250 hover:border-violet-500/20 hover:shadow-[0_4px_20px_rgba(139,92,246,0.1)]"
      style={{ animationDelay: `${index * 45}ms` }}
      onMouseLeave={() => setMenuOpen(false)}
    >
      {/* En-tête : icône + titre + menu */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-violet-500/15 bg-white shadow-sm">
            {iconUrl ? (
              <img src={iconUrl} alt="" className="h-8 w-8 object-contain [image-rendering:auto] contrast-125 saturate-125 drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)]" />
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
              <div className="absolute right-0 top-full z-20 mt-1 min-w-[120px] rounded-xl border border-violet-500/15 bg-white/[0.98] py-1 shadow-xl">
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
    <div className="app-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-violet-500/20 bg-white/[0.97] shadow-[0_32px_80px_rgba(109,40,217,0.2),0_8px_32px_rgba(109,40,217,0.1),inset_0_0_0_1px_rgba(255,255,255,0.8)] backdrop-blur-[32px]">
        {/* Top violet gradient rule */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between px-7 pb-5 pt-6">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10">
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
      className="w-full rounded-xl border border-violet-500/20 bg-violet-50/60 px-4 py-3 text-sm text-violet-950 placeholder:text-slate-300 transition-all duration-200 focus:border-violet-500/55 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
        className="relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-[0_4px_18px_rgba(124,58,237,0.38),inset_0_1px_0_rgba(255,255,255,0.22)] transition-all duration-200 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitLoading && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
        {submitLoading ? "Traitement…" : submitLabel}
      </button>
    </div>
  );
}