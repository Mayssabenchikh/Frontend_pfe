import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBookmark,
  faFlag,
  faWandMagicSparkles,
  faThumbtack,
  faLock,
  faStar,
  faGraduationCap,
  faBullseye,
  faShieldHalved,
  faCommentDots,
  faEye,
  faCircleQuestion,
  faBookOpen,
  faComments,
  faBullhorn,
  faArrowUpRightFromSquare,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { getRealmRoles } from "../../auth/roles";
import { forumService } from "../../services/forumService";
import type { ForumCommentDto, ForumPostDetailDto, ForumVoteType } from "../../types/forum";
import { ForumVoteButtons } from "../../components/forum/ForumVoteButtons";
import { ForumAttachmentPreview } from "../../components/forum/ForumAttachmentPreview";
import { ForumCommentTree } from "../../components/forum/ForumCommentTree";
import { ForumCommentEditor } from "../../components/forum/ForumCommentEditor";
import { ForumLoadingState } from "../../components/forum/ForumLoadingState";
import { ForumReportModal } from "../../components/forum/ForumReportModal";
import { ForumResourcePromoteModal } from "../../components/forum/ForumResourcePromoteModal";

const TYPE_LABEL: Record<string, string> = {
  QUESTION: "Question",
  RESOURCE: "Ressource",
  DISCUSSION: "Discussion",
  TRAINING_FEEDBACK: "Retour formation",
  ANNOUNCEMENT: "Annonce",
};

