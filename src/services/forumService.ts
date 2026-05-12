import { http } from "../api/http";
import type {
  ForumAttachmentDto,
  ForumCategoryDto,
  ForumCommentDto,
  ForumPostDetailDto,
  ForumPostPageDto,
  ForumPostsFilters,
  ForumPostType,
  ForumVoteType,
  SavePostResponse,
  VoteResponse,
} from "../types/forum";

const BASE = "/api/forum";

export const forumService = {
  getCategories: () => http.get<ForumCategoryDto[]>(`${BASE}/categories`),

  getPosts: (filters: ForumPostsFilters = {}) =>
    http.get<ForumPostPageDto>(`${BASE}/posts`, {
      params: {
        q: filters.q,
        categoryUuid: filters.categoryUuid,
        type: filters.type,
        tag: filters.tag,
        skillUuid: filters.skillUuid,
        learningProgramUuid: filters.learningProgramUuid,
        sort: filters.sort ?? "new",
        page: filters.page ?? 0,
        size: filters.size ?? 20,
      },
    }),

  getPost: (postUuid: string) => http.get<ForumPostDetailDto>(`${BASE}/posts/${postUuid}`),

  createPost: (data: {
    title: string;
    content: string;
    type: ForumPostType;
    categoryUuid: string;
    learningProgramUuid?: string | null;
    skillUuid?: string | null;
    projectUuid?: string | null;
    externalUrl?: string | null;
    tags?: string[];
  }) => http.post<ForumPostDetailDto>(`${BASE}/posts`, data),

  updatePost: (
    postUuid: string,
    data: Partial<{
      title: string;
      content: string;
      type: ForumPostType;
      categoryUuid: string;
      learningProgramUuid: string | null;
      skillUuid: string | null;
      projectUuid: string | null;
      externalUrl: string | null;
      tags: string[];
    }>,
  ) => http.put<ForumPostDetailDto>(`${BASE}/posts/${postUuid}`, data),

  deletePost: (postUuid: string) => http.delete(`${BASE}/posts/${postUuid}`),

  addComment: (postUuid: string, data: { content: string; parentCommentUuid?: string | null }) =>
    http.post<ForumCommentDto>(`${BASE}/posts/${postUuid}/comments`, data),

  updateComment: (commentUuid: string, data: { content: string }) =>
    http.put<ForumCommentDto>(`${BASE}/comments/${commentUuid}`, data),

  deleteComment: (commentUuid: string) => http.delete(`${BASE}/comments/${commentUuid}`),

  votePost: (postUuid: string, voteType: ForumVoteType) =>
    http.post<VoteResponse>(`${BASE}/posts/${postUuid}/vote`, { voteType }),

  voteComment: (commentUuid: string, voteType: ForumVoteType) =>
    http.post<VoteResponse>(`${BASE}/comments/${commentUuid}/vote`, { voteType }),

  toggleSavePost: (postUuid: string) => http.post<SavePostResponse>(`${BASE}/posts/${postUuid}/save`),

  getMyPosts: (page = 0, size = 20) =>
    http.get<ForumPostPageDto>(`${BASE}/posts/my`, { params: { page, size } }),

  getSavedPosts: (page = 0, size = 20) =>
    http.get<ForumPostPageDto>(`${BASE}/posts/saved`, { params: { page, size } }),

  uploadPostAttachment: (postUuid: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return http.post<ForumAttachmentDto>(`${BASE}/posts/${postUuid}/attachments`, fd);
  },

  uploadCommentAttachment: (commentUuid: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return http.post<ForumAttachmentDto>(`${BASE}/comments/${commentUuid}/attachments`, fd);
  },

  acceptAnswer: (postUuid: string, commentUuid: string) =>
    http.post(`${BASE}/posts/${postUuid}/accept-answer/${commentUuid}`),

  moderatePost: (postUuid: string, data: { pinned?: boolean; hidden?: boolean; locked?: boolean }) =>
    http.patch<ForumPostDetailDto>(`${BASE}/admin/posts/${postUuid}/moderation`, {}, { params: data }),
};
