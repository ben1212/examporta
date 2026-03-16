export interface User {
  username: string;
  isAdmin: boolean;
  joinDate: string;
  mustChangePassword: boolean;
}

export interface Department {
  id: number;
  name: string;
  createdAt: string;
}

export interface Exam {
  id: number;
  title: string;
  department: string;
  countdown: number;
  fileName: string | null;
  content: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  sender: string;
  receiver: string;
  text: string;
  time: string;
  read: boolean;
}

export interface UnreadCount {
  count: number;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const msg = (data as Record<string, string>)?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};
