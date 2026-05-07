import { employeeProjectsApi, projectsApi, type ProjectPage } from "../api/projectsApi";
import { http } from "../api/http";
import type { ChatMessage, ProjectConversation, UploadAttachmentResponse } from "../types/chat";

function mapProjectPage(page: ProjectPage): ProjectConversation[] {
  return page.content.map((p) => ({
    projectUuid: p.uuid,
    name: p.name,
    status: p.status ?? null,
    priority: p.priority ?? null,
  }));
}

export const chatService = {
  async getProjectMessages(projectUuid: string, page = 0, size = 30): Promise<ChatMessage[]> {
    const res = await http.get<{ content: ChatMessage[] } | ChatMessage[]>(`/api/projects/${projectUuid}/chat/messages`, {
      params: { page, size },
    });

    const payload = Array.isArray(res.data) ? res.data : res.data.content;
    return [...payload].reverse();
  },

  async uploadAttachment(projectUuid: string, file: File): Promise<UploadAttachmentResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await http.post<UploadAttachmentResponse>(`/api/projects/${projectUuid}/chat/attachments`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async markMessageRead(projectUuid: string, messageUuid: string) {
    const res = await http.post(`/api/projects/${projectUuid}/chat/messages/${messageUuid}/read`);
    return res.data;
  },

  async getAccessibleProjectsForChat(scope: "manager" | "employee"): Promise<ProjectConversation[]> {
    if (scope === "employee") {
      const res = await employeeProjectsApi.list({ page: 0, size: 100 });
      return mapProjectPage(res.data);
    }

    const res = await projectsApi.list({ page: 0, size: 100 });
    return mapProjectPage(res.data);
  },
};
