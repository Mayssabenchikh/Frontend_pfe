import type { ForumCommentDto, ForumPostType, ForumVoteType } from "../../types/forum";
import { ForumCommentItem } from "./ForumCommentItem";

type Props = {
  comments: ForumCommentDto[];
  postType: ForumPostType;
  postAuthorKeycloakId: string;
  currentUserKeycloakId: string | undefined;
  isAdmin: boolean;
  locked: boolean;
  onVote: (commentUuid: string, t: ForumVoteType) => void;
  onReply: (parentUuid: string, content: string) => Promise<void>;
  onAccept?: (commentUuid: string) => void;
  onReport?: (comment: ForumCommentDto) => void;
};

export function ForumCommentTree({
  comments,
  postType,
  postAuthorKeycloakId,
  currentUserKeycloakId,
  isAdmin,
  locked,
  onVote,
  onReply,
  onAccept,
  onReport,
}: Props) {
  const itemProps = {
    postType,
    postAuthorKeycloakId,
    currentUserKeycloakId,
    isAdmin,
    locked,
    onVote,
    onReply,
    onAccept,
    onReport,
  };
  return (
    <ul className="space-y-3">
      {comments.map((c) => (
        <ForumCommentItem key={c.uuid} comment={c} {...itemProps} />
      ))}
    </ul>
  );
}
