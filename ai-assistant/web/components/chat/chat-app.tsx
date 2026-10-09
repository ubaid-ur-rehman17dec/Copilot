"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PanelLeftIcon, SquarePenIcon, MicIcon } from "lucide-react";
import { toast } from "sonner";

import { AppSidebar } from "@/components/chat/app-sidebar";
import { Composer } from "@/components/chat/composer";
import { EmptyState, SuggestionGrid } from "@/components/chat/empty-state";
import { MessageList } from "@/components/chat/message-list";
import { ModelPicker } from "@/components/chat/model-picker";
import { VoiceBar } from "@/components/chat/voice-bar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useChat } from "@/hooks/use-chat";
import { useModels } from "@/hooks/use-models";
import { useSpeech, type VoiceBarState } from "@/hooks/use-speech";
import { cn } from "@/lib/utils";

export function ChatApp() {
  const models = useModels();
  const [sidebarOpen, setSidebarOpen] = useState(true); // desktop
  const [mobileOpen, setMobileOpen] = useState(false); // mobile sheet

  // Speech & Audio Hook
  const speech = useSpeech();

  // Voice Session State
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceBarState>("connecting");
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");

  const recognitionRef = useRef<any>(null);
  const activeVoiceModeRef = useRef(false);
  const speechRef = useRef(speech);

  useEffect(() => {
    speechRef.current = speech;
  }, [speech]);

  // Handle when LLM response finishes in voice mode -> Auto play TTS
  const handleFinishStream = useCallback(() => {
    if (!activeVoiceModeRef.current) return;

    // Get the latest assistant message
    setVoiceState("speaking");
    const activeConv = document.querySelector('[role="log"]');
    if (activeConv) {
      // Find the last assistant response content
    }
  }, []);

  const chat = useChat(models.selection, handleFinishStream);

  const empty = !chat.active || chat.active.messages.length === 0;
  const noModels = !models.loading && !models.effective;

  // Voice Session Timer
  useEffect(() => {
    if (!voiceModeActive) {
      setVoiceSeconds(0);
      return;
    }
    const timer = setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [voiceModeActive]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Auto-speak new assistant messages when stream ends in voice mode
  useEffect(() => {
    if (!voiceModeActive || chat.streaming) return;

    const msgs = chat.active?.messages;
    if (!msgs || msgs.length === 0) return;

    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg && lastMsg.role === "assistant" && !lastMsg.pending && lastMsg.content) {
      const text = typeof lastMsg.content === "string" ? lastMsg.content : "";
      if (text && voiceState === "thinking") {
        setVoiceState("speaking");
        speechRef.current.speakText(text, lastMsg.id, {
          onEnd: () => {
            if (activeVoiceModeRef.current) {
              setVoiceState("listening");
              startSpeechRecognition();
            }
          },
          onError: () => {
            if (activeVoiceModeRef.current) {
              setVoiceState("listening");
              startSpeechRecognition();
            }
          },
        });
      }
    }
  }, [chat.active?.messages, chat.streaming, voiceModeActive, voiceState]);

  // Speech Recognition for Voice Mode
  const startSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech Recognition is not supported in your browser.");
      setVoiceState("mic_blocked");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setVoiceState("listening");
        speechRef.current.startMicVisualizer();
      };

      rec.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          interim += event.results[i][0].transcript;
        }
        setLiveTranscript(interim);
      };

      rec.onerror = (event: any) => {
        console.warn("Speech rec error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setVoiceState("mic_blocked");
        }
      };

      rec.onend = () => {
        // Restart if active & not thinking/speaking
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error(e);
      setVoiceState("mic_blocked");
    }
  }, []);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    speech.stopMicVisualizer();
  }, [speech]);

  const startVoiceMode = useCallback(() => {
    setVoiceModeActive(true);
    activeVoiceModeRef.current = true;
    setVoiceState("connecting");
    setLiveTranscript("");
    setIsMuted(false);

    setTimeout(() => {
      if (activeVoiceModeRef.current) {
        setVoiceState("listening");
        startSpeechRecognition();
      }
    }, 800);
  }, [startSpeechRecognition]);

  const endVoiceMode = useCallback(() => {
    setVoiceModeActive(false);
    activeVoiceModeRef.current = false;
    stopSpeechRecognition();
    speech.stopSpeaking();
    setLiveTranscript("");
  }, [speech, stopSpeechRecognition]);

  const handleSendNow = useCallback(() => {
    if (!liveTranscript.trim()) return;
    const textToSend = liveTranscript;
    setLiveTranscript("");
    stopSpeechRecognition();
    speech.stopSpeaking();

    setVoiceState("thinking");
    chat.send(textToSend, [], { isSpoken: true });
  }, [chat, liveTranscript, speech, stopSpeechRecognition]);

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      setVoiceState("listening");
      startSpeechRecognition();
    } else {
      setIsMuted(true);
      setVoiceState("muted");
      stopSpeechRecognition();
    }
  }, [isMuted, startSpeechRecognition, stopSpeechRecognition]);

  const newChat = useCallback(() => {
    endVoiceMode();
    chat.newChat();
    setMobileOpen(false);
  }, [chat, endVoiceMode]);

  const openChat = (id: string) => {
    endVoiceMode();
    chat.openChat(id);
    setMobileOpen(false);
  };

  const deleteChat = (id: string) => {
    const undo = chat.deleteChat(id);
    toast("Chat deleted", { action: { label: "Undo", onClick: undo } });
  };

  const clearAll = () => {
    const undo = chat.clearAll();
    toast("All chats deleted", { action: { label: "Undo", onClick: undo } });
  };

  // Global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        newChat();
      } else if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSidebarOpen(true);
        setMobileOpen(true);
        requestAnimationFrame(() => document.getElementById("chat-search")?.focus());
      } else if (e.key === "Escape") {
        if (voiceModeActive) {
          endVoiceMode();
        } else if (chat.streaming) {
          chat.stop();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chat, endVoiceMode, newChat, voiceModeActive]);

  const sidebarProps = {
    conversations: chat.conversations,
    activeId: chat.activeId,
    onNewChat: newChat,
    onOpen: openChat,
    onDelete: deleteChat,
    onClearAll: clearAll,
    apiOnline: !models.error,
  };

  const composer = (
    <Composer
      onSend={(text, attachments, options) => chat.send(text, attachments, options)}
      onStop={chat.stop}
      streaming={chat.streaming}
      disabled={noModels}
      autoFocus
      placeholder={noModels ? "No AI model available — see the model menu" : undefined}
      onStartVoiceMode={startVoiceMode}
    />
  );

  const voiceBar = (
    <VoiceBar
      state={voiceState}
      audioLevel={speech.audioLevel}
      voices={speech.voices}
      selectedVoiceId={speech.selectedVoiceId}
      onSelectVoice={speech.setSelectedVoiceId}
      onSendNow={handleSendNow}
      onStop={() => {
        chat.stop();
        speech.stopSpeaking();
        setVoiceState("listening");
        startSpeechRecognition();
      }}
      onEnd={endVoiceMode}
      onToggleMute={toggleMute}
      onTryAgain={startVoiceMode}
      isMuted={isMuted}
      transcript={liveTranscript}
    />
  );

  const selectedVoiceLabel =
    speech.voices.find((v) => v.id === speech.selectedVoiceId)?.label || "Calm voice";

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 border-r transition-[margin] duration-200 md:block md:w-72",
          !sidebarOpen && "md:-ml-72",
        )}
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
      >
        <AppSidebar {...sidebarProps} onCollapse={() => setSidebarOpen(false)} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" showClose={false} className="w-72 p-0 md:hidden">
          <SheetTitle className="sr-only">Conversations</SheetTitle>
          <SheetDescription className="sr-only">Your chat history</SheetDescription>
          <AppSidebar {...sidebarProps} onCollapse={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 px-3 border-b border-border/30">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open sidebar"
                className={cn(sidebarOpen && "md:hidden")}
                onClick={() => {
                  setSidebarOpen(true);
                  setMobileOpen(true);
                }}
              >
                <PanelLeftIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open sidebar</TooltipContent>
          </Tooltip>
          <ModelPicker models={models} />

          <div className="flex-1" />

          {/* Voice Session Timer Badge when active (Image 3 mockup) */}
          {voiceModeActive && (
            <div className="flex items-center gap-1.5 rounded-full border bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
              <MicIcon className="size-3.5" />
              <span>Voice {formatTimer(voiceSeconds)}</span>
            </div>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="New chat"
                className={cn(sidebarOpen && "md:hidden")}
                onClick={newChat}
              >
                <SquarePenIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New chat</TooltipContent>
          </Tooltip>
        </header>

        {empty ? (
          <div className="flex flex-1 flex-col justify-center overflow-y-auto px-3 pb-[8vh] sm:px-6">
            <EmptyState />
            {voiceModeActive ? voiceBar : composer}
            <SuggestionGrid onPick={chat.send} onStartVoiceMode={startVoiceMode} />
          </div>
        ) : (
          <>
            <MessageList
              conversation={chat.active!}
              streaming={chat.streaming}
              onRegenerate={chat.regenerate}
              onFeedback={chat.setFeedback}
              onSpeak={speech.speakText}
              onStopSpeak={speech.stopSpeaking}
              speakingTextId={speech.speakingTextId}
              voiceLabel={selectedVoiceLabel}
            />
            <div className="shrink-0 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6">
              {voiceModeActive ? voiceBar : composer}
            </div>
          </>
        )}
        <p className="shrink-0 pb-2 text-center text-xs text-muted-foreground">
          AI can make mistakes. Check important information.
        </p>
      </main>
    </div>
  );
}
