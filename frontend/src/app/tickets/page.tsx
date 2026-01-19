"use client";

import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ticketsApi, Ticket } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

const priorityStyles: Record<string, string> = {
    critical: "bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900",
    high: "bg-zinc-700 text-zinc-100",
    medium: "bg-zinc-400 text-zinc-900",
    low: "bg-zinc-200 text-zinc-700",
};

export default function TicketsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: "", description: "" });

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
            const data = await ticketsApi.getAll();
            setTickets(data);
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
            toast.error("Failed to load tickets. Make sure the backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTicket.subject || !newTicket.description) return;

        try {
            setCreating(true);
            await ticketsApi.create({
                customer_id: user?.id || "demo-user",
                subject: newTicket.subject,
                description: newTicket.description,
            });
            toast.success("Ticket created successfully!");
            setIsCreateOpen(false);
            setNewTicket({ subject: "", description: "" });
            fetchTickets();
        } catch (error) {
            console.error("Failed to create ticket:", error);
            toast.error("Failed to create ticket");
        } finally {
            setCreating(false);
        }
    };

    const filteredTickets = tickets.filter(
        (ticket) =>
            ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen">
            <Sidebar />

            <main className="md:ml-64 p-6 pt-20 md:pt-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">Tickets</h1>
                            <p className="text-muted-foreground mt-1">
                                Manage customer support tickets
                            </p>
                        </div>

                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    New Ticket
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Create New Ticket</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreate} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input
                                            id="subject"
                                            placeholder="Brief description of the issue"
                                            value={newTicket.subject}
                                            onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Detailed description..."
                                            rows={4}
                                            value={newTicket.description}
                                            onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={creating}>
                                            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Create Ticket
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Search & Filter */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tickets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Tickets List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium">
                                All Tickets ({filteredTickets.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : filteredTickets.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    No tickets found. Create one to get started!
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {filteredTickets.map((ticket) => (
                                        <Link
                                            key={ticket.id}
                                            href={`/tickets/${ticket.id}`}
                                            className="block p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-muted-foreground">
                                                            #{ticket.id}
                                                        </span>
                                                        <h3 className="font-medium text-foreground">
                                                            {ticket.subject}
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                                        {ticket.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{ticket.profiles?.full_name || ticket.profiles?.email || "Unknown"}</span>
                                                        <span>•</span>
                                                        <span>
                                                            {new Date(ticket.created_at).toLocaleDateString()}
                                                        </span>
                                                        {ticket.tags && (
                                                            <>
                                                                <span>•</span>
                                                                <span className="text-zinc-500">{ticket.tags}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge className={priorityStyles[ticket.priority]}>
                                                        {ticket.priority}
                                                    </Badge>
                                                    <Badge
                                                        variant={ticket.status === "open" ? "outline" : "secondary"}
                                                    >
                                                        {ticket.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
