"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
import {
  ArrowUpIcon,
  SquareIcon,
  XIcon,
  Loader2Icon,
  PlusIcon,
  PaperclipIcon,
  CameraIcon,
  FolderPlusIcon,
  ScrollTextIcon,
  PlugIcon,
  PaletteIcon,
  PuzzleIcon,
  GlobeIcon,
  BrainIcon,
  MicIcon,
  MicOffIcon,
  AudioWaveformIcon,
  ChevronDownIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { uploadImage } from "@/lib/api";
import { APP_CONFIG } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { ContentBlock } from "@/lib/types";
import { toast } from "sonner";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function Composer({
  onSend,
  onStop,
  streaming,
  disabled,
  placeholder = `Message ${APP_CONFIG.appName}…`,
  autoFocus,
  onStartVoiceMode,
}: {
  onSend: (text: string, attachments?: ContentBlock[], options?: { isSpoken?: boolean }) => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onStartVoiceMode?: () => void;
}) {
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<ContentBlock[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<"chat" | "cowork">("chat");
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [listening, setListening] = useState(false);

  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (autoFocus && window.matchMedia("(min-width: 768px)").matches) ref.current?.focus();
  }, [autoFocus]);

  // Global Ctrl+U shortcut for image upload
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const processFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Unsupported file type. Please upload JPEG, PNG, WebP, or GIF image.");
      return;
    }

    setUploading(true);
    try {
      const data = await uploadImage(file);
      setAttachments((prev) => [
        ...prev,
        { type: "image", image_url: data.url, mime_type: data.mime_type },
      ]);
      toast.success("Image attached");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await processFile(file);
          break;
        }
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in your browser.");
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setListening(true);
        toast.info("Listening...");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setListening(false);
        toast.error(`Speech recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      toast.error("Could not start speech recognition.");
    }
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (streaming) return onStop();
    if ((!value.trim() && attachments.length === 0) || disabled || uploading) return;
    onSend(value, attachments);
    setValue("");
    setAttachments([]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const touch = window.matchMedia("(hover: none)").matches;
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && !touch) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = streaming || ((!!value.trim() || attachments.length > 0) && !disabled && !uploading);

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-3xl rounded-3xl border bg-card p-2.5 shadow-md transition-colors focus-within:border-ring"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />

      {(attachments.length > 0 || uploading) && (
        <div className="mb-2 flex flex-wrap gap-2 p-2">
          {attachments.map((attachment, i) => (
            <div key={i} className="relative size-16 overflow-hidden rounded-xl border bg-muted shadow-xs">
              <img
                src={attachment.image_url}
                alt="Attachment"
                className="size-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="absolute right-1 top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground hover:bg-destructive/90 transition-transform active:scale-95"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
          {uploading && (
            <div className="flex size-16 flex-col items-center justify-center gap-1 rounded-xl border bg-muted p-1 text-[10px] text-muted-foreground animate-pulse">
              <Loader2Icon className="size-4 animate-spin text-primary" />
              <span>Uploading...</span>
            </div>
          )}
        </div>
      )}

      <label htmlFor="composer" className="sr-only">
        Message
      </label>
      <textarea
        id="composer"
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onPaste={handlePaste}
        placeholder={placeholder}
        enterKeyHint="send"
        className="field-sizing-content max-h-52 min-h-8 w-full resize-none bg-transparent px-2 py-1.5 text-[15px] leading-6 outline-none placeholder:text-muted-foreground"
      />

      <div className="mt-1 flex items-center justify-between gap-2 border-t border-border/40 pt-2 px-1">
        {/* Left Side: Plus Menu & Mode Switcher Pill */}
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-8 rounded-full border-border/60 hover:bg-accent"
                aria-label="Add content or features"
              >
                <PlusIcon className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-64 p-1.5">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <PaperclipIcon className="size-4 text-muted-foreground" />
                  <span>Add files or photos</span>
                </div>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  Ctrl+U
                </kbd>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                <CameraIcon className="size-4 text-muted-foreground" />
                <span>Take a screenshot</span>
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderPlusIcon className="size-4 text-muted-foreground" />
                  <span>Add to project</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => toast.info("Project feature coming soon")}>
                    Create new workspace
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Project feature coming soon")}>
                    Select active project
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ScrollTextIcon className="size-4 text-muted-foreground" />
                  <span>Skills</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => toast.info("Skills active")}>Code Refactoring</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Skills active")}>Web Design</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Skills active")}>Writing Assistant</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <PlugIcon className="size-4 text-muted-foreground" />
                  <span>Add connector</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => toast.info("Connector configured")}>GitHub</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Connector configured")}>Google Drive</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Connector configured")}>Slack</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <PaletteIcon className="size-4 text-muted-foreground" />
                  <span>Design system</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => toast.info("Shadcn/ui active")}>Shadcn UI</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.info("Tailwind active")}>Tailwind CSS</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuItem onClick={() => toast.info("Plugins browser opened")}>
                <PuzzleIcon className="size-4 text-muted-foreground" />
                <span>Add plugins</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuCheckboxItem
                checked={webSearchEnabled}
                onCheckedChange={(checked) => {
                  setWebSearchEnabled(!!checked);
                  toast.success(`Web search ${checked ? "enabled" : "disabled"}`);
                }}
              >
                <GlobeIcon className="size-4 text-muted-foreground" />
                <span>Web search</span>
              </DropdownMenuCheckboxItem>

              <DropdownMenuCheckboxItem
                checked={memoryEnabled}
                onCheckedChange={(checked) => {
                  setMemoryEnabled(!!checked);
                  toast.success(`Memory ${checked ? "enabled" : "disabled"}`);
                }}
              >
                <BrainIcon className="size-4 text-muted-foreground" />
                <span>Memory</span>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mode Switcher Pill (Chat / Cowork) */}
          <div className="flex items-center rounded-full bg-muted p-0.5 border text-xs font-medium">
            <button
              type="button"
              onClick={() => setMode("chat")}
              className={cn(
                "rounded-full px-2.5 py-1 transition-all",
                mode === "chat"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setMode("cowork")}
              className={cn(
                "rounded-full px-2.5 py-1 transition-all",
                mode === "cowork"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Cowork
            </button>
          </div>
        </div>

        {/* Right Side: Voice Mic, Audio Waveform & Send Button */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleListening}
            title={listening ? "Stop listening" : "Start voice input"}
            className={cn(
              "size-8 rounded-full text-muted-foreground hover:text-foreground transition-all",
              listening && "bg-red-500/10 text-red-500 animate-pulse hover:text-red-600",
            )}
          >
            {listening ? <MicOffIcon className="size-4" /> : <MicIcon className="size-4" />}
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onStartVoiceMode}
                className="size-8 rounded-full text-muted-foreground hover:text-foreground transition-all hover:bg-accent"
                aria-label="Start voice mode"
              >
                <AudioWaveformIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start voice mode</TooltipContent>
          </Tooltip>

          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            aria-label={streaming ? "Stop generating" : "Send message"}
            className={cn("size-8 rounded-full transition-transform active:scale-95", !canSend && "opacity-30")}
          >
            {streaming ? <SquareIcon className="size-3.5 fill-current" /> : <ArrowUpIcon className="size-4" />}
          </Button>
        </div>
      </div>
    </form>
  );
}
