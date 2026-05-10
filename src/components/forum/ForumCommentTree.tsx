import type { ForumCommentDto, ForumPostType, ForumVoteType } from "../../types/forum";
import { ForumCommentItem } from "./ForumCommentItem";

type Props = {
  comments: ForumCommentDto[];
  postType: ForumPostType;
  postAuthorKeycloakId: string;
  currentUserKeycloakId: string | undefined;
  isAdmin: boolean;
  canPromote: boolean;
  locked: boolean;
  onVote: (commentUuid: string, t: ForumVoteType) => void;
  onReply: (parentUuid: string, content: string) => Promise<void>;
  onAccept?: (commentUuid: string) => void;
  onReport?: (comment: ForumCommentDto) => void;
  onPromote?: (comment: ForumCommentDto) => void;
};

export function ForumCommentTree({
  comments,
  postType,
  postAuthorKeycloakId,
  currentUserKeycloakId,
  isAdmin,
  canPromote,
  locked,
  onVote,
  onReply,
  onAccept,
  onReport,
  onPromote,
}: Props) {
  const itemProps = {
    postType,
    postAuthorKeycloakId,
    currentUserKeycloakId,
    isAdmin,
    canPromote,
    locked,
    onVote,
    onReply,
    onAccept,
    onReport,
    onPromote,
  };
  return (
    <ul className="space-y-3">
      {comments.map((c) => (
        <ForumCommentItem key={c.uuid} comment={c} {...itemProps} />
      ))}
    </ul>
  );
}
