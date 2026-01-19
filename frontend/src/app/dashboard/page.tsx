"use client";

import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, MessageSquare, Clock, TrendingUp, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ticketsApi, Ticket as TicketType } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function DashboardPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [tickets, setTickets] = useState<TicketType[]>([]);
    const [loading, setLoading] = useState(true);

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
            // Filter tickets by current user ID
            const data = await ticketsApi.getAll(undefined, user?.id);
            setTickets(data);
        } catch (error) {
            console.error("Failed to fetch tickets:", error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const openTickets = tickets.filter((t) => t.status === "open");
    const resolvedTickets = tickets.filter((t) => t.status === "resolved");

    const stats = [
        {
            title: "Open Tickets",
            value: openTickets.length.toString(),
            icon: Ticket,
            description: "Awaiting response",
        },
        {
            title: "Total Tickets",
            value: tickets.length.toString(),
            icon: MessageSquare,
            description: "All time",
        },
        {
            title: "Avg Response Time",
            value: "2.4h",
            icon: Clock,
            description: "This week",
        },
        {
            title: "Resolution Rate",
            value: tickets.length > 0
                ? Math.round((resolvedTickets.length / tickets.length) * 100) + "%"
                : "0%",
            icon: TrendingUp,
            description: "All time",
        },
    ];

    const priorityStyles: Record<string, string> = {
        critical: "bg-zinc-900 text-zinc-100",
        high: "bg-zinc-700 text-zinc-100",
        medium: "bg-zinc-400 text-zinc-900",
        low: "bg-zinc-200 text-zinc-700",
    };

    return (
        <div className="min-h-screen">
            <Sidebar />

            <main className="md:ml-64 p-6 pt-20 md:pt-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
                        <p className="text-muted-foreground mt-1">
                            Welcome back, {user.name}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat) => (
                            <Card key={stat.title} className="bg-card">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-foreground">
                                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : stat.value}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Recent Tickets */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-medium">Recent Tickets</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No tickets yet. Create one from the Tickets page!
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {tickets.slice(0, 5).map((ticket) => (
                                        <Link
                                            key={ticket.id}
                                            href={`/tickets/${ticket.id}`}
                                            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-medium text-foreground">{ticket.subject}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(ticket.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={priorityStyles[ticket.priority]}>
                                                    {ticket.priority}
                                                </Badge>
                                                <Badge variant={ticket.status === "open" ? "outline" : "secondary"}>
                                                    {ticket.status}
                                                </Badge>
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
