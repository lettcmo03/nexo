import type { Atendimento, Cliente, ClientePayload, Id, ItemPedido, Pedido, PedidoStatus, UserSession } from '../types';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'nexo_crm_access_token';
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function mensagemHttp(status: number, servidor: unknown): string {
  const detalhe = typeof servidor === 'object' && servidor !== null
    ? String((servidor as Record<string, unknown>).message || (servidor as Record<string, unknown>).mensagem || (servidor as Record<string, unknown>).erro || (servidor as Record<string, unknown>).error || '').trim()
    : '';
  // Apenas usar mensagens do servidor quando são legíveis em vez de códigos brutos.
  if (status === 400) return detalhe || 'Dados inválidos. Confira os campos e tente novamente.';
  if (status === 401) return 'Sessão expirada ou credenciais inválidas. Entre novamente.';
  if (status === 404) return 'O registro solicitado não foi encontrado.';
  if (status === 409) return 'Este e-mail já está cadastrado. Use outro e-mail.';
  if (status >= 500) return 'O servidor apresentou um erro. Tente novamente em instantes.';
  return detalhe || `Não foi possível concluir a operação (HTTP ${status}).`;
}

async function request<T>(path: string, init: RequestInit = {}, isLogin = false): Promise<T> {
  if (!BASE_URL) throw new ApiError(0, 'VITE_API_URL não configurada. Confira o arquivo .env.');
  const token = getToken();
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token && !isLogin) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Confirme se a API está ligada em localhost:3333.');
  }
  const text = await response.text();
  let body: unknown;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    if (response.status === 401 && !isLogin) onUnauthorized?.();
    throw new ApiError(response.status, mensagemHttp(response.status, body));
  }
  return body as T;
}

function get<T>(path: string) { return request<T>(path); }
function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}
function patch<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}
function remove(path: string) {
  return request<unknown>(path, { method: 'DELETE' });
}

function extrairArray<T>(resposta: unknown, chave: string): T[] {
  if (Array.isArray(resposta)) return resposta as T[];
  if (typeof resposta === 'object' && resposta !== null) {
    const obj = resposta as Record<string, unknown>;
    if (Array.isArray(obj[chave])) return obj[chave] as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

function extrairRegistro<T>(resposta: unknown, chave: string): T {
  if (typeof resposta === 'object' && resposta !== null && chave in resposta) {
    return (resposta as Record<string, unknown>)[chave] as T;
  }
  return resposta as T;
}

export const api = {
  async login(username: string, password: string): Promise<string> {
    const result = await request<{ accessToken?: string; token?: string }>(
      '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }, true,
    );
    const token = result.accessToken || result.token;
    if (!token) throw new ApiError(0, 'O servidor não enviou o accessToken do login.');
    return token;
  },
  async me(): Promise<UserSession> {
    const result = await get<unknown>('/auth/me');
    return extrairRegistro<UserSession>(result, 'user');
  },
  async clientes(q = '', limit = 5, skip = 0): Promise<{ clientes: Cliente[]; total: number }> {
    const qs = new URLSearchParams({ q, limit: String(limit), skip: String(skip) });
    const res = await get<unknown>(`/clientes?${qs}`);
    const clientes = extrairArray<Cliente>(res, 'clientes');
    const total = typeof res === 'object' && res !== null && 'total' in res
      ? Number((res as { total: unknown }).total)
      : clientes.length;
    return { clientes, total: Number.isFinite(total) ? total : clientes.length };
  },
  async todosClientes(): Promise<Cliente[]> {
    const resultado: Cliente[] = [];
    const ids = new Set<string>();
    for (let skip = 0; skip < 100000; skip += 100) {
      const { clientes, total } = await api.clientes('', 100, skip);
      for (const cliente of clientes) {
        const key = String(cliente.id);
        if (!ids.has(key)) { ids.add(key); resultado.push(cliente); }
      }
      if (clientes.length === 0 || resultado.length >= total || clientes.length < 100) break;
    }
    return resultado;
  },
  async cliente(id: Id): Promise<Cliente> {
    const result = await get<unknown>(`/clientes/${encodeURIComponent(String(id))}`);
    return extrairRegistro<Cliente>(result, 'cliente');
  },
  async criarCliente(payload: ClientePayload): Promise<Cliente> {
    const result = await post<unknown>('/clientes', payload);
    return extrairRegistro<Cliente>(result, 'cliente');
  },
  async editarCliente(id: Id, payload: ClientePayload): Promise<Cliente> {
    const result = await patch<unknown>(`/clientes/${encodeURIComponent(String(id))}`, payload);
    return extrairRegistro<Cliente>(result, 'cliente');
  },
  excluirCliente(id: Id) { return remove(`/clientes/${encodeURIComponent(String(id))}`); },
  async pedidos(): Promise<Pedido[]> { return extrairArray<Pedido>(await get<unknown>('/pedidos'), 'pedidos'); },
  async pedidosCliente(id: Id): Promise<Pedido[]> {
    return extrairArray<Pedido>(await get<unknown>(`/clientes/${encodeURIComponent(String(id))}/pedidos`), 'pedidos');
  },
  criarPedido(id: Id, itens: ItemPedido[]) { return post(`/clientes/${encodeURIComponent(String(id))}/pedidos`, { itens }); },
  editarItens(id: Id, itens: ItemPedido[]) { return patch(`/pedidos/${encodeURIComponent(String(id))}`, { itens }); },
  mudarStatus(id: Id, status: PedidoStatus) { return patch(`/pedidos/${encodeURIComponent(String(id))}`, { status }); },
  excluirPedido(id: Id) { return remove(`/pedidos/${encodeURIComponent(String(id))}`); },
  async atendimentosCliente(id: Id): Promise<Atendimento[]> {
    return extrairArray<Atendimento>(await get<unknown>(`/clientes/${encodeURIComponent(String(id))}/atendimentos`), 'atendimentos');
  },
  criarAtendimento(id: Id, titulo: string, texto: string, canal: string) {
    return post(`/clientes/${encodeURIComponent(String(id))}/atendimentos`, { titulo, texto, canal });
  },
  editarAtendimento(id: Id, titulo: string, texto: string, canal: string) {
    return patch(`/atendimentos/${encodeURIComponent(String(id))}`, { titulo, texto, canal });
  },
  excluirAtendimento(id: Id) { return remove(`/atendimentos/${encodeURIComponent(String(id))}`); },
};

export function friendlyError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Algo deu errado. Tente novamente.';
}
