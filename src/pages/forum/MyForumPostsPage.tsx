import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileLines } from "@fortawesome/free-solid-svg-icons";
import { forumService } from "../../services/forumService";
import type { ForumPostSummaryDto, ForumVoteType } from "../../types/forum";
import { ForumPostCard } from "../../components/forum/ForumPostCard";
import { ForumLoadingState } from "../../components/forum/ForumLoadingState";
import { ForumEmptyState } from "../../components/forum/ForumEmptyState";

export function MyForumPostsPage() {
  const [posts, setPosts] = useState<ForumPostSummaryDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await forumService.getMyPosts(page, 15);
      setPosts(r.data.items);
      setTotalPages(r.data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const onVote = async (uuid: string, t: ForumVoteType) => {
    const r = await forumService.votePost(uuid, t);
    setPosts((prev) =>
      prev.map((p) =>
        p.uuid === uuid
          ? { ...p, score: r.data.score, upvoteCount: r.data.upvoteCount, downvoteCount: r.data.downvoteCount, myVote: r.data.myVote }
          : p,
      ),
    );
  };

  const onSave = async (uuid: string) => {
    const r = await forumService.toggleSavePost(uuid);
    setPosts((prev) => prev.map((p) => (p.uuid === uuid ? { ...p, savedByMe: r.data.saved } : p)));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
          <FontAwesomeIcon icon={faFileLines} className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mes publications</h1>
          <p className="text-sm text-slate-500">Retrouvez tous vos posts sur le forum.</p>
        </div>
      </div>
      {loading ? (
        <ForumLoadingState />
      ) : posts.length === 0 ? (
        <ForumEmptyState
          icon={faFileLines}
          title="Vous n'avez pas encore publié"
          description="Créez un post depuis le fil principal pour partager avec la communauté."
        />
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <ForumPostCard key={p.uuid} post={p} onVote={onVote} onSave={onSave} />
          ))}
        </div>
      )}
      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 0}
            onClick={() => setPage((x) => x - 1)}
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
  );
}
