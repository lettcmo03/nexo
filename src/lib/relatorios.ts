import type { Cliente, Pedido } from '../types';
import { dataRegistro, idClientePedido, totalPedido } from './utils';

export interface MesResumo { chave: string; legenda: string; total: number; pedidos: number; }

/** Série mensal gerada apenas dos pedidos salvos na API; cancelados não contam nas vendas. */
export function vendasPorMes(pedidos: Pedido[], quantidade: number): MesResumo[] {
  const datas = pedidos.map((p) => dataRegistro(p)).filter((data): data is string => typeof data === 'string' && /^\d{4}-\d{2}/.test(data));
  const ultima = datas.length ? [...datas].sort().at(-1)! : new Date().toISOString().slice(0, 10);
  const [ano, mes] = ultima.split('-').map(Number);
  const serie = Array.from({ length: quantidade }, (_, indice) => {
    const inicio = new Date(ano, mes - quantidade + indice, 1);
    const chave = `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`;
    const legenda = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(inicio).replace('.', '');
    return { chave, legenda, total: 0, pedidos: 0 };
  });
  const indicePorMes = new Map(serie.map((item, i) => [item.chave, i]));
  for (const pedido of pedidos) {
    if (pedido.status === 'cancelado') continue;
    const data = dataRegistro(pedido);
    const indice = data ? indicePorMes.get(data.slice(0, 7)) : undefined;
    if (indice !== undefined) {
      serie[indice].total += totalPedido(pedido);
      serie[indice].pedidos += 1;
    }
  }
  return serie;
}

function celulaCSV(valor: string | number): string {
  const texto = String(valor);
  // Impede que campos fornecidos por usuários sejam interpretados como fórmulas pelo Excel.
  const seguro = /^[\s]*[=+\-@]/.test(texto) ? `'${texto}` : texto;
  return `\"${seguro.replace(/\"/g, '\"\"')}\"`;
}

/** Baixa a planilha dos pedidos visíveis, respeitando todos os filtros aplicados. */
export function exportarPedidosCSV(pedidos: Pedido[], clientes: Cliente[]): void {
  const nomes = new Map(clientes.map((cliente) => [String(cliente.id), cliente.nome]));
  const cabecalho = ['Pedido', 'Data', 'Cliente', 'Status', 'Itens', 'Total (R$)'];
  const linhas = pedidos.map((pedido) => [
    pedido.id,
    dataRegistro(pedido) || '',
    nomes.get(String(idClientePedido(pedido))) || 'Cliente não identificado',
    pedido.status,
    (pedido.itens || []).map((item) => `${item.titulo} (${item.quantidade}x)`).join(' | '),
    totalPedido(pedido).toFixed(2).replace('.', ','),
  ]);
  const csv = '\uFEFF' + [cabecalho, ...linhas].map((linha) => linha.map(celulaCSV).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'nexo-relatorio-pedidos.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Libera o arquivo após o navegador iniciar o download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
