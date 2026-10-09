"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SpeechVoiceOption = {
  id: string;
  name: string;
  voice: SpeechSynthesisVoice | null;
  label: string;
};

export type VoiceBarState =
  | "connecting"
  | "listening"
  | "thinking"
  | "speaking"
  | "muted"
  | "reconnecting"
  | "mic_blocked";

export function useSpeech() {
  const [voices, setVoices] = useState<SpeechVoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("default");
  const [speakingTextId, setSpeakingTextId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Audio level visualizer for mic wave animation
  const [audioLevel, setAudioLevel] = useState<number>(0);

  // Permission & Rec State
  const [micBlocked, setMicBlocked] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Load browser TTS voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      const options: SpeechVoiceOption[] = [
        { id: "default", name: "Default System Voice", voice: null, label: "Calm voice" },
      ];

      available.forEach((v, index) => {
        let label = v.name;
        if (v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("online")) {
          label = `Natural (${v.lang})`;
        } else if (v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("neural")) {
          label = `Clear (${v.lang})`;
        } else {
          label = `${v.name} (${v.lang})`;
        }

        options.push({
          id: `voice_${index}_${v.name}`,
          name: v.name,
          voice: v,
          label,
        });
      });

      setVoices(options);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Text-To-Speech function
  const speakText = useCallback(
    (
      text: string,
      messageId?: string,
      options?: { onStart?: () => void; onEnd?: () => void; onError?: () => void },
    ) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        options?.onError?.();
        return;
      }

      window.speechSynthesis.cancel(); // cancel any previous speech

      const cleanText = text
        .replace(/```[\s\S]*?```/g, " [code block] ") // strip code blocks for pleasant audio
        .replace(/`([^`]+)`/g, "$1")
        .replace(/[*_~#]/g, "")
        .trim();

      if (!cleanText) {
        options?.onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const chosenOption = voices.find((v) => v.id === selectedVoiceId);
      if (chosenOption?.voice) {
        utterance.voice = chosenOption.voice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (messageId) setSpeakingTextId(messageId);
        options?.onStart?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingTextId(null);
        options?.onEnd?.();
      };

      utterance.onerror = (e) => {
        console.error("Speech synthesis error", e);
        setIsSpeaking(false);
        setSpeakingTextId(null);
        options?.onError?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    [selectedVoiceId, voices],
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingTextId(null);
  }, []);

  // Start microphone level visualizer
  const startMicVisualizer = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setMicBlocked(false);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 128); // 0.0 to 1.0
        setAudioLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (err) {
      console.warn("Microphone access denied or error:", err);
      setMicBlocked(true);
    }
  }, []);

  const stopMicVisualizer = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      stopMicVisualizer();
      stopSpeaking();
    };
  }, [stopMicVisualizer, stopSpeaking]);

  return {
    voices,
    selectedVoiceId,
    setSelectedVoiceId,
    isSpeaking,
    speakingTextId,
    speakText,
    stopSpeaking,
    audioLevel,
    micBlocked,
    setMicBlocked,
    startMicVisualizer,
    stopMicVisualizer,
  };
}
