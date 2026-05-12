import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faCommentDots,
  faEye,
  faThumbtack,
  faLock,
  faGraduationCap,
  faBullseye,
  faCircleQuestion,
  faBookOpen,
  faComments,
  faBullhorn,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import type { ForumPostSummaryDto, ForumVoteType } from "../../types/forum";
import { ForumVoteButtons } from "./ForumVoteButtons";

type Props = {
  post: ForumPostSummaryDto;
  onVote: (uuid: string, t: ForumVoteType) => void;
  onSave: (uuid: string) => void;
};

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
  return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function getAuthorInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ForumPostCard({ post, onVote, onSave }: Props) {
  const typeIcon = TYPE_ICON[post.type] ?? faLayerGroup;
  const typeColor = TYPE_COLOR[post.type] ?? "bg-slate-100 text-slate-700";

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-violet-100 hover:shadow-md">
      <div className="flex">
      <div className="flex shrink-0 flex-col items-center border-r border-slate-100 bg-slate-50/60 px-2 py-4">
        <ForumVoteButtons
          score={post.score}
          myVote={post.myVote}
          onVote={(t) => onVote(post.uuid, t)}
        />
      </div>

      <div className="min-w-0 flex-1 p-4">
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
            <FontAwesomeIcon icon={typeIcon} className="h-2.5 w-2.5" />
            {TYPE_LABEL[post.type] ?? post.type}
          </span>
          <span className="text-[10px] font-medium text-slate-400">·</span>
          <span className="text-[10px] font-medium text-slate-500">{post.category.name}</span>
          {post.learningProgramTitle ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 ring-1 ring-indigo-200">
              <FontAwesomeIcon icon={faGraduationCap} className="h-2.5 w-2.5" />
              {post.learningProgramTitle}
            </span>
          ) : null}
          {post.skillName ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-200">
              <FontAwesomeIcon icon={faBullseye} className="h-2.5 w-2.5" />
              {post.skillName}
            </span>
          ) : null}
        </div>

        <Link
          to={`/forum/post/${post.uuid}`}
          className="mt-3 block text-base font-semibold leading-snug text-slate-900 transition-colors hover:text-violet-700 sm:text-lg"
        >
          {post.title}
        </Link>

        {post.contentPreview ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{post.contentPreview}</p>
        ) : null}

        {post.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 5).map((t) => (
              <span key={t.uuid} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                #{t.name}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-700">
              {getAuthorInitials(post.author.fullName)}
            </span>
            <span className="font-medium text-slate-700">{post.author.fullName}</span>
          </div>
          <span className="text-slate-300">·</span>
          <span>{getRelativeDate(post.createdAt)}</span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1">
            <FontAwesomeIcon icon={faCommentDots} className="h-3.5 w-3.5" />
            {post.commentCount} commentaire{post.commentCount !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1">
            <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
            {post.viewCount}
          </span>

          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onSave(post.uuid)}
              title={post.savedByMe ? "Retirer des enregistrés" : "Enregistrer"}
              className={[
                "flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                post.savedByMe
                  ? "bg-amber-50 text-amber-700"
                  : "text-slate-400 hover:bg-slate-100 hover:text-amber-600",
              ].join(" ")}
            >
              <FontAwesomeIcon icon={faBookmark} className="h-3.5 w-3.5" />
              {post.savedByMe ? <span>Enregistré</span> : null}
            </button>
          </div>
        </div>
      </div>
      </div>
    </article>
  );
}
