import type { Atendimento, Cliente, Id, ItemPedido, Pedido, PedidoStatus } from '../types';

export const money = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', maximumFractionDigits: 2,
}).format(Number.isFinite(value) ? value : 0);

export const numberFormat = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

export function totalPedido(pedido: Pick<Pedido, 'itens'>): number {
  return (pedido.itens || []).reduce((soma, item) => soma + Number(item.preco) * Number(item.quantidade), 0);
}

export function pedidosValidos(pedidos: Pedido[]): Pedido[] {
  return pedidos.filter((pedido) => pedido.status !== 'cancelado');
}

export function totalComprado(pedidos: Pedido[], clienteId: Id): number {
  return pedidosValidos(pedidos)
    .filter((pedido) => String(idClientePedido(pedido)) === String(clienteId))
    .reduce((soma, pedido) => soma + totalPedido(pedido), 0);
}

export function seloCliente(pedidos: Pedido[], clienteId: Id): 'VIP' | 'Regular' | 'Sem compras' {
  const validos = pedidosValidos(pedidos).filter((p) => String(idClientePedido(p)) === String(clienteId));
  if (validos.length === 0) return 'Sem compras';
  return validos.reduce((soma, pedido) => soma + totalPedido(pedido), 0) >= 2000 ? 'VIP' : 'Regular';
}

export function idClientePedido(pedido: Pedido): Id | undefined {
  if (pedido.clienteId !== undefined && pedido.clienteId !== null) return pedido.clienteId;
  if (pedido.cliente_id !== undefined && pedido.cliente_id !== null) return pedido.cliente_id;
  if (typeof pedido.cliente === 'object' && pedido.cliente !== null) return pedido.cliente.id;
  return pedido.cliente;
}

export function topClientes(clientes: Cliente[], pedidos: Pedido[]) {
  return clientes
    .map((cliente) => ({ cliente, total: totalComprado(pedidos, cliente.id) }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);
}

export function resumoPedidos(pedidos: Pedido[]) {
  const ativos = pedidosValidos(pedidos);
  const totalVendido = ativos.reduce((soma, pedido) => soma + totalPedido(pedido), 0);
  const ticketMedio = ativos.length > 0 ? totalVendido / ativos.length : 0;
  const porStatus = (['aberto', 'pago', 'cancelado'] as PedidoStatus[]).map((status) => {
    const lista = pedidos.filter((p) => p.status === status);
    return { status, quantidade: lista.length, valor: lista.reduce((soma, p) => soma + totalPedido(p), 0) };
  });
  return { totalVendido, ticketMedio, porStatus, pedidosValidos: ativos.length };
}

export function dataRegistro(registro: Pedido | Atendimento): string | undefined {
  return registro.data || registro.createdAt || registro.created_at || registro.criadoEm || registro.dataCriacao;
}

export function dataValor(registro: Pedido | Atendimento): number {
  const data = dataRegistro(registro);
  if (!data) return 0;
  const n = new Date(data).getTime();
  return Number.isNaN(n) ? 0 : n;
}

// O backend salva datas como AAAA-MM-DD. O meio-dia local evita que a data
// apareça como o dia anterior em fusos como America/Sao_Paulo.
function dataParaExibicao(data: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(data) ? new Date(`${data}T12:00:00`) : new Date(data);
}

export function dataFormatada(data?: string): string {
  if (!data) return 'Data não informada';
  const d = dataParaExibicao(data);
  if (Number.isNaN(d.getTime())) return data;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function dataHoraFormatada(data?: string): string {
  if (!data) return 'Data não informada';
  // Se a API mandou apenas a data, não inventar um horário para o atendimento.
  if (/^\d{4}-\d{2}-\d{2}$/.test(data)) return dataFormatada(data);
  const d = dataParaExibicao(data);
  if (Number.isNaN(d.getTime())) return data;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(d);
}

export const rotuloStatus: Record<PedidoStatus, string> = { aberto: 'Em aberto', pago: 'Pago', cancelado: 'Cancelado' };

export function canalNormalizado(canal: string): string {
  const lower = String(canal || '').toLowerCase().trim();
  if (lower === 'e-mail' || lower === 'e mail') return 'email';
  if (lower === 'whats app') return 'whatsapp';
  return lower;
}

export function rotuloCanal(canal: string): string {
  const normalizado = canalNormalizado(canal);
  if (normalizado === 'email') return 'E-mail';
  if (normalizado === 'whatsapp') return 'WhatsApp';
  if (normalizado === 'telefone') return 'Telefone';
  if (normalizado === 'presencial') return 'Presencial';
  return canal;
}

export function validarItens(itens: ItemPedido[]): string | null {
  if (itens.length < 1) return 'Adicione pelo menos um item ao pedido.';
  for (let index = 0; index < itens.length; index += 1) {
    const item = itens[index];
    if (!item.titulo.trim()) return `Preencha o título do item ${index + 1}.`;
    if (!Number.isFinite(item.preco) || item.preco < 0) return `Informe um preço válido (0 ou maior) no item ${index + 1}.`;
    if (!Number.isInteger(item.quantidade) || item.quantidade < 1) return `A quantidade do item ${index + 1} deve ser inteira e maior que zero.`;
  }
  return null;
}
