import { useState, useCallback, useEffect, useRef } from 'react';
import { socket, connectSocket } from '../api/socket';

interface ToolCall {
  tool: string;
  input: string;
  output?: string;
}

interface ThinkingStep {
  text: string;
  timestamp: number;
}

interface TravelInsightsState {
  content: string;
  isLoading: boolean;
  error: string | null;
  toolCalls: ToolCall[];
  thinkingSteps: ThinkingStep[];
}

export interface TravelInsightsRequest {
  destination: string;
  startDate: string;
  endDate: string;
  passengers: number;
  originAirport: string;
  destinationAirport: string;
  flights: unknown[];
  hotels: unknown[];
}

export function useTravelInsights() {
  const [state, setState] = useState<TravelInsightsState>({
    content: '',
    isLoading: false,
    error: null,
    toolCalls: [],
    thinkingSteps: [],
  });

  const toolCallsRef = useRef<ToolCall[]>([]);
  const thinkingRef = useRef<ThinkingStep[]>([]);

  useEffect(() => {
    connectSocket();

    socket.on('travel:thinking', (data: { text: string }) => {
      thinkingRef.current = [...thinkingRef.current, { text: data.text, timestamp: Date.now() }];
      setState((s) => ({ ...s, thinkingSteps: [...thinkingRef.current] }));
    });

    socket.on('travel:tool_start', (data: { tool: string; input: string }) => {
      toolCallsRef.current = [...toolCallsRef.current, { tool: data.tool, input: data.input }];
      setState((s) => ({ ...s, toolCalls: [...toolCallsRef.current] }));
    });

    socket.on('travel:tool_result', (data: { output: string }) => {
      if (toolCallsRef.current.length > 0) {
        const updated = [...toolCallsRef.current];
        updated[updated.length - 1] = { ...updated[updated.length - 1], output: data.output };
        toolCallsRef.current = updated;
        setState((s) => ({ ...s, toolCalls: [...toolCallsRef.current] }));
      }
    });

    socket.on('travel:done', (data: { response: string; toolCalls: ToolCall[] }) => {
      setState((s) => ({
        ...s,
        content: data.response,
        isLoading: false,
        toolCalls: data.toolCalls.length > 0 ? data.toolCalls : toolCallsRef.current,
      }));
      toolCallsRef.current = [];
      thinkingRef.current = [];
    });

    socket.on('travel:error', (data: { error: string }) => {
      setState((s) => ({ ...s, error: data.error, isLoading: false }));
    });

    return () => {
      socket.off('travel:thinking');
      socket.off('travel:tool_start');
      socket.off('travel:tool_result');
      socket.off('travel:done');
      socket.off('travel:error');
    };
  }, []);

  const requestInsights = useCallback((data: TravelInsightsRequest) => {
    setState({
      content: '',
      isLoading: true,
      error: null,
      toolCalls: [],
      thinkingSteps: [],
    });
    toolCallsRef.current = [];
    thinkingRef.current = [];

    if (!socket.connected) {
      connectSocket();
    }
    socket.emit('travel:insights', data);
  }, []);

  const clear = useCallback(() => {
    setState({
      content: '',
      isLoading: false,
      error: null,
      toolCalls: [],
      thinkingSteps: [],
    });
  }, []);

  return { ...state, requestInsights, clear };
}
