import type { Response } from "express";

interface SSEClient {
  id: string;
  res: Response;
  username: string;
}

const clients = new Map<string, SSEClient>();

export function addSSEClient(id: string, username: string, res: Response): void {
  clients.set(id, { id, res, username });
}

export function removeSSEClient(id: string): void {
  clients.delete(id);
}

export function broadcastEvent(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client.id);
    }
  }
}

export function sendEventToUser(username: string, event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    if (client.username === username) {
      try {
        client.res.write(payload);
      } catch {
        clients.delete(client.id);
      }
    }
  }
}
