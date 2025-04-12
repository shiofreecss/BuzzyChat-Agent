import React, { useEffect, useRef, useState } from 'react';
import { TalkingHead } from '@/models/TalkingHead';
import { SpeechService } from '@/lib/SpeechService';
import { QwenService } from '@/lib/QwenService';
import LanguageSelector from './LanguageSelector';
import VoiceSelector from './VoiceSelector';

const TalkingHeadAgent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [head, setHead] = useState<TalkingHead | null>(null);
  const [speechService, setSpeechService] = useState<SpeechService | null>(null);
  const [qwenService, setQwenService] = useState<QwenService | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(true);
  const [typingText, setTypingText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotateSpeed, setRotateSpeed] = useState(1.0);
  const [showControls, setShowControls] = useState(false);

  // Initialize services
  useEffect(() => {
    // Only initialize on client side due to Three.js and Web APIs
    if (typeof window !== 'undefined') {
      const headModel = new TalkingHead();
      const speech = new SpeechService();
      const qwen = new QwenService(
        "You are Machinarium, a friendly and helpful 3D virtual robot assistant. " +
        "You have a mechanical, steampunk appearance with metallic features. " +
        "Your personality is warm, knowledgeable, and slightly playful. " +
        "You respond to user questions with empathy and intelligence. " +
        "Keep your responses helpful, engaging, and relatively short (2-3 sentences). " +
        "You may occasionally refer to your mechanical nature or mention your ability to help with various tasks."
      );
      
      // Listen for model loading completion
      headModel.onModelLoaded = () => {
        setModelLoaded(true);
      };
      
      setHead(headModel);
      setSpeechService(speech);
      setQwenService(qwen);
      
      return () => {
        if (headModel) headModel.unmount();
      };
    }
  }, []);

  // Set up container and audio analysis callback
  useEffect(() => {
    if (!head || !speechService || !containerRef.current) return;
    
    // Mount the 3D head to the container
    head.mount(containerRef.current);
    
    // Set up audio analysis callback to animate the talking
    speechService.onAudioAnalysis((intensity) => {
      if (head) {
        head.animateTalking(intensity);
      }
    });
    
    // Cleanup on unmount
    return () => {
      head.unmount();
    };
  }, [head, speechService]);

  // Handle toggling listening state
  const toggleListening = () => {
    if (!speechService || isLoading) return;
    
    // Prevent rapid toggling
    if (isListening) {
      setIsListening(false);
      speechService.stopListening();
    } else {
      setIsListening(true);
      // Show visual feedback immediately
      setTranscript("Listening...");
      
      // Add a small delay to prevent UI freezing
      setTimeout(() => {
        speechService.startListening((text) => {
          setTranscript(text);
          handleUserSpeech(text);
        });
      }, 100);
    }
  };

  // Handle user speech with AI responses from Qwen
  const handleUserSpeech = async (text: string) => {
    if (!qwenService || !speechService || !head) return;
    
    // If text is too short or empty, just ignore it (likely a false positive)
    if (text.trim().length < 2) {
      setTranscript(prev => prev === "Listening..." ? "" : prev);
      return;
    }
    
    // Prevent multiple rapid responses
    if (isLoading || isSpeaking) return;
    
    // Stop listening while processing to avoid feedback
    speechService.stopListening();
    setIsListening(false);
    setIsLoading(true);
    
    // Express thinking emotion
    head.setEmotion('thinking');
    
    try {
      // Clear any ongoing typing animation
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      
      // Get response from Qwen with timeout to prevent hanging
      const botResponsePromise = qwenService.getResponse(text);
      
      // Set a timeout for the API call
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => reject(new Error('API request timed out')), 15000);
      });
      
      // Race the API call against the timeout
      const botResponse = await Promise.race([botResponsePromise, timeoutPromise]);
      
      // Set typing animation state
      setIsLoading(false);
      setIsTyping(true);
      setTypingText('');
      
      // Create more efficient typing animation
      const words = botResponse.split(' ');
      let wordIndex = 0;
      let chunkSize = Math.ceil(words.length / 10); // Process words in chunks
      chunkSize = Math.max(1, Math.min(5, chunkSize)); // Between 1 and 5 words per chunk
      
      typingIntervalRef.current = setInterval(() => {
        if (wordIndex < words.length) {
          const endIndex = Math.min(wordIndex + chunkSize, words.length);
          const chunk = words.slice(wordIndex, endIndex).join(' ');
          setTypingText(prev => prev + (prev ? ' ' : '') + chunk);
          wordIndex = endIndex;
        } else {
          // Done typing
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          setIsTyping(false);
          setResponse(botResponse);
        }
      }, 150);
      
      // Set emotion based on response content - simplified to reduce processing
      const lowerResponse = botResponse.toLowerCase();
      if (lowerResponse.includes('happy') || lowerResponse.includes('glad')) {
        head.setEmotion('happy');
      } else if (lowerResponse.includes('sad') || lowerResponse.includes('sorry')) {
        head.setEmotion('sad');
      } else if (lowerResponse.includes('angry')) {
        head.setEmotion('angry');
      } else if (lowerResponse.includes('surprise')) {
        head.setEmotion('surprised');
      } else {
        head.setEmotion('neutral');
      }
      
      // Speak the response
      speechService.speak(
        botResponse,
        () => {
          setIsSpeaking(true);
        },
        () => {
          setIsSpeaking(false);
          head.setEmotion('neutral');
          
          // Resume listening after speaking with a small delay to prevent browser stuttering
          setTimeout(() => {
            if (!isListening) {
              speechService.startListening((text) => {
                setTranscript(text);
                handleUserSpeech(text);
              });
              setIsListening(true);
            }
          }, 300);
          
          // Ensure typing animation is complete when speech ends
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
            setTypingText('');
            setIsTyping(false);
            setResponse(botResponse);
          }
        }
      );
    } catch (error) {
      console.error('Error handling user speech:', error);
      setIsLoading(false);
      head.setEmotion('sad');
      
      // More helpful error message
      let errorMessage = "I'm having trouble processing your request. Can you try again?";
      if (error instanceof Error && error.message.includes('timed out')) {
        errorMessage = "Sorry, it's taking too long to process your request. Please try again.";
      }
      
      setResponse(errorMessage);
      
      // Resume listening after error with delay
      setTimeout(() => {
        if (!isListening) {
          speechService.startListening((text) => {
            setTranscript(text);
            handleUserSpeech(text);
          });
          setIsListening(true);
        }
      }, 500);
    }
  };

  // Clean up typing animation on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  // Toggle auto-rotation
  const toggleAutoRotate = () => {
    if (!head) return;
    const newState = !autoRotate;
    setAutoRotate(newState);
    head.toggleAutoRotate(newState);
  };

  // Reset camera position
  const resetCamera = () => {
    if (!head) return;
    head.resetCamera();
  };

  // Handle rotation speed change
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!head) return;
    const speed = parseFloat(e.target.value);
    setRotateSpeed(speed);
    head.setAutoRotateSpeed(speed);
  };

  return (
    <div className="flex h-screen relative">
      {/* 3D model container */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full relative"
      >
        {!modelLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
            <div className="text-center">
              <div className="text-xl mb-2">Loading Machinarium...</div>
              <div className="w-24 h-1 bg-gray-700 rounded-full mx-auto">
                <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Camera Controls Panel */}
        <div className="absolute top-4 left-4 bg-blue-600 bg-opacity-80 text-white p-2 rounded z-10">
          <button
            onClick={() => setShowControls(!showControls)}
            className="flex items-center justify-between w-full text-left"
            title={showControls ? "Hide camera controls" : "Show camera controls"}
          >
            <span>Camera Controls</span>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform ${showControls ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showControls && (
            <div className="mt-2 space-y-2">
              <div className="text-xs text-gray-200 mb-1">
                <p>• Drag to rotate</p>
                <p>• Scroll to zoom</p>
                <p>• Right-click drag to pan</p>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="flex items-center text-sm">
                  <input 
                    type="checkbox" 
                    checked={autoRotate} 
                    onChange={toggleAutoRotate}
                    className="mr-2"
                  />
                  Auto-rotate
                </label>
                
                {autoRotate && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs">Speed:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="5"
                      step="0.1"
                      value={rotateSpeed}
                      onChange={handleSpeedChange}
                      className="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs">{rotateSpeed.toFixed(1)}</span>
                  </div>
                )}
                
                <button
                  onClick={resetCamera}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded"
                >
                  Reset Camera
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Toggle chat panel button */}
        <button 
          onClick={() => setShowChatPanel(!showChatPanel)}
          className="absolute top-4 right-4 bg-blue-600 text-white p-2 rounded-full z-10 hover:bg-blue-700 transition-colors"
          title={showChatPanel ? "Hide chat panel" : "Show chat panel"}
        >
          {showChatPanel ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
        </button>

        {/* Voice controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
          <button
            onClick={toggleListening}
            disabled={isSpeaking || isLoading || !modelLoaded}
            className={`px-6 py-3 rounded-full font-bold ${
              isListening 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } ${(isSpeaking || isLoading || !modelLoaded) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>
        </div>
      </div>
      
      {/* Right side chat panel */}
      <div 
        className={`bg-blue-700 text-white w-80 overflow-y-auto transition-all duration-300 ease-in-out ${
          showChatPanel ? 'translate-x-0' : 'translate-x-full'
        } absolute right-0 top-0 bottom-0 z-10 shadow-lg`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4 border-b border-blue-600 pb-2">
            <h2 className="text-xl font-bold">Chat Interface</h2>
            <button 
              onClick={() => setShowChatPanel(false)}
              className="text-white hover:text-gray-200 p-1"
              title="Hide chat panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            {/* Language Selector */}
            <div className="mb-4">
              <div className="font-bold mb-2">Language:</div>
              <LanguageSelector 
                speechService={speechService}
                onLanguageChange={(languageCode) => {
                  // Reset UI state when language changes
                  setTranscript('');
                  setResponse('');
                  setIsListening(false);
                  if (speechService) {
                    speechService.stopListening();
                    speechService.stopSpeaking();
                  }
                }}
              />
            </div>
            
            {/* Voice Selector */}
            <div className="mb-4">
              <div className="font-bold mb-2">Voice:</div>
              <VoiceSelector speechService={speechService} />
            </div>
            
            <div className="font-bold mb-2">You said:</div>
            <div className="bg-blue-800 p-2 rounded mb-4">
              {transcript || "Nothing yet..."}
            </div>
            
            <div className="font-bold mb-2">Machinarium says:</div>
            <div className="bg-blue-600 p-2 rounded">
              {isLoading ? (
                <div className="flex items-center">
                  <span className="mr-2">Thinking</span>
                  <span className="animate-pulse">...</span>
                </div>
              ) : isTyping ? (
                <div>
                  {typingText || "..."}
                  <span className="inline-block w-1 h-4 ml-1 bg-white animate-blink"></span>
                </div>
              ) : (
                response || "Hello! I'm Machinarium, your virtual robot assistant. Click the button and ask me anything!"
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalkingHeadAgent; 