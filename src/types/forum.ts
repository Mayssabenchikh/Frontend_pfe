export type ForumPostType = "QUESTION" | "RESOURCE" | "DISCUSSION" | "TRAINING_FEEDBACK" | "ANNOUNCEMENT";

export type ForumVoteType = "UPVOTE" | "DOWNVOTE";

export type ForumReportTargetType = "POST" | "COMMENT";

export type ForumReportStatus = "PENDING" | "REVIEWED" | "REJECTED";

export type ForumOfficialResourceSourceType = "POST" | "COMMENT";

export type ForumCategoryDto = {
  uuid: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
};

export type ForumTagDto = {
  uuid: string;
  name: string;
};

export type ForumAuthorDto = {
  keycloakId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: string | null;
};

export type ForumAttachmentDto = {
  uuid: string;
  fileName: string;
  fileUrl: string;
  contentType: string | null;
  sizeBytes: number | null;
  createdAt: string;
};

export type ForumPostSummaryDto = {
  uuid: string;
  title: string;
  contentPreview: string;
  type: ForumPostType;
  category: ForumCategoryDto;
  author: ForumAuthorDto;
  tags: ForumTagDto[];
  learningProgramUuid: string | null;
  learningProgramTitle: string | null;
  skillUuid: string | null;
  skillName: string | null;
  score: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  viewCount: number;
  pinned: boolean;
  locked: boolean;
  officialResource: boolean;
  savedByMe: boolean;
  myVote: ForumVoteType | null;
  createdAt: string;
  updatedAt: string;
};

export type ForumCommentDto = {
  uuid: string;
  postUuid: string;
  parentCommentUuid: string | null;
  author: ForumAuthorDto;
  content: string;
  depth: number;
  score: number;
  upvoteCount: number;
  downvoteCount: number;
  acceptedAnswer: boolean;
  officialResource: boolean;
  hidden: boolean;
  deleted: boolean;
  myVote: ForumVoteType | null;
  attachments: ForumAttachmentDto[];
  replies: ForumCommentDto[];
  createdAt: string;
  updatedAt: string;
};

export type ForumPostDetailDto = {
  uuid: string;
  title: string;
  contentPreview: string;
  content: string;
  type: ForumPostType;
  category: ForumCategoryDto;
  author: ForumAuthorDto;
  tags: ForumTagDto[];
  learningProgramUuid: string | null;
  learningProgramTitle: string | null;
  skillUuid: string | null;
  skillName: string | null;
  projectUuid: string | null;
  projectName: string | null;
  externalUrl: string | null;
  score: number;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  viewCount: number;
  pinned: boolean;
  locked: boolean;
  officialResource: boolean;
  savedByMe: boolean;
  myVote: ForumVoteType | null;
  acceptedCommentUuid: string | null;
  hidden: boolean;
  deleted: boolean;
  attachments: ForumAttachmentDto[];
  comments: ForumCommentDto[];
  createdAt: string;
  updatedAt: string;
};

export type ForumPostPageDto = {
  items: ForumPostSummaryDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
};

export type VoteResponse = {
  targetUuid: string;
  targetType: string;
  score: number;
  upvoteCount: number;
  downvoteCount: number;
  myVote: ForumVoteType | null;
};

export type SavePostResponse = {
  postUuid: string;
  saved: boolean;
};

export type ForumReportDto = {
  uuid: string;
  targetType: ForumReportTargetType;
  targetUuid: string;
  reporter: ForumAuthorDto;
  reason: string;
  details: string | null;
  status: ForumReportStatus;
  reviewedByKeycloakId: string | null;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type ForumOfficialResourceDto = {
  uuid: string;
  sourceType: ForumOfficialResourceSourceType;
  sourceUuid: string;
  createdBy: ForumAuthorDto;
  learningProgramUuid: string | null;
  learningProgramTitle: string | null;
  skillUuid: string | null;
  skillName: string | null;
  title: string;
  summary: string | null;
  resourceUrl: string | null;
  approved: boolean;
  createdAt: string;
};

export type ForumPostsSort = "new" | "top" | "popular" | "hot";

export type ForumPostsFilters = {
  q?: string;
  categoryUuid?: string;
  type?: ForumPostType;
  tag?: string;
  skillUuid?: string;
  learningProgramUuid?: string;
  sort?: ForumPostsSort;
  page?: number;
  size?: number;
};
