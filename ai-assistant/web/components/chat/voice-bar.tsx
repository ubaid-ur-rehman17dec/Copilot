"use client";

import { useEffect, useState } from "react";
import {
  MicIcon,
  MicOffIcon,
  XIcon,
  Loader2Icon,
  SquareIcon,
  ArrowUpIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  Volume2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { SpeechVoiceOption, VoiceBarState } from "@/hooks/use-speech";

export interface VoiceBarProps {
  state: VoiceBarState;
  audioLevel: number;
  voices: SpeechVoiceOption[];
  selectedVoiceId: string;
  onSelectVoice: (id: string) => void;
  onSendNow: () => void;
  onStop: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onTryAgain: () => void;
  isMuted: boolean;
  transcript?: string;
}

export function VoiceBar({
  state,
  audioLevel,
  voices,
  selectedVoiceId,
  onSelectVoice,
  onSendNow,
  onStop,
  onEnd,
  onToggleMute,
  onTryAgain,
  isMuted,
  transcript,
}: VoiceBarProps) {
  const [dots, setDots] = useState("");

  // Animated dots for thinking
  useEffect(() => {
    if (state !== "thinking") return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, [state]);

  const currentVoiceLabel =
    voices.find((v) => v.id === selectedVoiceId)?.label || "Calm voice";

  // Micro waveform bars calculation
  const waveHeights = [
    Math.max(4, Math.min(18, 4 + audioLevel * 24 * 0.5)),
    Math.max(4, Math.min(22, 6 + audioLevel * 28 * 0.9)),
    Math.max(4, Math.min(26, 8 + audioLevel * 32 * 1.2)),
    Math.max(4, Math.min(20, 5 + audioLevel * 26 * 0.8)),
    Math.max(4, Math.min(16, 4 + audioLevel * 20 * 0.6)),
  ];

  if (state === "mic_blocked") {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-full border border-red-200 bg-red-50/90 dark:bg-red-950/40 dark:border-red-900/60 p-2 pl-4 pr-3 shadow-lg backdrop-blur-md transition-all flex items-center justify-between gap-3 text-red-900 dark:text-red-200">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/60 dark:text-red-300">
            <AlertTriangleIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-none text-red-700 dark:text-red-300">
              Microphone access is blocked
            </p>
            <p className="mt-1 text-xs text-red-600/80 dark:text-red-400/80 truncate">
              Allow it in your browser&apos;s site settings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEnd}
            className="rounded-full bg-background border-red-200 text-xs font-medium text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-zinc-900 dark:text-red-300"
          >
            Type instead
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onTryAgain}
            className="rounded-full bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-xs font-medium px-4"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl rounded-full border bg-card/95 p-2 pl-3.5 pr-2.5 shadow-xl backdrop-blur-md transition-all flex items-center justify-between gap-3">
      {/* Left Icon & Main Text */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {state === "connecting" && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin text-primary" />
          </div>
        )}

        {state === "reconnecting" && (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted text-amber-500">
            <RefreshCwIcon className="size-4 animate-spin" />
          </div>
        )}

        {(state === "listening" || state === "thinking" || state === "speaking") && (
          <button
            type="button"
            onClick={onToggleMute}
            title="Click to mute microphone"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-accent text-foreground transition-transform active:scale-95 hover:bg-muted"
          >
            <MicIcon className="size-4 text-primary" />
          </button>
        )}

        {state === "muted" && (
          <button
            type="button"
            onClick={onToggleMute}
            title="Click to unmute microphone"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 transition-transform active:scale-95"
          >
            <MicOffIcon className="size-4" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {state === "connecting" && "Connecting..."}
              {state === "reconnecting" && "Connection lost. Reconnecting..."}
              {state === "listening" && (transcript ? `"${transcript}"` : "Listening...")}
              {state === "thinking" && `Thinking ${dots}`}
              {state === "speaking" && "Speaking... talk anytime to interrupt"}
              {state === "muted" && "Microphone off"}
            </span>

            {state === "listening" && (
              <div className="flex items-center gap-0.5 px-1 py-0.5">
                {waveHeights.map((h, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-primary transition-all duration-75"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground truncate">
            {state === "connecting" && "Joining the voice room"}
            {state === "reconnecting" && "Network dropped; retries on its own"}
            {state === "listening" && "You are talking; bars follow your voice"}
            {state === "thinking" && "You paused; the model is preparing a reply"}
            {state === "speaking" && "Reply plays; talking interrupts it"}
            {state === "muted" && "Tap the mic to unmute"}
          </p>
        </div>
      </div>

      {/* Center/Right Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Voice Selector Dropdown */}
        {state !== "connecting" && state !== "reconnecting" && voices.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 rounded-full px-2.5 text-xs text-muted-foreground hover:text-foreground hidden sm:flex"
              >
                <Volume2Icon className="size-3.5" />
                <span className="max-w-24 truncate">{currentVoiceLabel}</span>
                <ChevronDownIcon className="size-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56 max-h-56 overflow-y-auto">
              {voices.map((v) => (
                <DropdownMenuItem
                  key={v.id}
                  onClick={() => onSelectVoice(v.id)}
                  className={cn(
                    "cursor-pointer text-xs justify-between",
                    selectedVoiceId === v.id && "font-semibold text-primary",
                  )}
                >
                  <span className="truncate">{v.label}</span>
                  {selectedVoiceId === v.id && <span className="size-1.5 rounded-full bg-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Action Button depending on state */}
        {state === "listening" && (
          <Button
            type="button"
            size="sm"
            onClick={onSendNow}
            className="h-8 rounded-full bg-accent text-accent-foreground hover:bg-muted font-medium text-xs gap-1.5 border"
          >
            <ArrowUpIcon className="size-3.5" />
            Send now
          </Button>
        )}

        {(state === "thinking" || state === "speaking") && (
          <Button
            type="button"
            size="sm"
            onClick={onStop}
            className="h-8 rounded-full bg-accent text-accent-foreground hover:bg-muted font-medium text-xs gap-1.5 border"
          >
            <SquareIcon className="size-3 fill-current" />
            Stop
          </Button>
        )}

        {/* End Button */}
        <Button
          type="button"
          size="sm"
          onClick={onEnd}
          className="h-8 rounded-full bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 font-medium text-xs gap-1 px-3"
        >
          <XIcon className="size-3.5" />
          End
        </Button>
      </div>
    </div>
  );
}
