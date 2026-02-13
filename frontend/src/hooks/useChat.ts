import { useState, useCallback, useEffect, useRef } from 'react';
import { socket, connectSocket } from '../api/socket';
import {
  fetchSessions,
  createSession,
  deleteSession as apiDeleteSession,
  fetchMessages,
  saveMessage,
  type ChatSession,
} from '../api/chat';
import type { ChatMessage, ToolCall, ThinkingStep } from '../types/chat';

let msgId = 0;
function nextId() {
  return `msg-${++msgId}-${Date.now()}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const currentAssistantId = useRef<string | null>(null);
  const toolCallsRef = useRef<ToolCall[]>([]);
  const thinkingRef = useRef<ThinkingStep[]>([]);
  const sessionIdRef = useRef<number | null>(null);

  // Keep ref in sync
  useEffect(() => {
    sessionIdRef.current = activeSessionId;
  }, [activeSessionId]);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions().then((s) => {
      setSessions(s);
      if (s.length > 0) {
        setActiveSessionId(s[0].id);
      }
    });
  }, []);

  // Load messages when session changes
  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    fetchMessages(activeSessionId).then((saved) => {
      const loaded: ChatMessage[] = saved.map((m) => ({
        id: `db-${m.id}`,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at).getTime(),
        toolCalls: (m.tool_calls as ToolCall[]) || [],
        thinkingSteps: (m.thinking_steps as ThinkingStep[]) || [],
        isStreaming: false,
      }));
      setMessages(loaded);
    });
  }, [activeSessionId]);

  // Socket event handlers
  useEffect(() => {
    connectSocket();

    socket.on('chat:thinking', (data: { text: string }) => {
      thinkingRef.current = [
        ...thinkingRef.current,
        { text: data.text, timestamp: Date.now() },
      ];
      updateAssistantMessage({ thinkingSteps: [...thinkingRef.current] });
    });

    socket.on('chat:tool_start', (data: { tool: string; input: string }) => {
      toolCallsRef.current = [...toolCallsRef.current, { tool: data.tool, input: data.input }];
      updateAssistantMessage({ toolCalls: [...toolCallsRef.current] });
    });

    socket.on('chat:tool_result', (data: { output: string }) => {
      if (toolCallsRef.current.length > 0) {
        const updated = [...toolCallsRef.current];
        updated[updated.length - 1] = { ...updated[updated.length - 1], output: data.output };
        toolCallsRef.current = updated;
        updateAssistantMessage({ toolCalls: [...toolCallsRef.current] });
      }
    });

    socket.on('chat:done', (data: { response: string; toolCalls: ToolCall[] }) => {
      // Capture ref values before they're cleared — React's functional
      // setState runs later during render, refs would be null by then
      const assistantId = currentAssistantId.current;
      const sid = sessionIdRef.current;
      const finalToolCalls = data.toolCalls.length > 0 ? data.toolCalls : toolCallsRef.current;
      const finalThinking = [...thinkingRef.current];


      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: data.response,
                toolCalls: finalToolCalls,
                isStreaming: false,
              }
            : m
        )
      );
      setIsLoading(false);

      // Persist assistant message
      if (sid) {
        saveMessage(sid, 'assistant', data.response, finalToolCalls, finalThinking).catch(
          () => {}
        );
      }

      currentAssistantId.current = null;
      toolCallsRef.current = [];
      thinkingRef.current = [];
    });

    socket.on('chat:error', (data: { error: string }) => {
      const assistantId = currentAssistantId.current;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Error: ${data.error}`, isStreaming: false }
            : m
        )
      );
      setIsLoading(false);
      currentAssistantId.current = null;
    });

    return () => {
      socket.off('chat:thinking');
      socket.off('chat:tool_start');
      socket.off('chat:tool_result');
      socket.off('chat:done');
      socket.off('chat:error');
    };
  }, []);

  function updateAssistantMessage(updates: Partial<ChatMessage>) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === currentAssistantId.current ? { ...m, ...updates } : m
      )
    );
  }

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Auto-create session if none active
      let sid = activeSessionId;
      if (!sid) {
        const session = await createSession();
        sid = session.id;
        setActiveSessionId(sid);
        sessionIdRef.current = sid;
        setSessions((prev) => [session, ...prev]);
      }

      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };

      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        toolCalls: [],
        thinkingSteps: [],
        isStreaming: true,
      };

      currentAssistantId.current = assistantMsg.id;
      toolCallsRef.current = [];
      thinkingRef.current = [];

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      // Persist user message
      saveMessage(sid, 'user', content.trim()).catch(() => {});

      // Ensure socket is connected before emitting
      if (!socket.connected) {
        connectSocket();
        // Wait for connection before emitting
        await new Promise<void>((resolve) => {
          socket.once('connect', resolve);
          setTimeout(resolve, 3000); // fallback timeout
        });
      }

      socket.emit('chat:send', { message: content.trim() });
    },
    [isLoading, activeSessionId]
  );

  const startNewSession = useCallback(async () => {
    const session = await createSession();
    setSessions((prev) => [session, ...prev]);
    setActiveSessionId(session.id);
    setMessages([]);
  }, []);

  const switchSession = useCallback((sessionId: number) => {
    setActiveSessionId(sessionId);
  }, []);

  const deleteSessionById = useCallback(
    async (sessionId: number) => {
      await apiDeleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    },
    [activeSessionId]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setActiveSessionId(null);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    sessions,
    activeSessionId,
    startNewSession,
    switchSession,
    deleteSession: deleteSessionById,
  };
}
