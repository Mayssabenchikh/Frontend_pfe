import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faComments,
  faMagnifyingGlass,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { forumService } from "../../services/forumService";
import type { ForumPostSummaryDto, ForumPostType, ForumPostsSort, ForumVoteType } from "../../types/forum";
import { ForumLayout } from "../../components/forum/ForumLayout";
import { ForumSidebar } from "../../components/forum/ForumSidebar";
import { ForumFilters } from "../../components/forum/ForumFilters";
import { ForumCategoryTabs } from "../../components/forum/ForumCategoryTabs";
import { ForumPostCard } from "../../components/forum/ForumPostCard";
import { ForumPostEditor } from "../../components/forum/ForumPostEditor";
import { ForumEmptyState } from "../../components/forum/ForumEmptyState";
import { ForumLoadingState } from "../../components/forum/ForumLoadingState";
import { ForumReportModal } from "../../components/forum/ForumReportModal";
import type { ForumCategoryDto } from "../../types/forum";

export function ForumPage() {
  const [categories, setCategories] = useState<ForumCategoryDto[]>([]);
  const [posts, setPosts] = useState<ForumPostSummaryDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryUuid, setCategoryUuid] = useState<string | null>(null);
  const [postType, setPostType] = useState<ForumPostType | null>(null);
  const [qDraft, setQDraft] = useState("");
  const [q, setQ] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [tag, setTag] = useState("");
  const [sort, setSort] = useState<ForumPostsSort>("new");
  const [editorOpen, setEditorOpen] = useState(false);
  const [reportPost, setReportPost] = useState<ForumPostSummaryDto | null>(null);

  const loadCategories = useCallback(() => {
    forumService.getCategories().then((r) => setCategories(r.data)).catch(() => setCategories([]));
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await forumService.getPosts({
        q: q || undefined,
        categoryUuid: categoryUuid ?? undefined,
        type: postType ?? undefined,
        tag: tag || undefined,
        sort,
        page,
        size: 15,
      });
      setPosts(res.data.items);
      setTotalPages(res.data.totalPages);
    } catch {
      setError("Impossible de charger le forum.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [q, categoryUuid, postType, tag, sort, page]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  type VoteResponseShape = { score: number; upvoteCount: number; downvoteCount: number; myVote: ForumVoteType | null };

  const refreshVote = (uuid: string, v: VoteResponseShape) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.uuid === uuid ? { ...p, score: v.score, upvoteCount: v.upvoteCount, downvoteCount: v.downvoteCount, myVote: v.myVote } : p,
      ),
    );
  };

  const onVote = async (uuid: string, t: ForumVoteType) => {
    try {
      const r = await forumService.votePost(uuid, t);
      refreshVote(uuid, r.data);
    } catch {
      /* ignore */
    }
  };

  const onSave = async (uuid: string) => {
    try {
      const r = await forumService.toggleSavePost(uuid);
      setPosts((prev) => prev.map((p) => (p.uuid === uuid ? { ...p, savedByMe: r.data.saved } : p)));
    } catch {
      /* ignore */
    }
  };

  const pinnedFirst = [...posts].sort((a, b) => Number(b.pinned) - Number(a.pinned));

  return (
    <>
      {/* Forum Hero Header */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-slate-50 shadow-sm">
        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 shadow-md">
                <FontAwesomeIcon icon={faComments} className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Forum Skillify</h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Partagez des ressources, posez vos questions et améliorez les formations.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700"
            >
              <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4" />
              Nouveau post
            </button>
          </div>

          {/* Quick search */}
          <div className="relative mt-5">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(0);
                  setQ(qDraft);
                }
              }}
              placeholder="Rechercher une discussion, question, ressource…"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-300/30"
            />
          </div>
        </div>
      </div>

      <ForumLayout
        left={
          <ForumSidebar
            categories={categories}
            selectedUuid={categoryUuid}
            onSelectCategory={(id) => {
              setPage(0);
              setCategoryUuid(id);
            }}
          />
        }
        main={
          <div className="space-y-4">
            {/* Type filter pills */}
            <ForumCategoryTabs value={postType} onChange={(t) => { setPage(0); setPostType(t); }} />

            {/* Tag + sort filters */}
            <ForumFilters
              q={qDraft}
              onQChange={setQDraft}
              tag={tagDraft}
              onTagChange={setTagDraft}
              sort={sort}
              onSortChange={(s) => { setPage(0); setSort(s); }}
              onApply={() => {
                setPage(0);
                setQ(qDraft);
                setTag(tagDraft);
              }}
            />

            {/* Error */}
            {error ? (
              <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <FontAwesomeIcon icon={faTriangleExclamation} className="h-4 w-4 shrink-0" />
                {error}
                <button
                  type="button"
                  onClick={() => void loadPosts()}
                  className="ml-auto text-xs font-medium underline hover:no-underline"
                >
                  Réessayer
                </button>
              </div>
            ) : null}

            {/* Loading */}
            {loading ? <ForumLoadingState /> : null}

            {/* Empty */}
            {!loading && !error && pinnedFirst.length === 0 ? (
              <ForumEmptyState
                title="Aucune publication pour l'instant"
                description="Soyez le premier à lancer une discussion ou partager une ressource utile."
                action={
                  <button
                    type="button"
                    onClick={() => setEditorOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPenToSquare} className="h-3.5 w-3.5" />
                    Créer un post
                  </button>
                }
              />
            ) : null}

            {/* Posts list */}
            {!loading && pinnedFirst.length > 0 ? (
              <div className="space-y-3">
                {pinnedFirst.map((p) => (
                  <ForumPostCard key={p.uuid} post={p} onVote={onVote} onSave={onSave} onReport={setReportPost} />
                ))}
              </div>
            ) : null}

            {/* Pagination */}
            {totalPages > 1 ? (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => setPage((x) => Math.max(0, x - 1))}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  ← Précédent
                </button>
                <span className="text-sm text-slate-500">
                  Page <strong className="text-slate-800">{page + 1}</strong> / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((x) => x + 1)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 transition-colors"
                >
                  Suivant →
                </button>
              </div>
            ) : null}
          </div>
        }
        right={
          <div className="space-y-4">
            <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-violet-950">Bonnes pratiques du forum</h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                {[
                  "Liez vos questions à une formation ou compétence.",
                  "Votez pour faire remonter les meilleures réponses.",
                  "Signalez les contenus inappropriés.",
                  "Utilisez des tags pour faciliter la recherche.",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
      />

      <ForumPostEditor
        categories={categories}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onCreated={() => void loadPosts()}
        createPost={async (payload) => {
          await forumService.createPost(payload);
        }}
      />
      <ForumReportModal
        open={reportPost !== null}
        title="Signaler une publication"
        onClose={() => setReportPost(null)}
        onSubmit={async (reason, details) => {
          if (!reportPost) return;
          await forumService.reportPost(reportPost.uuid, { reason, details });
        }}
      />
    </>
  );
}
