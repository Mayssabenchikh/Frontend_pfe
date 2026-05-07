import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKeycloak } from "@react-keycloak/web";
import { useNavigate, useParams } from "react-router-dom";
import { chatService } from "../../services/chatService";
import { chatSocket } from "../../services/chatSocket";
import type { ChatMessage, PresenceEvent, ProjectConversation, ReadReceipt, TypingEvent } from "../../types/chat";
import { ProjectConversationList } from "../../components/chat/ProjectConversationList";
import { ProjectChatLayout } from "../../components/chat/ProjectChatLayout";
import { ProjectChat } from "../../components/chat/ProjectChat";
import { ChatEmptyState } from "../../components/chat/ChatEmptyState";
import { ChatErrorState } from "../../components/chat/ChatErrorState";

function sortAndDedupe(messages: ChatMessage[]) {
  const byId = new Map(messages.map((m) => [m.messageUuid, m]));
  return [...byId.values()].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

function mergeReadBy(existing: ReadReceipt[], incoming: ReadReceipt) {
  const byReader = new Map(existing.map((receipt) => [receipt.readerKeycloakId, receipt]));
  byReader.set(incoming.readerKeycloakId, incoming);
  return [...byReader.values()].sort((a, b) => +new Date(a.readAt) - +new Date(b.readAt));
}

export default function ProjectChatPage({ scope }: { scope: "manager" | "employee" }) {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();
  const params = useParams();
  const routeProjectUuid = params.projectUuid || null;

  const [projects, setProjects] = useState<ProjectConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectUuid, setSelectedProjectUuid] = useState<string | null>(routeProjectUuid);
  const [query, setQuery] = useState("");
  const [input, setInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingEvent>>({});
  const [presence, setPresence] = useState<Record<string, PresenceEvent>>({});
  const unsubscribeRef = useRef<null | (() => void)>(null);
  const readRequestsRef = useRef<Set<string>>(new Set());
  const socketReadyRef = useRef(false);
  const [socketReady, setSocketReady] = useState(false);

  const userId = keycloak.subject || "";

  const basePath = scope === "manager" ? "/manager/chat" : "/employee/chat";

  const filteredProjects = useMemo(
    () => projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [projects, query],
  );

  const selectedProject = useMemo(
    () => projects.find((p) => p.projectUuid === selectedProjectUuid) ?? null,
    [projects, selectedProjectUuid],
  );

  const updateMessageReadReceipt = useCallback(
    (receipt: ReadReceipt) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.messageUuid === receipt.messageUuid ? { ...message, readBy: mergeReadBy(message.readBy ?? [], receipt) } : message,
        ),
      );

      if (receipt.readerKeycloakId === userId) {
        readRequestsRef.current.delete(receipt.messageUuid);
      }
    },
    [userId],
  );

  const requestMarkRead = useCallback(
    (message: ChatMessage) => {
      if (!socketReadyRef.current) return;
      if (!selectedProjectUuid || message.projectUuid !== selectedProjectUuid) return;
      if (!message.senderKeycloakId || message.senderKeycloakId === userId) return;
      if (message.readBy?.some((receipt) => receipt.readerKeycloakId === userId)) return;
      if (readRequestsRef.current.has(message.messageUuid)) return;

      readRequestsRef.current.add(message.messageUuid);
      chatSocket.markRead(message.projectUuid, message.messageUuid);
    },
    [selectedProjectUuid, userId],
  );

  useEffect(() => {
    setSelectedProjectUuid(routeProjectUuid);
  }, [routeProjectUuid]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    chatService
      .getAccessibleProjectsForChat(scope)
      .then((items) => {
        setProjects(items);
        if (!routeProjectUuid && items[0]) {
          navigate(`${basePath}/${items[0].projectUuid}`, { replace: true });
        }
      })
      .catch((e) => setError(e?.response?.data?.error || "Aucun projet disponible pour le chat."))
      .finally(() => setLoading(false));
  }, [scope, basePath, navigate, routeProjectUuid]);

  useEffect(() => {
    const token = keycloak.token;
    if (!token || !selectedProjectUuid) return;
    const tokenValue = token;
    const projectUuid = selectedProjectUuid;

    let cancelled = false;
    readRequestsRef.current = new Set();
    socketReadyRef.current = false;
    setSocketReady(false);

    async function init() {
      try {
        setLoadingMessages(true);
        setError(null);
        const history = await chatService.getProjectMessages(projectUuid, 0, 30);
        if (!cancelled) setMessages(sortAndDedupe(history));

        await chatSocket.connect(tokenValue);

        unsubscribeRef.current?.();
        unsubscribeRef.current = chatSocket.subscribeToProject(projectUuid, {
          onMessage: (message) => {
            setMessages((prev) => sortAndDedupe([...prev, message]));
            if (message.senderKeycloakId !== userId) {
              requestMarkRead(message);
            }
          },
          onRead: updateMessageReadReceipt,
          onTyping: (event) => {
            setTypingUsers((prev) => {
              const next = { ...prev };
              if (!event.typing || event.userKeycloakId === userId) {
                delete next[event.userKeycloakId];
              } else {
                next[event.userKeycloakId] = event;
              }
              return next;
            });
          },
          onPresence: (event) => setPresence((prev) => ({ ...prev, [event.userKeycloakId]: event })),
          onError: (evt) => setError(evt.error || "Erreur chat"),
        });

        chatSocket.joinProject(projectUuid);
        if (!cancelled) {
          socketReadyRef.current = true;
          setSocketReady(true);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.response?.data?.error || e?.message || "Impossible de charger les messages.");
        }
      } finally {
        if (!cancelled) setLoadingMessages(false);
      }
    }

    init();

    return () => {
      cancelled = true;
      socketReadyRef.current = false;
      setSocketReady(false);
      chatSocket.leaveProject(projectUuid);
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [keycloak.token, requestMarkRead, selectedProjectUuid, updateMessageReadReceipt, userId]);

  useEffect(() => {
    if (!socketReady || !selectedProjectUuid) return;

    messages.forEach((message) => {
      if (message.senderKeycloakId !== userId && !message.readBy.some((receipt) => receipt.readerKeycloakId === userId)) {
        requestMarkRead(message);
      }
    });
  }, [messages, requestMarkRead, selectedProjectUuid, socketReady, userId]);

  const sendTyping = (value: string) => {
    setInput(value);
    if (selectedProjectUuid) {
      chatSocket.sendTyping(selectedProjectUuid, value.trim().length > 0);
    }
  };

  const sendMessage = () => {
    if (!selectedProjectUuid || !input.trim()) return;
    chatSocket.sendMessage(selectedProjectUuid, input.trim());
    setInput("");
    chatSocket.sendTyping(selectedProjectUuid, false);
  };

  const uploadFile = async (file: File) => {
    if (!selectedProjectUuid) return;
    try {
      const upload = await chatService.uploadAttachment(selectedProjectUuid, file);
      chatSocket.sendMessage(selectedProjectUuid, "", upload.attachmentUuid);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Upload fichier échoué");
    }
  };

  if (!keycloak.token) {
    return <ChatErrorState message="Token absent." />;
  }

  if (loading) {
    return <ChatEmptyState message="Connexion au chat en cours..." />;
  }

  if (error && !selectedProject) {
    return <ChatErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 pt-3 md:px-6">
      <h1 className="mb-3 text-xl font-semibold text-slate-900">Chat projets</h1>
      <ProjectChatLayout
        sidebar={
          <ProjectConversationList
            projects={filteredProjects}
            activeProjectUuid={selectedProjectUuid}
            query={query}
            onQueryChange={setQuery}
            onSelect={(projectUuid) => navigate(`${basePath}/${projectUuid}`)}
          />
        }
        content={
          selectedProject ? (
            loadingMessages ? (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Chargement des messages...</div>
            ) : (
              <ProjectChat
                project={selectedProject}
                messages={messages}
                currentUserId={userId}
                typingUsers={Object.values(typingUsers).map((x) => x.userName || "Membre")}
                presence={presence}
                input={input}
                onInput={sendTyping}
                onSend={sendMessage}
                onUpload={uploadFile}
              />
            )
          ) : (
            <div className="flex flex-1 items-center justify-center bg-slate-50">
              <ChatEmptyState message={projects.length ? "Sélectionnez un projet pour ouvrir la conversation." : "Aucun projet disponible pour le chat."} />
            </div>
          )
        }
      />
      {error && selectedProject ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
