import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ClipboardList, Download, Filter, Search } from 'lucide-react';
import { api, friendlyError } from '../lib/api';
import { dataFormatada, dataRegistro, dataValor, idClientePedido, money, totalPedido } from '../lib/utils';
import { useData } from '../context/DataContext';
import { exportarPedidosCSV } from '../lib/relatorios';
import { EmptyState, ErrorState, FormField, PageTitle, Spinner, StatusBadge } from '../components/UI';
import type { Cliente, Pedido, StatusFilter } from '../types';

type SortKey = 'data-desc' | 'data-asc' | 'total-desc' | 'total-asc';
export default function OrdersPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [status, setStatus] = useState<StatusFilter>('todos');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [sort, setSort] = useState<SortKey>('data-desc');
  const { version } = useData();
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError(null);
      try {
        const [orders, clients] = await Promise.all([api.pedidos(), api.todosClientes()]);
        if (active) { setPedidos(orders); setClientes(clients); }
      } catch (e) { if (active) setError(friendlyError(e)); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [retry, version]);
  const filtered = useMemo(() => pedidos
    .filter((p) => status === 'todos' || p.status === status)
    .filter((p) => min === '' || totalPedido(p) >= Number(min))
    .filter((p) => max === '' || totalPedido(p) <= Number(max))
    .sort((a, b) => {
      switch (sort) {
        case 'data-asc': return dataValor(a) - dataValor(b);
        case 'total-desc': return totalPedido(b) - totalPedido(a);
        case 'total-asc': return totalPedido(a) - totalPedido(b);
        default: return dataValor(b) - dataValor(a);
      }
    }), [pedidos, status, min, max, sort]);
  const byId = useMemo(() => new Map(clientes.map((c) => [String(c.id), c.nome])), [clientes]);
  function getName(p: Pedido): string {
    const id = idClientePedido(p);
    if (id !== undefined) return byId.get(String(id)) || `Cliente #${id}`;
    if (typeof p.cliente === 'object' && p.cliente?.nome) return p.cliente.nome;
    return 'Cliente não identificado';
  }
  return <>
    <PageTitle eyebrow="GESTÃO DE VENDAS" title="Todos os pedidos" subtitle="Filtre, organize e acompanhe os pedidos de seus clientes." action={<button type="button" className="btn secondary" onClick={() => exportarPedidosCSV(filtered, clientes)} disabled={loading || Boolean(error)} title="Exportar pedidos filtrados como planilha CSV"><Download size={17}/> Exportar CSV</button>} />
    <section className="card list-panel"><div className="list-toolbar"><div><h2>Visão de pedidos</h2><p>{filtered.length} de {pedidos.length} pedidos encontrados</p></div><span className="section-round-icon"><Filter size={20}/></span></div>
      <div className="orders-filters"><FormField label="Status" htmlFor="orders-status"><select id="orders-status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)}><option value="todos">Todos os status</option><option value="aberto">Em aberto</option><option value="pago">Pago</option><option value="cancelado">Cancelado</option></select></FormField><FormField label="Valor mínimo (R$)" htmlFor="orders-min"><input id="orders-min" type="number" min="0" step="0.01" placeholder="0,00" value={min} onChange={(e) => setMin(e.target.value)}/></FormField><FormField label="Valor máximo (R$)" htmlFor="orders-max"><input id="orders-max" type="number" min="0" step="0.01" placeholder="Sem limite" value={max} onChange={(e) => setMax(e.target.value)}/></FormField><FormField label="Ordenar por" htmlFor="orders-sort"><select id="orders-sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}><option value="data-desc">Mais recentes</option><option value="data-asc">Mais antigos</option><option value="total-desc">Maior valor</option><option value="total-asc">Menor valor</option></select></FormField></div>
      {loading ? <Spinner label="Carregando pedidos..."/> : error ? <ErrorState message={error} onRetry={() => setRetry((r) => r + 1)}/> : filtered.length === 0 ? <EmptyState title="Nenhum pedido encontrado" message="Experimente mudar os filtros ou cadastre um pedido nos detalhes de um cliente."/> : <div className="all-orders-list">{filtered.map((p) => {
        const clienteId = idClientePedido(p);
        const content = <><span className="all-order-icon"><ClipboardList size={21}/></span><span className="all-order-main"><strong>Pedido #{p.id}</strong><small>{getName(p)}</small><span>{dataFormatada(dataRegistro(p))}</span></span><span className="all-order-right"><StatusBadge status={p.status}/><strong>{money(totalPedido(p))}</strong></span><ArrowUpRight className="row-arrow" size={19}/></>;
        return clienteId !== undefined ? <Link to={`/clientes/${clienteId}`} className="all-order-row" key={String(p.id)} title="Abrir cliente">{content}</Link> : <div className="all-order-row" key={String(p.id)}>{content}</div>;
      })}</div>}
      {!loading && !error && <div className="orders-footer"><Search size={17}/> A contagem considera todos os pedidos, inclusive os cancelados. Total vendido e ticket médio no Painel não incluem cancelamentos.</div>}
    </section>
  </>;
}
