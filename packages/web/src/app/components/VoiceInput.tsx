'use client';

import { useState, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputProps {
  onResult: (text: string) => void;
  className?: string;
}

export default function VoiceInput({ onResult, className }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Try Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      onResult(text);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`p-2 rounded-md transition-all ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-muted hover:bg-muted/80 text-muted-foreground'} ${className || ''}`}
      title={listening ? 'Stop listening' : 'Voice input'}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
