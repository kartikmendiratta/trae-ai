const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface Ticket {
    id: number;
    customer_id: string;
    subject: string;
    description: string;
    status: 'open' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    sentiment_score: number | null;
    tags: string | null;
    created_at: string;
    profiles?: {
        email: string;
        full_name: string | null;
    };
}

export interface Message {
    id: number;
    ticket_id: number;
    sender_id: string;
    content: string;
    is_internal: boolean;
    created_at: string;
    profiles?: {
        email: string;
        full_name: string | null;
    };
}

// Tickets API
export const ticketsApi = {
    async getAll(status?: string, customer_id?: string): Promise<Ticket[]> {
        const params = new URLSearchParams();
        if (status) params.append("status", status);
        if (customer_id) params.append("customer_id", customer_id);

        const res = await fetch(`${API_URL}/api/tickets?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch tickets');
        const data = await res.json();
        return data.tickets || [];
    },

    async getById(id: number): Promise<Ticket> {
        const res = await fetch(`${API_URL}/api/tickets/${id}`);
        if (!res.ok) throw new Error('Failed to fetch ticket');
        const data = await res.json();
        return data.ticket;
    },

    async create(ticket: {
        customer_id: string;
        subject: string;
        description: string;
        priority?: string;
    }): Promise<Ticket> {
        const res = await fetch(`${API_URL}/api/tickets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticket),
        });
        if (!res.ok) throw new Error('Failed to create ticket');
        const data = await res.json();
        return data.ticket;
    },

    async update(id: number, updates: { status?: string; priority?: string }): Promise<Ticket> {
        const res = await fetch(`${API_URL}/api/tickets/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error('Failed to update ticket');
        const data = await res.json();
        return data.ticket;
    },
};

// Messages API
export const messagesApi = {
    async getByTicket(ticketId: number): Promise<Message[]> {
        const res = await fetch(`${API_URL}/api/messages/${ticketId}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        return data.messages || [];
    },

    async create(message: {
        ticket_id: number;
        sender_id: string;
        content: string;
        is_internal?: boolean;
    }): Promise<Message> {
        const res = await fetch(`${API_URL}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message),
        });
        if (!res.ok) throw new Error('Failed to send message');
        const data = await res.json();
        return data.message;
    },

    async search(query: string): Promise<{ id: number; content: string; similarity: number }[]> {
        const res = await fetch(`${API_URL}/api/messages/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });
        if (!res.ok) throw new Error('Failed to search');
        const data = await res.json();
        return data.results || [];
    },
};

// AI API
export const aiApi = {
    async generateResponse(params: {
        ticket_subject: string;
        ticket_description: string;
        conversation_history?: any[];
    }): Promise<{ response: string; model: string }> {
        const res = await fetch(`${API_URL}/api/ai/generate-response`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });
        if (!res.ok) throw new Error('Failed to generate AI response');
        return await res.json();
    },
};
