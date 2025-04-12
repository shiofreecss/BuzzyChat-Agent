import { DashscopeClient } from './DashscopeClient';
import { ChatMessage } from './types';

export class QwenService {
  private dashscopeClient: DashscopeClient;
  private conversationHistory: ChatMessage[] = [];
  private systemPrompt: string = 'You are a helpful, friendly AI assistant. Answer user questions concisely and accurately.';

  constructor(systemPrompt?: string) {
    this.dashscopeClient = new DashscopeClient();
    
    // Set custom system prompt if provided
    if (systemPrompt) {
      this.systemPrompt = systemPrompt;
    }
    
    // Initialize conversation with system message
    this.resetConversation();
  }

  /**
   * Reset conversation history to just the system prompt
   */
  public resetConversation(): void {
    this.conversationHistory = [
      { role: 'system', content: this.systemPrompt }
    ];
  }

  /**
   * Get customized response from Qwen model for different characters
   */
  public async getResponse(userMessage: string): Promise<string> {
    try {
      // Add user message to conversation
      this.conversationHistory.push({
        role: 'user',
        content: userMessage
      });
      
      // Send the full conversation history to Dashscope
      const response = await this.dashscopeClient.generateResponse(this.conversationHistory);
      
      // Add assistant response to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: response
      });
      
      // Keep conversation history at a reasonable size
      // Remove oldest messages (but keep system prompt)
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = [
          this.conversationHistory[0],
          ...this.conversationHistory.slice(-9)
        ];
      }
      
      return response;
    } catch (error) {
      console.error('Error getting response from Qwen:', error);
      return "I'm having trouble connecting to my brain right now. Please try again in a moment.";
    }
  }
  
  /**
   * Set a new system prompt and reset the conversation
   */
  public setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
    this.resetConversation();
  }
  
  /**
   * Get the current conversation history
   */
  public getConversationHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }
} 