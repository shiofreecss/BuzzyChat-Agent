import { ChatRequest, ChatResponse, ChatMessage } from './types';

export class DashscopeClient {
  private apiKey: string;
  private baseUrl = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
  private model = 'qwen-max';

  constructor() {
    // Get API key from environment variable
    this.apiKey = process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY || '';
    
    if (!this.apiKey) {
      console.error('NEXT_PUBLIC_DASHSCOPE_API_KEY is not set');
    }
  }

  /**
   * Generate a response from the Qwen model using Dashscope API (OpenAI-compatible endpoint)
   */
  public async generateResponse(messages: ChatMessage[]): Promise<string> {
    if (!this.apiKey) {
      return "Error: API key not configured. Please set the NEXT_PUBLIC_DASHSCOPE_API_KEY environment variable.";
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dashscope API error:', errorText);
        return `Error: Failed to generate response (HTTP ${response.status})`;
      }

      const data = await response.json();
      return data.choices[0].message.content || "Sorry, I couldn't generate a response.";
    } catch (error) {
      console.error('Error calling Dashscope API:', error);
      return "Error: Failed to communicate with the Dashscope API. Please try again later.";
    }
  }
} 