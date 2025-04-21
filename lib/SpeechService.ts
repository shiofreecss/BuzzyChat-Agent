/// <reference path="./global.d.ts" />

export class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private onSpeechDetectedCallback: ((text: string) => void) | null = null;
  private onAudioAnalysisCallback: ((intensity: number) => void) | null = null;
  private currentLanguage: string = 'en-US';
  private currentVoice: SpeechSynthesisVoice | null = null;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private _skipFrame = false; // Used for reducing CPU load in audio analysis

  // Supported languages mapping
  private supportedLanguages = {
    'en-US': 'English (United States)',
    'en-GB': 'English (United Kingdom)',
    'de-DE': 'Deutsch (Germany)',
    'es-ES': 'Español (Spain)',
    'es-US': 'Español (Estados Unidos)',
    'fr-FR': 'Français (France)',
    'hi-IN': 'हिन्दी (India)',
    'id-ID': 'Bahasa Indonesia (Indonesia)',
    'it-IT': 'Italiano (Italy)',
    'ja-JP': '日本語 (Japan)',
    'ko-KR': '한국어 (Korea)',
    'nl-NL': 'Nederlands (Netherlands)',
    'pl-PL': 'Polski (Poland)',
    'pt-BR': 'Português (Brasil)',
    'ru-RU': 'Русский (Russia)',
    'zh-CN': '普通话 (China)'
  };

  constructor() {
    // Initialize speech synthesis
    this.synthesis = window.speechSynthesis;
    
    // Check for browser support
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return;
    }
    
    // Initialize speech recognition
    const SpeechRecognitionAPI = 
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognitionAPI();
    
    if (this.recognition) {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = this.currentLanguage;
      
      // Set up speech recognition event handlers
      this.recognition.onresult = this.handleSpeechResult;
      this.recognition.onerror = (event: Event) => {
        const errorEvent = event as SpeechRecognitionErrorEvent;
        console.error('Speech recognition error:', errorEvent.error);
      };
    }
    
    // Set up audio analysis for animation
    this.setupAudioAnalysis();
    
    // Load available voices
    this.loadVoices();
    // Listen for voices changed event (voices may load asynchronously)
    if (typeof window !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = this.loadVoices;
    }
  }

  // Load available voices and select appropriate one for current language
  private loadVoices = (): void => {
    if (!this.synthesis) return;
    
    // Get all available voices
    const voices = this.synthesis.getVoices();
    this.availableVoices = voices;
    
    console.log(`Loaded ${voices.length} voices`);
    
    // Log available voices for debugging
    voices.forEach(voice => {
      console.log(`Available voice: ${voice.name}, Lang: ${voice.lang}, URI: ${voice.voiceURI}`);
    });
    
    // Try to find a voice for the current language
    this.selectVoiceForLanguage(this.currentLanguage);
  };

  // Select an appropriate voice for the given language
  private selectVoiceForLanguage(languageCode: string): void {
    if (!this.availableVoices.length) {
      console.log('No available voices to select from');
      return;
    }
    
    console.log(`Selecting voice for language: ${languageCode}`);
    
    // First try: exact match for language code
    let voice = this.availableVoices.find(v => v.lang.toLowerCase() === languageCode.toLowerCase());
    
    // Second try: match language prefix (e.g., 'en' for 'en-US')
    if (!voice) {
      const langPrefix = languageCode.split('-')[0].toLowerCase();
      voice = this.availableVoices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
      
      // For specific languages, try alternative ways to find voices
      if (!voice) {
        const languageNameMap: Record<string, string[]> = {
          'de': ['german', 'deutsch'],
          'es': ['spanish', 'español', 'espanol'],
          'fr': ['french', 'français', 'francais'],
          'hi': ['hindi', 'हिन्दी'],
          'id': ['indonesian', 'bahasa'],
          'it': ['italian', 'italiano'],
          'ja': ['japanese', '日本語'],
          'ko': ['korean', '한국어'],
          'nl': ['dutch', 'nederlands'],
          'pl': ['polish', 'polski'],
          'pt': ['portuguese', 'português', 'portugues'],
          'ru': ['russian', 'русский'],
          'zh': ['chinese', '中文', '普通话', '普通話']
        };
        
        const matchTerms = languageNameMap[langPrefix] || [];
        if (matchTerms.length > 0) {
          voice = this.availableVoices.find(v => 
            matchTerms.some(term => 
              v.name.toLowerCase().includes(term.toLowerCase()) || 
              v.voiceURI.toLowerCase().includes(term.toLowerCase())
            )
          );
        }
      }
    }
    
    // If we found a voice, use it
    if (voice) {
      this.currentVoice = voice;
      console.log(`Selected voice: ${voice.name} (${voice.lang})`);
    } else if (this.availableVoices.length > 0) {
      // If no matching voice, fallback to first available voice
      this.currentVoice = this.availableVoices[0];
      console.log(`No voice found for ${languageCode}, using ${this.currentVoice.name} as fallback`);
    }
  }

  // Public method to set the current language
  public setLanguage(languageCode: string): void {
    if (!Object.keys(this.supportedLanguages).includes(languageCode)) {
      console.error(`Language ${languageCode} is not supported`);
      return;
    }
    
    console.log(`Changing language from ${this.currentLanguage} to ${languageCode}`);
    this.currentLanguage = languageCode;
    
    // Update recognition language
    if (this.recognition) {
      this.recognition.lang = languageCode;
    }
    
    // Select appropriate voice
    this.selectVoiceForLanguage(languageCode);
    
    // Force speech synthesis to refresh voices
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    
    console.log(`Language set to ${languageCode}`);
  }

  // Get the current language
  public getLanguage(): string {
    return this.currentLanguage;
  }

  // Get all supported languages
  public getSupportedLanguages(): Record<string, string> {
    return this.supportedLanguages;
  }

  // Get available voices for the current language
  public getVoicesForCurrentLanguage(): SpeechSynthesisVoice[] {
    if (!this.availableVoices.length) return [];
    
    const languagePrefix = this.currentLanguage.split('-')[0];
    return this.availableVoices.filter(voice => 
      voice.lang.startsWith(languagePrefix)
    );
  }

  // Get all available voices
  public getAllVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices;
  }

  // Get current voice
  public getCurrentVoice(): SpeechSynthesisVoice | null {
    return this.currentVoice;
  }

  // Set specific voice by URI
  public setVoice(voiceURI: string): void {
    const voice = this.availableVoices.find(v => v.voiceURI === voiceURI);
    if (voice) {
      this.currentVoice = voice;
      console.log(`Voice set to ${voice.name}`);
    }
  }

  private setupAudioAnalysis(): void {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      if (this.audioContext) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 128;
        const bufferLength = this.analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(bufferLength);
      }
    } catch (error) {
      console.error('Audio analysis setup failed:', error);
    }
  }

  private handleSpeechResult = (event: Event): void => {
    const recognitionEvent = event as SpeechRecognitionEvent;
    const transcript = this.getLatestTranscript(recognitionEvent);
    
    // Only process meaningful transcripts
    if (transcript && transcript.trim().length > 0) {
      const isFinal = this.isFinalResult(recognitionEvent);
      
      if (isFinal && this.onSpeechDetectedCallback) {
        console.log('Final transcript:', transcript);
        this.onSpeechDetectedCallback(transcript);
      }
    }
  };

  public startListening(onSpeechDetected: (text: string) => void): void {
    if (!this.recognition) {
      console.error('Speech recognition not available');
      return;
    }
    
    // Clear any previous session
    try {
      this.recognition.abort();
    } catch (e) {
      // Ignore errors when aborting
    }
    
    // Reset state
    this.onSpeechDetectedCallback = onSpeechDetected;
    this.isListening = true;
    
    // Use a small delay to prevent browser from freezing during recognition start
    setTimeout(() => {
      try {
        this.recognition?.start();
        console.log('Speech recognition started');
        
        // Also start audio analysis for animation with a small delay to prevent overlapping operations
        setTimeout(() => {
          this.startAudioAnalysis();
        }, 100);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        // Try to recover
        this.isListening = false;
        setTimeout(() => this.startListening(onSpeechDetected), 1000);
      }
    }, 50);
  }

  public stopListening(): void {
    if (!this.recognition || !this.isListening) return;
    
    this.isListening = false;
    
    try {
      // Use stop instead of abort to process any pending recognition
      this.recognition.stop();
      console.log('Speech recognition stopped');
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
    }
    
    // Stop audio analysis with a delay to ensure clean shutdown
    setTimeout(() => {
      this.stopAudioAnalysis();
    }, 100);
  }

  public speak(text: string, onStart?: () => void, onEnd?: () => void): void {
    if (!this.synthesis) {
      console.error('Speech synthesis not available');
      return;
    }
    
    // Cancel any ongoing speech
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Set the language and voice if available
    utterance.lang = this.currentLanguage;
    if (this.currentVoice) {
      utterance.voice = this.currentVoice;
    }
    
    utterance.onstart = () => {
      console.log('Speech started');
      this.isSpeaking = true;
      if (onStart) onStart();
      
      // Start audio analysis for animation during speech
      this.startSpeechAnalysis(utterance);
    };
    
    utterance.onend = () => {
      console.log('Speech ended');
      this.isSpeaking = false;
      if (onEnd) onEnd();
    };
    
    this.synthesis.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      console.log('Speech stopped');
    }
  }

  private startAudioAnalysis(): void {
    if (!this.audioContext || !this.analyser) return;
    
    try {
      // Create a media stream source from mic input
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          const context = this.audioContext;
          const analyser = this.analyser;
          
          if (context && analyser) {
            // Create source from microphone stream
            const source = context.createMediaStreamSource(stream);
            // Connect to analyzer
            source.connect(analyser);
            
            // Start analyzing audio
            this.analyseAudio();
            console.log('Audio analysis started');
          }
        })
        .catch(err => {
          console.error('Failed to get microphone access:', err);
        });
    } catch (error) {
      console.error('Error starting audio analysis:', error);
    }
  }

  private startSpeechAnalysis(utterance: SpeechSynthesisUtterance): void {
    // For speech synthesis, we'll use a simulated analysis since
    // we can't directly analyze the audio output from the synthesis
    const analysisFn = () => {
      if (this.synthesis.speaking && this.onAudioAnalysisCallback) {
        // Simulate intensity based on a sine wave - reduced frequency of updates
        const intensity = 0.3 + Math.sin(Date.now() * 0.005) * 0.3; // Changed from 0.01 to 0.005
        this.onAudioAnalysisCallback(intensity);
        // Use setTimeout instead of requestAnimationFrame to reduce frame rate
        setTimeout(analysisFn, 50); // 20fps instead of 60fps
      }
    };
    
    analysisFn();
  }

  private analyseAudio = (): void => {
    if (!this.analyser || !this.dataArray) return;
    
    // Skip more frames to reduce CPU load - analyze every 3rd frame instead of every other
    if (this._skipFrame) {
      this._skipFrame = false;
      setTimeout(() => this.analyseAudio(), 50); // Use 20fps instead of 60fps
      return;
    }
    this._skipFrame = true;
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate average intensity with larger stride to process fewer samples
    let sum = 0;
    const stride = 8; // Changed from 4 to 8 - analyze fewer data points
    for (let i = 0; i < this.dataArray.length; i += stride) {
      sum += this.dataArray[i];
    }
    const sampleCount = Math.ceil(this.dataArray.length / stride);
    const averageIntensity = sum / (sampleCount * 255);
    
    if (this.onAudioAnalysisCallback) {
      this.onAudioAnalysisCallback(averageIntensity);
    }
    
    // Continue the analysis loop only if we're listening or speaking
    if (this.isListening || this.isSpeaking) {
      setTimeout(() => this.analyseAudio(), 50); // Lower framerate for performance
    }
  };

  private stopAudioAnalysis(): void {
    // Nothing to do here, animation frame will stop looping
    // when isListening is false
  }

  public onAudioAnalysis(callback: (intensity: number) => void): void {
    this.onAudioAnalysisCallback = callback;
  }

  // Helper to extract the latest transcript
  private getLatestTranscript(event: SpeechRecognitionEvent): string {
    if (!event.results || event.results.length === 0) return '';
    
    // Get the last result which is the most recent speech
    const lastResult = event.results[event.results.length - 1];
    if (!lastResult || lastResult.length === 0) return '';
    
    return lastResult[0].transcript;
  }
  
  // Helper to check if a result is final
  private isFinalResult(event: SpeechRecognitionEvent): boolean {
    if (!event.results || event.results.length === 0) return false;
    
    const lastResult = event.results[event.results.length - 1];
    return lastResult.isFinal;
  }
} 