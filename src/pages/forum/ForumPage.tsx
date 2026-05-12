import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPenToSquare,
  faComments,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { forumService } from "../../services/forumService";
import type { ForumPostSummaryDto, ForumPostType, ForumPostsSort, ForumVoteType } from "../../types/forum";
import { ForumLayout } from "../../components/forum/ForumLayout";
import { ForumFilters } from "../../components/forum/ForumFilters";
import { ForumCategoryTabs } from "../../components/forum/ForumCategoryTabs";
import { ForumPostCard } from "../../components/forum/ForumPostCard";
import { ForumPostEditor } from "../../components/forum/ForumPostEditor";
import { ForumEmptyState } from "../../components/forum/ForumEmptyState";
import { ForumLoadingState } from "../../components/forum/ForumLoadingState";
import { ForumPagination } from "../../components/forum/ForumPagination";
import type { ForumCategoryDto } from "../../types/forum";

export function ForumPage() {
  const [categories, setCategories] = useState<ForumCategoryDto[]>([]);
  const [posts, setPosts] = useState<ForumPostSummaryDto[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
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
        size: pageSize,
      });
      setPosts(res.data.items);
      setTotalPages(res.data.totalPages);
    } catch {
      setError("Impossible de charger le forum.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [q, categoryUuid, postType, tag, sort, page, pageSize]);

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
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 shadow-sm">
              <FontAwesomeIcon icon={faComments} className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Fil du forum</h1>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Retrouvez les questions, ressources, annonces et discussions partagées par la communauté Skillify.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 sm:w-auto"
          >
            <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4" />
            Nouveau post
          </button>
        </div>
      </div>

      <ForumLayout
        main={
          <div className="space-y-5">
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
              onClear={() => {
                setPage(0);
                setQDraft("");
                setQ("");
                setTagDraft("");
                setTag("");
                setSort("new");
              }}
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Catégories</h2>
                  <p className="mt-1 text-xs text-slate-500">Filtrez le fil sans quitter la page.</p>
                </div>
                <div className="flex max-w-full gap-2 overflow-x-auto px-1 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPage(0);
                      setCategoryUuid(null);
                    }}
                    className={[
                      "rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                      categoryUuid === null
                        ? "bg-violet-100 text-violet-800 ring-1 ring-violet-200"
                        : "bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-700",
                    ].join(" ")}
                  >
                    Toutes
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.uuid}
                      type="button"
                      onClick={() => {
                        setPage(0);
                        setCategoryUuid(c.uuid);
                      }}
                      className={[
                        "shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                        categoryUuid === c.uuid
                          ? "bg-violet-100 text-violet-800 ring-1 ring-violet-200"
                          : "bg-slate-50 text-slate-600 hover:bg-violet-50 hover:text-violet-700",
                      ].join(" ")}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <ForumCategoryTabs value={postType} onChange={(t) => { setPage(0); setPostType(t); }} />

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
                  <ForumPostCard key={p.uuid} post={p} onVote={onVote} onSave={onSave} />
                ))}
              </div>
            ) : null}

            <ForumPagination
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              disabled={loading}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPage(0);
                setPageSize(size);
              }}
            />
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
                  "Gardez des échanges respectueux et utiles.",
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
    </>
  );
}
