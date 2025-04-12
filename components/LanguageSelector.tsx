import React, { useState, useEffect } from 'react';
import { SpeechService } from '@/lib/SpeechService';

interface LanguageSelectorProps {
  speechService: SpeechService | null;
  onLanguageChange?: (languageCode: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  speechService, 
  onLanguageChange 
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US');
  
  useEffect(() => {
    if (speechService) {
      setSelectedLanguage(speechService.getLanguage());
    }
  }, [speechService]);
  
  if (!speechService) return null;
  
  const supportedLanguages = speechService.getSupportedLanguages();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const languageCode = e.target.value;
    console.log(`Language selected: ${languageCode}`);
    
    // Update local state
    setSelectedLanguage(languageCode);
    
    // Apply language change in speech service
    speechService.setLanguage(languageCode);
    
    // Notify parent component
    if (onLanguageChange) {
      onLanguageChange(languageCode);
    }
    
    // Force a reload of voices after a short delay
    // This helps ensure the voice selector updates with the correct voices
    setTimeout(() => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }, 50);
  };

  return (
    <div className="language-selector">
      <select
        value={selectedLanguage}
        onChange={handleLanguageChange}
        className="bg-gray-700 text-white px-3 py-2 rounded-md text-sm"
      >
        {Object.entries(supportedLanguages).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector; 