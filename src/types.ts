export type Id = string | number;
export type PedidoStatus = 'aberto' | 'pago' | 'cancelado';
export type Canal = 'telefone' | 'email' | 'whatsapp' | 'presencial';

export interface Cliente {
  id: Id;
  nome: string;
  email: string;
  telefone?: string | null;
  empresa?: string | null;
  cidade?: string | null;
}

export interface ClientePayload {
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  cidade?: string;
}

export interface ItemPedido {
  titulo: string;
  preco: number;
  quantidade: number;
}

export interface Pedido {
  id: Id;
  clienteId?: Id;
  cliente_id?: Id;
  cliente?: { id?: Id; nome?: string } | Id;
  itens: ItemPedido[];
  status: PedidoStatus;
  data?: string;
  createdAt?: string;
  created_at?: string;
  criadoEm?: string;
  dataCriacao?: string;
}

export interface Atendimento {
  id: Id;
  titulo: string;
  texto: string;
  canal: string;
  data?: string;
  createdAt?: string;
  created_at?: string;
  criadoEm?: string;
  dataCriacao?: string;
}

export interface UserSession {
  id?: Id;
  nome?: string;
  name?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export type StatusFilter = 'todos' | PedidoStatus;