const TYPE_COLOR: Record<string, string> = {
  QUESTION: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  RESOURCE: "bg-blue-50 text-blue-800 ring-1 ring-blue-200",
  DISCUSSION: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  TRAINING_FEEDBACK: "bg-violet-50 text-violet-800 ring-1 ring-violet-200",
  ANNOUNCEMENT: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

const TYPE_ICON: Record<string, typeof faCircleQuestion> = {
  QUESTION: faCircleQuestion,
  RESOURCE: faBookOpen,
  DISCUSSION: faComments,
  TRAINING_FEEDBACK: faGraduationCap,
  ANNOUNCEMENT: faBullhorn,
};

function getRelativeDate(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function getAuthorInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ForumPostDetailPage() {
  const { postUuid } = useParams<{ postUuid: string }>();
  const navigate = useNavigate();
  const { keycloak } = useKeycloak();
  const subject = keycloak.subject;
  const tokenParsed = keycloak.tokenParsed;
  const roles = getRealmRoles(tokenParsed ?? undefined);
  const isAdmin = roles.includes("ADMIN");
  const canPromote = roles.includes("ADMIN") || roles.includes("TRAINING_MANAGER");

  const [post, setPost] = useState<ForumPostDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<{ type: "POST" | "COMMENT"; comment?: ForumCommentDto } | null>(null);
  const [promote, setPromote] = useState<{ type: "POST" | "COMMENT"; comment?: ForumCommentDto } | null>(null);

  const load = useCallback(async () => {
    if (!postUuid) return;
    setLoading(true);
    setError(null);
    try {
      const r = await forumService.getPost(postUuid);
      setPost(r.data);
    } catch {
      setError("Publication introuvable ou inaccessible.");
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [postUuid]);

  useEffect(() => {
    void load();
  }, [load]);

  const mergeCommentVote = (
    comments: ForumCommentDto[],
    commentUuid: string,
    v: { score: number; upvoteCount: number; downvoteCount: number; myVote: ForumVoteType | null },
  ): ForumCommentDto[] =>
    comments.map((c) => {
      if (c.uuid === commentUuid) {
        return { ...c, score: v.score, upvoteCount: v.upvoteCount, downvoteCount: v.downvoteCount, myVote: v.myVote };
      }
      if (c.replies.length) {
        return { ...c, replies: mergeCommentVote(c.replies, commentUuid, v) };
      }
      return c;
    });

  const onVotePost = async (t: ForumVoteType) => {
    if (!postUuid) return;
    try {
      const r = await forumService.votePost(postUuid, t);
      setPost((p) =>
        p ? { ...p, score: r.data.score, upvoteCount: r.data.upvoteCount, downvoteCount: r.data.downvoteCount, myVote: r.data.myVote } : p,
      );
    } catch {
      /* ignore */
    }
  };

  const onVoteComment = async (commentUuid: string, t: ForumVoteType) => {
    try {
      const r = await forumService.voteComment(commentUuid, t);
      setPost((p) => (p ? { ...p, comments: mergeCommentVote(p.comments, commentUuid, r.data) } : p));
    } catch {
      /* ignore */
    }
  };

  const onReply = async (parentUuid: string, content: string) => {
    if (!postUuid) return;
    await forumService.addComment(postUuid, { content, parentCommentUuid: parentUuid });
    await load();
  };

  const onNewComment = async (content: string) => {
    if (!postUuid) return;
    await forumService.addComment(postUuid, { content });
    await load();
  };

  const onSave = async () => {
    if (!postUuid) return;
    try {
      const r = await forumService.toggleSavePost(postUuid);
      setPost((p) => (p ? { ...p, savedByMe: r.data.saved } : p));
    } catch {
      /* ignore */
    }
  };

  const onAccept = async (commentUuid: string) => {
    if (!postUuid) return;
    await forumService.acceptAnswer(postUuid, commentUuid);
    await load();
  };

  const moderate = async (patch: { pinned?: boolean; hidden?: boolean; locked?: boolean }) => {
    if (!postUuid) return;
    const r = await forumService.moderatePost(postUuid, patch);
    setPost(r.data);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-700 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
          Retour
        </button>
        <ForumLoadingState label="Chargement de la discussion…" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-700 transition-colors"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
          Retour
        </button>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
          <FontAwesomeIcon icon={faTriangleExclamation} className="h-10 w-10 text-rose-400" />
          <p className="mt-4 text-base font-semibold text-rose-900">{error ?? "Publication introuvable"}</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 transition-colors"
            >
              Réessayer
            </button>
            <Link to="/forum" className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100 transition-colors">
              Retour au forum
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const typeIcon = TYPE_ICON[post.type];
  const typeColor = TYPE_COLOR[post.type] ?? "bg-slate-100 text-slate-700";

  return (
    <div className="space-y-5">
      {/* Back navigation */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-violet-700 transition-colors"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
        Retour au forum
      </button>

      {/* Two-column layout on large screens */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-5">
          {/* Post article */}
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex gap-0">
              {/* Votes column */}
              <div className="flex w-14 shrink-0 flex-col items-center border-r border-slate-100 bg-slate-50/60 py-5 px-1">
                <ForumVoteButtons score={post.score} myVote={post.myVote} onVote={onVotePost} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 p-5">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {post.pinned ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200">
                      <FontAwesomeIcon icon={faThumbtack} className="h-2.5 w-2.5" />
                      Épinglé
                    </span>
                  ) : null}
                  {post.locked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
                      <FontAwesomeIcon icon={faLock} className="h-2.5 w-2.5" />
                      Verrouillé
                    </span>
                  ) : null}
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeColor}`}>
                    {typeIcon ? <FontAwesomeIcon icon={typeIcon} className="h-2.5 w-2.5" /> : null}
                    {TYPE_LABEL[post.type] ?? post.type}
                  </span>
                  <span className="text-[10px] text-slate-400">·</span>
                  <span className="text-[10px] font-medium text-slate-500">{post.category.name}</span>
                  {post.officialResource ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-800 ring-1 ring-violet-200">
                      <FontAwesomeIcon icon={faStar} className="h-2.5 w-2.5" />
                      Ressource officielle
                    </span>
                  ) : null}
                </div>

                {/* Title */}
                <h1 className="mt-3 text-xl font-bold leading-snug text-slate-900">{post.title}</h1>

                {/* Author + meta */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-700">
                      {getAuthorInitials(post.author.fullName)}
                    </span>
                    <span className="font-medium text-slate-700">{post.author.fullName}</span>
                  </div>
                  <span>{getRelativeDate(post.createdAt)}</span>
                  <span className="inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faCommentDots} className="h-3.5 w-3.5" />
                    {post.commentCount} commentaire{post.commentCount !== 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                    {post.viewCount} vue{post.viewCount !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* External link */}
                {post.externalUrl ? (
                  <a
                    href={post.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-sm font-medium text-violet-700 ring-1 ring-slate-200 hover:bg-violet-50 hover:ring-violet-200 transition-colors"
                  >
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="h-3.5 w-3.5" />
                    Voir le lien externe
                  </a>
                ) : null}

                {/* Content */}
                <div className="prose prose-slate mt-4 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {post.content}
                </div>

                {/* Attachments */}
                <ForumAttachmentPreview attachments={post.attachments} />

                {/* Tags */}
                {post.tags && post.tags.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {post.tags.map((t) => (
                      <span key={t.uuid} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        #{t.name}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Actions */}
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={onSave}
                    className={[
                      "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      post.savedByMe
                        ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                        : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-800",
                    ].join(" ")}
                  >
                    <FontAwesomeIcon icon={faBookmark} className="h-3.5 w-3.5" />
                    {post.savedByMe ? "Enregistré" : "Enregistrer"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportTarget({ type: "POST" })}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faFlag} className="h-3.5 w-3.5" />
                    Signaler
                  </button>
                  {canPromote ? (
                    <button
                      type="button"
                      onClick={() => setPromote({ type: "POST" })}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-800 ring-1 ring-indigo-200 hover:bg-indigo-100 transition-colors"
                    >
                      <FontAwesomeIcon icon={faWandMagicSparkles} className="h-3.5 w-3.5" />
                      Promouvoir en ressource
                    </button>
                  ) : null}
                </div>

                {/* Admin moderation */}
                {isAdmin ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <FontAwesomeIcon icon={faShieldHalved} className="h-3.5 w-3.5 text-violet-500" />
                      Modération
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => moderate({ pinned: !post.pinned })}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${post.pinned ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50"}`}
                      >
                        <FontAwesomeIcon icon={faThumbtack} className="mr-1 h-3 w-3" />
                        {post.pinned ? "Désépingler" : "Épingler"}
                      </button>
                      <button
                        type="button"
                        onClick={() => moderate({ hidden: !post.hidden })}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                      >
                        {post.hidden ? "Afficher" : "Masquer"}
                      </button>
                      <button
                        type="button"
                        onClick={() => moderate({ locked: !post.locked })}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${post.locked ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50"}`}
                      >
                        <FontAwesomeIcon icon={faLock} className="mr-1 h-3 w-3" />
                        {post.locked ? "Déverrouiller" : "Verrouiller"}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </article>

          {/* Comments section */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                Commentaires
                <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-sm font-semibold text-slate-600">
                  {post.commentCount}
                </span>
              </h2>
              {post.locked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                  <FontAwesomeIcon icon={faLock} className="h-3 w-3" />
                  Discussion verrouillée
                </span>
              ) : null}
            </div>

            {!post.locked ? (
              <ForumCommentEditor placeholder="Participez à la discussion…" onSubmit={onNewComment} />
            ) : null}

            <ForumCommentTree
              comments={post.comments}
              postType={post.type}
              postAuthorKeycloakId={post.author.keycloakId}
              currentUserKeycloakId={subject}
              isAdmin={isAdmin}
              canPromote={canPromote}
              locked={post.locked}
              onVote={onVoteComment}
              onReply={onReply}
              onAccept={onAccept}
              onReport={(c) => setReportTarget({ type: "COMMENT", comment: c })}
              onPromote={(c) => setPromote({ type: "COMMENT", comment: c })}
            />
          </section>
        </div>

        {/* ── Right panel (desktop only) ── */}
        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-4">
            {/* Post info card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">À propos de ce post</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-400">Auteur</dt>
                  <dd className="mt-0.5 flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-700">
                      {getAuthorInitials(post.author.fullName)}
                    </span>
                    <span className="font-medium text-slate-800">{post.author.fullName}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Publié le</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">{new Date(post.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Catégorie</dt>
                  <dd className="mt-0.5 font-medium text-slate-700">{post.category.name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Type</dt>
                  <dd className="mt-0.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeColor}`}>
                      {typeIcon ? <FontAwesomeIcon icon={typeIcon} className="h-2.5 w-2.5" /> : null}
                      {TYPE_LABEL[post.type] ?? post.type}
                    </span>
                  </dd>
                </div>
                <div className="flex gap-4 border-t border-slate-100 pt-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{post.score}</p>
                    <p className="text-[10px] text-slate-400">Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{post.viewCount}</p>
                    <p className="text-[10px] text-slate-400">Vues</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-900">{post.commentCount}</p>
                    <p className="text-[10px] text-slate-400">Réponses</p>
                  </div>
                </div>
              </dl>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Tags</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.map((t) => (
                    <span key={t.uuid} className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      #{t.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Linked training */}
            {post.learningProgramTitle ? (
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faGraduationCap} className="h-4 w-4 text-indigo-600" />
                  <h3 className="text-xs font-semibold text-indigo-900">Formation liée</h3>
                </div>
                <p className="mt-2 text-sm font-medium text-indigo-800">{post.learningProgramTitle}</p>
              </div>
            ) : null}

            {/* Linked skill */}
            {post.skillName ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faBullseye} className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-semibold text-emerald-900">Compétence liée</h3>
                </div>
                <p className="mt-2 text-sm font-medium text-emerald-800">{post.skillName}</p>
              </div>
            ) : null}

            {/* Official resource */}
            {post.officialResource ? (
              <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faStar} className="h-4 w-4 text-violet-600" />
                  <h3 className="text-xs font-semibold text-violet-900">Ressource officielle</h3>
                </div>
                <p className="mt-1 text-xs text-violet-700">Ce post a été promu en ressource officielle de formation.</p>
              </div>
            ) : null}

            {/* Promote action (visible when not yet official resource) */}
            {canPromote && !post.officialResource ? (
              <button
                type="button"
                onClick={() => setPromote({ type: "POST" })}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-800 hover:bg-indigo-100 transition-colors"
              >
                <FontAwesomeIcon icon={faWandMagicSparkles} className="h-4 w-4" />
                Promouvoir en ressource
              </button>
            ) : null}
          </div>
        </aside>
      </div>

      {/* Modals */}
      <ForumReportModal
        open={reportTarget !== null}
        title={reportTarget?.type === "COMMENT" ? "Signaler un commentaire" : "Signaler la publication"}
        onClose={() => setReportTarget(null)}
        onSubmit={async (reason, details) => {
          if (reportTarget?.type === "COMMENT" && reportTarget.comment) {
            await forumService.reportComment(reportTarget.comment.uuid, { reason, details });
          } else if (postUuid) {
            await forumService.reportPost(postUuid, { reason, details });
          }
        }}
      />

      <ForumResourcePromoteModal
        open={promote !== null}
        onClose={() => setPromote(null)}
        sourceType={promote?.type === "COMMENT" ? "COMMENT" : "POST"}
        sourceUuid={promote?.type === "COMMENT" && promote.comment ? promote.comment.uuid : post.uuid}
        defaultTitle={promote?.type === "COMMENT" && promote.comment ? `Réponse : ${post.title.slice(0, 80)}` : post.title}
        defaultSummary={
          promote?.type === "COMMENT" && promote.comment ? promote.comment.content.slice(0, 2000) : post.content.slice(0, 2000)
        }
        defaultUrl={post.externalUrl}
        tokenParsed={tokenParsed}
        onSubmit={async (payload) => {
          await forumService.promoteToResource(payload);
          await load();
        }}
      />
    </div>
  );
}
