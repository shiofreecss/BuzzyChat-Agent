import React, { useEffect, useState, useCallback, useRef } from 'react';
import { SpeechService } from '@/lib/SpeechService';

interface VoiceSelectorProps {
  speechService: SpeechService | null;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ speechService }) => {
  const [allVoices, setAllVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState<string>('');
  const previousLanguageRef = useRef<string>('');

  // Define loadVoices as a memoized callback
  const loadVoices = useCallback(() => {
    if (!speechService) return;
    
    const availableVoices = speechService.getAllVoices();
    if (availableVoices.length > 0) {
      setAllVoices(availableVoices);
      
      // Get currently selected voice and language
      const current = speechService.getLanguage();
      setCurrentLanguage(current);
      
      // Filter voices for current language
      filterVoicesByLanguage(availableVoices, current);
      
      // Get currently selected voice
      const currentVoice = speechService.getCurrentVoice();
      if (currentVoice) {
        setSelectedVoice(currentVoice.voiceURI);
      }
    }
  }, [speechService]);
  
  // Filter voices by language code
  const filterVoicesByLanguage = useCallback((voices: SpeechSynthesisVoice[], languageCode: string) => {
    // Get language code prefix (e.g., 'en' from 'en-US')
    const langPrefix = languageCode.split('-')[0].toLowerCase();
    
    // Filter voices that match the language prefix
    const matchingVoices = voices.filter(voice => 
      voice.lang.toLowerCase().startsWith(langPrefix)
    );
    
    // If no matching voices found, show all voices
    setFilteredVoices(matchingVoices.length > 0 ? matchingVoices : voices);
  }, []);

  // Check for language changes
  useEffect(() => {
    if (!speechService) return;
    
    // Set up an interval to check for language changes
    const checkLanguageInterval = setInterval(() => {
      const currentLang = speechService.getLanguage();
      if (currentLang !== previousLanguageRef.current) {
        previousLanguageRef.current = currentLang;
        setCurrentLanguage(currentLang);
        
        // Update the filtered voices
        filterVoicesByLanguage(allVoices, currentLang);
        
        // Update selected voice
        const newVoice = speechService.getCurrentVoice();
        if (newVoice) {
          setSelectedVoice(newVoice.voiceURI);
        }
      }
    }, 100);
    
    return () => clearInterval(checkLanguageInterval);
  }, [speechService, allVoices, filterVoicesByLanguage]);

  // Update filtered voices when language changes explicitly
  useEffect(() => {
    if (!speechService || allVoices.length === 0 || !currentLanguage) return;
    
    filterVoicesByLanguage(allVoices, currentLanguage);
    
    // Update selected voice
    const newVoice = speechService.getCurrentVoice();
    if (newVoice) {
      setSelectedVoice(newVoice.voiceURI);
    }
  }, [speechService, allVoices, currentLanguage, filterVoicesByLanguage]);

  // Force a refresh if voices haven't loaded after a short delay
  useEffect(() => {
    if (!speechService) return;
    
    if (allVoices.length === 0 && attemptCount < 5) {
      const timer = setTimeout(() => {
        setAttemptCount(prev => prev + 1);
        // Force synth to refresh voices
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          loadVoices();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [allVoices.length, attemptCount, speechService, loadVoices]);

  // Main voice loading effect
  useEffect(() => {
    if (!speechService) return;
    
    // Load voices immediately (in case they're already available)
    loadVoices();
    
    // Set up listener for voice changes
    const voicesChangedHandler = () => {
      loadVoices();
    };
    
    window.speechSynthesis.onvoiceschanged = voicesChangedHandler;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [speechService, loadVoices]);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceURI = e.target.value;
    setSelectedVoice(voiceURI);
    if (speechService) {
      speechService.setVoice(voiceURI);
    }
  };

  if (!speechService || allVoices.length === 0) {
    return (
      <div className="text-sm text-gray-300">
        Loading voices...
        {attemptCount > 0 && attemptCount < 5 && (
          <span className="ml-1">Attempt {attemptCount}/5</span>
        )}
      </div>
    );
  }

  return (
    <div className="voice-selector">
      <select
        value={selectedVoice || ''}
        onChange={handleVoiceChange}
        className="bg-gray-700 text-white px-3 py-2 rounded-md text-sm w-full"
      >
        {filteredVoices.map((voice) => (
          <option key={voice.voiceURI} value={voice.voiceURI}>
            {voice.name} ({voice.lang})
          </option>
        ))}
      </select>
    </div>
  );
};

export default VoiceSelector; 