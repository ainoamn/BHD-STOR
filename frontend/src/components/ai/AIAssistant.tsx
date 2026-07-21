"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import { useChat } from "@/hooks/useAI";
import { useRecommendations } from "@/hooks/useAI";

import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  ShoppingBag,
  Loader2,
  Zap,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestions?: ProductSuggestion[];
}

interface ProductSuggestion {
  id: string;
  name: string;
  price: number;
  image?: string;
  slug: string;
}

const QUICK_PROMPTS = [
  { label: "ai.prompts.bestSellers", icon: TrendingUp },
  { label: "ai.prompts.deals", icon: Zap },
  { label: "ai.prompts.newArrivals", icon: Sparkles },
  { label: "ai.prompts.recommend", icon: ShoppingBag },
];

export function AIAssistant() {
  const t = useTranslations("ai");
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: t("welcome"),
      timestamp: new Date().toISOString(),
    },
  ]);

  const chatMutation = useChat();
  const { data: recommendations } = useRecommendations(isOpen);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    chatMutation.mutate(
      { message: userMessage.content, history: messages.map((m) => ({ role: m.role, content: m.content })) },
      {
        onSuccess: (data: any) => {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data?.response || t("defaultResponse"),
            timestamp: new Date().toISOString(),
            suggestions: data?.suggestions ?? [],
          };
          setMessages((prev) => [...prev, assistantMessage]);
        },
        onError: (err: any) => {
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: t("errorMessage"),
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
      }
    );
  };

  const handleQuickPrompt = (promptKey: string) => {
    const promptMap: Record<string, string> = {
      "ai.prompts.bestSellers": "What are the best-selling products?",
      "ai.prompts.deals": "Show me current deals and discounts",
      "ai.prompts.newArrivals": "What are the newest arrivals?",
      "ai.prompts.recommend": "Can you recommend some products for me?",
    };
    setInput(promptMap[promptKey] || "");
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
          >
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              onClick={() => setIsOpen(true)}
              aria-label={t("open")}
            >
              <Sparkles className="h-6 w-6" />
            </Button>
            {/* Pulse effect */}
            <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)]"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <Card className="shadow-2xl border-2 overflow-hidden flex flex-col" style={{ height: "600px", maxHeight: "calc(100vh - 4rem)" }}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{t("title")}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                      </span>
                      <span className="text-xs opacity-80">{t("online")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-[10px] bg-primary-foreground/20 text-primary-foreground border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                      className={`flex gap-3 ${
                        message.role === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          message.role === "user"
                            ? "bg-muted"
                            : "bg-primary/10"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-primary" />
                        )}
                      </div>

                      {/* Message Content */}
                      <div
                        className={`max-w-[80%] space-y-2 ${
                          message.role === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-sm ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted rounded-bl-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </div>

                        {/* Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="grid grid-cols-1 gap-2 pt-1">
                            {message.suggestions.map((suggestion: ProductSuggestion) => (
                              <button
                                key={suggestion.id}
                                className="flex items-center gap-3 p-2 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                                onClick={() => router.push(`/products/${suggestion.slug}`)}
                              >
                                {suggestion.image ? (
                                  <img
                                    src={suggestion.image}
                                    alt={suggestion.name}
                                    className="h-10 w-10 rounded object-cover"
                                  />
                                ) : (
                                  <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {suggestion.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    OMR {suggestion.price?.toFixed(3)}
                                  </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </button>
                            ))}
                          </div>
                        )}

                        <p className="text-[10px] text-muted-foreground px-1">
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Loading Indicator */}
                  {chatMutation.isPending && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-sm p-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {t("thinking")}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {/* Quick Prompts (only show at start) */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-muted-foreground mb-2">{t("quickPrompts")}</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.map((prompt) => (
                      <Button
                        key={prompt.label}
                        variant="outline"
                        size="sm"
                        className="text-xs h-8"
                        onClick={() => handleQuickPrompt(prompt.label)}
                      >
                        <prompt.icon className="h-3 w-3 mr-1" />
                        {t(prompt.label)}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t bg-muted/30">
                <div className="flex gap-2">
                  <Input
                    placeholder={t("placeholder")}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={chatMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || chatMutation.isPending}
                  >
                    {chatMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
