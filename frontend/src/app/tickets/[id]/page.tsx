"use client";

import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Send, Clock, User, Tag, TrendingDown, Loader2, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { use } from "react";
import { useRouter } from "next/navigation";
import { ticketsApi, messagesApi, aiApi, Ticket, Message } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

const priorityStyles: Record<string, string> = {
    critical: "bg-zinc-900 text-zinc-100",
    high: "bg-zinc-700 text-zinc-100",
    medium: "bg-zinc-400 text-zinc-900",
    low: "bg-zinc-200 text-zinc-700",
};

export default function TicketDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [id, user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ticketData, messagesData] = await Promise.all([
                ticketsApi.getById(Number(id)),
                messagesApi.getByTicket(Number(id)),
            ]);
            setTicket(ticketData);
            setMessages(messagesData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast.error("Failed to load ticket. Make sure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!message.trim() || !ticket) return;

        try {
            setSending(true);
            const newMessage = await messagesApi.create({
                ticket_id: ticket.id,
                sender_id: user?.id || "agent-demo",
                content: message,
            });
            setMessages([...messages, newMessage]);
            setMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!ticket) return;
        try {
            setSending(true);
            const result = await aiApi.generateResponse({
                ticket_subject: ticket.subject,
                ticket_description: ticket.description,
                conversation_history: messages.map(m => ({
                    role: m.sender_id.includes("agent") ? "assistant" : "user",
                    content: m.content
                }))
            });
            setMessage(result.response);
            toast.success("AI response generated!");
        } catch (error) {
            console.error("Failed to generate AI response:", error);
            toast.error("Failed to generate AI response");
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (status: string) => {
        if (!ticket) return;
        try {
            await ticketsApi.update(ticket.id, { status });
            setTicket({ ...ticket, status: status as Ticket["status"] });
            toast.success(`Ticket marked as ${status}`);
        } catch (error) {
            toast.error("Failed to update ticket");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen">
                <Sidebar />
                <main className="md:ml-64 p-6 pt-20 md:pt-6 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </main>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen">
                <Sidebar />
                <main className="md:ml-64 p-6 pt-20 md:pt-6">
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Ticket not found</p>
                        <Link href="/tickets">
                            <Button variant="outline" className="mt-4">
                                Back to Tickets
                            </Button>
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Sidebar />

            <main className="md:ml-64 p-6 pt-20 md:pt-6">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <Link href="/tickets">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">#{id}</span>
                                <h1 className="text-xl font-semibold text-foreground">
                                    {ticket.subject}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge className={priorityStyles[ticket.priority]}>
                                {ticket.priority}
                            </Badge>
                            <Badge variant="outline">{ticket.status}</Badge>
                        </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Chat Section */}
                        <Card className="lg:col-span-2">
                            <CardHeader className="border-b border-border">
                                <CardTitle className="text-lg font-medium">Conversation</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[400px] p-4">
                                    <div className="space-y-4">
                                        {/* Initial ticket description */}
                                        <div className="flex gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                                    CU
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="max-w-[70%]">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-foreground">
                                                        Customer
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(ticket.created_at).toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="p-3 rounded-lg bg-muted text-foreground">
                                                    <p className="text-sm">{ticket.description}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Messages */}
                                        {messages.map((msg) => {
                                            const isAgent = msg.sender_id.includes("agent");
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex gap-3 ${isAgent ? "flex-row-reverse" : ""}`}
                                                >
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                                                            {isAgent ? "AG" : "CU"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className={`max-w-[70%] ${isAgent ? "text-right" : ""}`}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-medium text-foreground">
                                                                {isAgent ? "Agent" : "Customer"}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(msg.created_at).toLocaleTimeString([], {
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                })}
                                                            </span>
                                                        </div>
                                                        <div
                                                            className={`p-3 rounded-lg ${isAgent
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted text-foreground"
                                                                }`}
                                                        >
                                                            <p className="text-sm">{msg.content}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>

                                <Separator />

                                {/* Message Input */}
                                <div className="p-4">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Type your message..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && !sending && handleSend()}
                                            className="flex-1"
                                        />
                                        <Button onClick={handleGenerateAI} size="icon" variant="outline" disabled={sending} title="Generate AI Reply">
                                            <Sparkles className="h-4 w-4" />
                                        </Button>
                                        <Button onClick={handleSend} size="icon" disabled={sending}>
                                            {sending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Details Sidebar */}
                        <div className="space-y-4">
                            {/* Customer Info */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Customer
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p className="font-medium text-foreground">
                                        {ticket.profiles?.full_name || "Unknown"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {ticket.profiles?.email || ticket.customer_id}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Ticket Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Details</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Created</span>
                                        <span className="ml-auto text-foreground">
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Tags</span>
                                        <span className="ml-auto">
                                            <Badge variant="secondary">{ticket.tags || "none"}</Badge>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Sentiment</span>
                                        <span className="ml-auto text-foreground">
                                            {ticket.sentiment_score !== null
                                                ? ticket.sentiment_score > 0
                                                    ? "Positive"
                                                    : ticket.sentiment_score < -0.3
                                                        ? "Negative"
                                                        : "Neutral"
                                                : "N/A"}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Actions */}
                            <Card>
                                <CardContent className="pt-4 space-y-2">
                                    <Button
                                        className="w-full"
                                        variant="outline"
                                        onClick={() => handleStatusChange("resolved")}
                                        disabled={ticket.status === "resolved"}
                                    >
                                        Mark as Resolved
                                    </Button>
                                    <Button
                                        className="w-full"
                                        variant="secondary"
                                        onClick={() => handleStatusChange("closed")}
                                        disabled={ticket.status === "closed"}
                                    >
                                        Close Ticket
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
