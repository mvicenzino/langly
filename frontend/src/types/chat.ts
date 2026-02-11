export interface ToolCall {
  tool: string;
  input: string;
  output?: string;
}

export interface ThinkingStep {
  text: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  thinkingSteps?: ThinkingStep[];
  isStreaming?: boolean;
}
