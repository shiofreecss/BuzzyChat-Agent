import React, { useEffect, useRef, useState } from 'react';
import { ExplorerBeaver } from '@/models/ExplorerBeaver';
import { SpeechService } from '@/lib/SpeechService';
import { QwenService } from '@/lib/QwenService';
import LanguageSelector from './LanguageSelector';
import VoiceSelector from './VoiceSelector';

const ExplorerBeaverAgent: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [explorer, setExplorer] = useState<ExplorerBeaver | null>(null);
  const [speechService, setSpeechService] = useState<SpeechService | null>(null);
  const [qwenService, setQwenService] = useState<QwenService | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotateSpeed, setRotateSpeed] = useState(1.0);
  const [showControls, setShowControls] = useState(false);

  // Initialize services
  useEffect(() => {
    // Only initialize on client side due to Three.js and Web APIs
    if (typeof window !== 'undefined') {
      const explorerModel = new ExplorerBeaver();
      const speech = new SpeechService();
      const qwen = new QwenService(
        "You are Explorer Buzzy, a safari beaver explorer with a tan safari hat, sunglasses, a white explorer coat, and binoculars. " +
        "You love wilderness exploration, documenting wildlife, and building dams. " +
        "You speak enthusiastically about your adventures, safaris, and expeditions. " +
        "You refer to your safari hat, sunglasses, binoculars, and expedition coat with pride. " +
        "You are knowledgeable about dam construction techniques. " +
        "Keep your responses friendly, engaging, and relatively short (2-3 sentences). " +
        "Always stay in character as Explorer Buzzy the beaver."
      );
      
      setExplorer(explorerModel);
      setSpeechService(speech);
      setQwenService(qwen);
      
      return () => {
        if (explorerModel) explorerModel.unmount();
      };
    }
  }, []);

  // Set up container and audio analysis callback
  useEffect(() => {
    if (!explorer || !speechService || !containerRef.current) return;
    
    // Mount the 3D explorer beaver to the container
    explorer.mount(containerRef.current);
    
    // Set up audio analysis callback to animate the talking
    speechService.onAudioAnalysis((intensity) => {
      if (explorer) {
        explorer.animateTalking(intensity);
      }
    });
    
    // Cleanup on unmount
    return () => {
      explorer.unmount();
    };
  }, [explorer, speechService]);

  // Handle toggling listening state
  const toggleListening = () => {
    if (!speechService) return;
    
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      speechService.startListening((text) => {
        setTranscript(text);
        handleUserSpeech(text);
      });
      setIsListening(true);
    }
  };

  // Handle user speech with Explorer Beaver-specific responses from Qwen
  const handleUserSpeech = async (text: string) => {
    if (!qwenService || !speechService) return;
    
    // Stop listening while processing to avoid feedback
    speechService.stopListening();
    setIsListening(false);
    setIsLoading(true);
    
    try {
      // Get response from Qwen
      const botResponse = await qwenService.getResponse(text);
      
      // Set the response
      setResponse(botResponse);
      setIsLoading(false);
      
      // Speak the response
      speechService.speak(
        botResponse,
        () => setIsSpeaking(true),
        () => {
          setIsSpeaking(false);
          // Resume listening after speaking
          speechService.startListening((text) => {
            setTranscript(text);
            handleUserSpeech(text);
          });
          setIsListening(true);
        }
      );
    } catch (error) {
      console.error('Error handling user speech:', error);
      setIsLoading(false);
      setResponse("I'm having trouble with my explorer radio right now. Can you try again?");
      
      // Resume listening
      speechService.startListening((text) => {
        setTranscript(text);
        handleUserSpeech(text);
      });
      setIsListening(true);
    }
  };

  // Toggle auto-rotation
  const toggleAutoRotate = () => {
    if (!explorer) return;
    const newState = !autoRotate;
    setAutoRotate(newState);
    explorer.toggleAutoRotate(newState);
  };

  // Reset camera position
  const resetCamera = () => {
    if (!explorer) return;
    explorer.resetCamera();
  };

  // Handle rotation speed change
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!explorer) return;
    const speed = parseFloat(e.target.value);
    setRotateSpeed(speed);
    explorer.setAutoRotateSpeed(speed);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* 3D explorer beaver container */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full relative"
      >
        {/* Camera Controls Panel */}
        <div className="absolute top-4 left-4 bg-teal-700 bg-opacity-80 text-white p-2 rounded z-10">
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
                      className="w-full h-1 bg-teal-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs">{rotateSpeed.toFixed(1)}</span>
                  </div>
                )}
                
                <button
                  onClick={resetCamera}
                  className="bg-teal-600 hover:bg-teal-800 text-white text-xs py-1 px-2 rounded"
                >
                  Reset Camera
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Chat interface */}
      <div className="bg-teal-700 text-white p-4">
        <div className="mb-4">
          {/* Language Selector */}
          <div className="mb-4 flex justify-end">
            <div className="flex items-center">
              <span className="mr-2 font-bold">Language:</span>
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
          </div>
          
          {/* Voice Selector */}
          <div className="mb-4">
            <div className="font-bold mb-2">Voice:</div>
            <VoiceSelector speechService={speechService} />
          </div>
          
          <div className="font-bold mb-2">You said:</div>
          <div className="bg-teal-800 p-2 rounded mb-2">
            {transcript || "Nothing yet..."}
          </div>
          
          <div className="font-bold mb-2">Explorer Buzzy says:</div>
          <div className="bg-teal-600 p-2 rounded">
            {isLoading ? (
              <div className="flex items-center">
                <span className="mr-2">Thinking</span>
                <span className="animate-pulse">...</span>
              </div>
            ) : (
              response || "Hello, explorer! I'm Buzzy, the adventurous safari beaver! Click the button and talk to me about my expeditions!"
            )}
          </div>
        </div>
        
        <div className="flex justify-center space-x-4">
          <button
            onClick={toggleListening}
            disabled={isSpeaking || isLoading}
            className={`px-6 py-3 rounded-full font-bold ${
              isListening 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } ${(isSpeaking || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplorerBeaverAgent; 