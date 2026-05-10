import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronUp, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import type { ForumVoteType } from "../../types/forum";

type Props = {
  score: number;
  myVote: ForumVoteType | null;
  disabled?: boolean;
  layout?: "vertical" | "horizontal";
  onVote: (t: ForumVoteType) => void;
};

export function ForumVoteButtons({ score, myVote, disabled, layout = "vertical", onVote }: Props) {
  const isVert = layout === "vertical";
  return (
    <div
      className={[
        "flex shrink-0 items-center",
        isVert ? "w-12 flex-col gap-0.5 py-1" : "flex-row gap-0.5 px-1 py-0.5",
      ].join(" ")}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote("UPVOTE")}
        title="Vote positif"
        aria-label="Vote positif"
        className={[
          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40",
          myVote === "UPVOTE"
            ? "bg-violet-100 text-violet-700"
            : "text-slate-400 hover:bg-violet-50 hover:text-violet-600",
        ].join(" ")}
      >
        <FontAwesomeIcon icon={faChevronUp} className="h-3.5 w-3.5" />
      </button>
      <span
        className={[
          "text-xs font-bold tabular-nums",
          isVert ? "py-0.5" : "px-1",
          myVote === "UPVOTE"
            ? "text-violet-700"
            : myVote === "DOWNVOTE"
            ? "text-rose-600"
            : "text-slate-700",
        ].join(" ")}
      >
        {score}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote("DOWNVOTE")}
        title="Vote négatif"
        aria-label="Vote négatif"
        className={[
          "flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:opacity-40",
          myVote === "DOWNVOTE"
            ? "bg-rose-50 text-rose-600"
            : "text-slate-400 hover:bg-rose-50 hover:text-rose-500",
        ].join(" ")}
      >
        <FontAwesomeIcon icon={faChevronDown} className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
