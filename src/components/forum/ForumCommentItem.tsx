import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faReply,
} from "@fortawesome/free-solid-svg-icons";
import type { ForumCommentDto, ForumPostType, ForumVoteType } from "../../types/forum";
import { ForumVoteButtons } from "./ForumVoteButtons";
import { ForumCommentEditor } from "./ForumCommentEditor";
import { ForumAttachmentPreview } from "./ForumAttachmentPreview";

type Props = {
  comment: ForumCommentDto;
  postType: ForumPostType;
  postAuthorKeycloakId: string;
  currentUserKeycloakId: string | undefined;
  isAdmin: boolean;
  locked: boolean;
  onVote: (commentUuid: string, t: ForumVoteType) => void;
  onReply: (parentUuid: string, content: string) => Promise<void>;
  onAccept?: (commentUuid: string) => void;
};

function getAuthorInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

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

export function ForumCommentItem({
  comment,
  postType,
  postAuthorKeycloakId,
  currentUserKeycloakId,
  isAdmin,
  locked,
  onVote,
  onReply,
  onAccept,
}: Props) {
  const [replyOpen, setReplyOpen] = useState(false);
  const canAccept = postType === "QUESTION" && (postAuthorKeycloakId === currentUserKeycloakId || isAdmin);
  /* Cap indentation so comments don't become too narrow on deep threads */
  const indent = Math.min(comment.depth, 5) * 20;

  if (comment.deleted && !isAdmin) {
    return (
      <li style={{ marginLeft: indent }}>
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs italic text-slate-400">
          [Commentaire supprimé]
        </div>
        {comment.replies.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {comment.replies.map((r) => (
              <ForumCommentItem
                key={r.uuid}
                comment={r}
                postType={postType}
                postAuthorKeycloakId={postAuthorKeycloakId}
                currentUserKeycloakId={currentUserKeycloakId}
                isAdmin={isAdmin}
                locked={locked}
                onVote={onVote}
                onReply={onReply}
                onAccept={onAccept}
              />
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <li className="relative" style={{ marginLeft: indent }}>
      {/* Vertical thread line for nested comments */}
      {comment.depth > 0 && (
        <div className="absolute -left-3 top-0 h-full w-px bg-slate-200" aria-hidden />
      )}

      <div
        className={[
          "rounded-xl border bg-white shadow-sm transition-shadow",
          comment.acceptedAnswer
            ? "border-emerald-200 ring-1 ring-emerald-100"
            : "border-slate-200",
        ].join(" ")}
      >
        <div className="flex gap-3 p-3">
          {/* Votes */}
          <div className="shrink-0">
            <ForumVoteButtons
              layout="vertical"
              score={comment.score}
              myVote={comment.myVote}
              onVote={(t) => onVote(comment.uuid, t)}
            />
          </div>

          <div className="min-w-0 flex-1">
            {/* Author row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-700">
                {getAuthorInitials(comment.author.fullName)}
              </span>
              <span className="text-sm font-semibold text-slate-800">{comment.author.fullName}</span>
              <span className="text-xs text-slate-400">{getRelativeDate(comment.createdAt)}</span>
              {comment.acceptedAnswer ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
                  <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                  Meilleure réponse
                </span>
              ) : null}
            </div>

            {/* Content */}
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{comment.content}</p>
            <ForumAttachmentPreview attachments={comment.attachments} />

            {/* Actions */}
            <div className="mt-2.5 flex flex-wrap items-center gap-3">
              {!locked ? (
                <button
                  type="button"
                  onClick={() => setReplyOpen((o) => !o)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-violet-700"
                >
                  <FontAwesomeIcon icon={faReply} className="h-3 w-3" />
                  Répondre
                </button>
              ) : null}
              {canAccept && onAccept && !comment.acceptedAnswer ? (
                <button
                  type="button"
                  onClick={() => onAccept(comment.uuid)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 transition-colors hover:text-emerald-900"
                >
                  <FontAwesomeIcon icon={faCircleCheck} className="h-3 w-3" />
                  Accepter cette réponse
                </button>
              ) : null}
            </div>

            {/* Reply editor */}
            {replyOpen && !locked ? (
              <div className="mt-3">
                <ForumCommentEditor
                  placeholder="Votre réponse…"
                  submitLabel="Envoyer"
                  onCancel={() => setReplyOpen(false)}
                  onSubmit={async (c) => {
                    await onReply(comment.uuid, c);
                    setReplyOpen(false);
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies.length > 0 ? (
        <ul className="relative mt-2 space-y-2 pl-6">
          {comment.replies.map((r) => (
            <ForumCommentItem
              key={r.uuid}
              comment={r}
              postType={postType}
              postAuthorKeycloakId={postAuthorKeycloakId}
              currentUserKeycloakId={currentUserKeycloakId}
              isAdmin={isAdmin}
              locked={locked}
              onVote={onVote}
              onReply={onReply}
              onAccept={onAccept}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
