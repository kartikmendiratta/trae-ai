"use client";

import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Sparkles, Loader2, Send, X, Edit, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ticketsApi, aiApi, messagesApi, Ticket as TicketType } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export default function AdminPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [tickets, setTickets] = useState<TicketType[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
    const [aiDraft, setAiDraft] = useState("");
    const [generating, setGenerating] = useState(false);
    const [sending, setSending] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchTickets();
        }
    }, [user]);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            // Admin sees ALL open tickets (no customer_id filter)
            const data = await ticketsApi.getAll("open");
            setTickets(data);
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
            toast.error("Failed to fetch open tickets");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickReply = async (ticket: TicketType) => {
        setSelectedTicket(ticket);
        setIsDialogOpen(true);
        setAiDraft(""); // Reset draft

        // Auto-generate draft
        try {
            setGenerating(true);
            // Fetch messages for context
            const messages = await messagesApi.getByTicket(ticket.id);

            const result = await aiApi.generateResponse({
                ticket_subject: ticket.subject,
                ticket_description: ticket.description,
                conversation_history: messages.map(m => ({
                    role: m.sender_id.includes("agent") ? "assistant" : "user",
                    content: m.content
                }))
            });
            setAiDraft(result.response);
        } catch (error) {
            console.error("Failed to generate draft:", error);
            toast.error("Failed to generate AI draft");
            setAiDraft("Failed to generate draft. Please type your reply.");
        } finally {
            setGenerating(false);
        }
    };

    const handleSendReply = async () => {
        if (!selectedTicket || !aiDraft.trim()) return;

        try {
            setSending(true);
            // 1. Send the message
            await messagesApi.create({
                ticket_id: selectedTicket.id,
                sender_id: "0850a164-fd7b-42a4-92a4-f89c1971f2fc", // Real Admin UUID
                content: aiDraft,
            });

            // 2. Mark ticket as resolved (optional, but good for admin workflow)
            // await ticketsApi.update(selectedTicket.id, { status: "resolved" });

            toast.success("Reply sent successfully!");
            setIsDialogOpen(false);
            fetchTickets(); // Refresh list
        } catch (error) {
            console.error("Failed to send reply:", error);
            toast.error("Failed to send reply");
        } finally {
            setSending(false);
        }
    };

    const priorityStyles: Record<string, string> = {
        critical: "bg-zinc-900 text-zinc-100",
        high: "bg-zinc-700 text-zinc-100",
        medium: "bg-zinc-400 text-zinc-900",
        low: "bg-zinc-200 text-zinc-700",
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Sidebar />

            <main className="md:ml-64 p-6 pt-20 md:pt-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Admin Console</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage open tickets and quick replies
                        </p>
                    </div>

                    {/* Open Tickets List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium flex items-center justify-between">
                                <span>Open Tickets ({tickets.length})</span>
                                <Button variant="outline" size="sm" onClick={fetchTickets}>
                                    Refresh
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No open tickets! Great job. 🎉
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {tickets.map((ticket) => (
                                        <div key={ticket.id} className="py-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                            <div className="space-y-1 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/tickets/${ticket.id}`} className="font-medium text-foreground hover:underline">
                                                        {ticket.subject}
                                                    </Link>
                                                    <Badge className={priorityStyles[ticket.priority]}>
                                                        {ticket.priority}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {ticket.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{ticket.customer_id}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 w-full md:w-auto">
                                                <Button
                                                    onClick={() => handleQuickReply(ticket)}
                                                    className="w-full md:w-auto gap-2"
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                    Quick Reply
                                                </Button>
                                                <Link href={`/tickets/${ticket.id}`} className="hidden md:block">
                                                    <Button variant="outline" size="icon">
                                                        <MessageSquare className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Quick Reply Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Quick Reply to: {selectedTicket?.subject}</DialogTitle>
                        <DialogDescription>
                            Review the AI-generated draft before sending.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Draft Response
                            </label>
                            {generating ? (
                                <div className="h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                        <span>Generating draft...</span>
                                    </div>
                                </div>
                            ) : (
                                <Textarea
                                    value={aiDraft}
                                    onChange={(e) => setAiDraft(e.target.value)}
                                    className="h-[200px]"
                                    placeholder="Type your reply here..."
                                />
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={sending}>
                            Cancel
                        </Button>
                        <Button onClick={handleSendReply} disabled={sending || generating || !aiDraft.trim()}>
                            {sending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
                                    Send Reply
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
