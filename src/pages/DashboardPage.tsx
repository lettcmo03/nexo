import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ChartNoAxesCombined, CirclePlus, ClipboardList, CreditCard, Crown, Sparkles, UsersRound, Wallet } from 'lucide-react';
import { api, friendlyError } from '../lib/api';
import { money, numberFormat, resumoPedidos, topClientes } from '../lib/utils';
import { vendasPorMes } from '../lib/relatorios';
import { useData } from '../context/DataContext';
import { useAuth, userDisplayName } from '../context/AuthContext';
import { EmptyState, ErrorState, PageTitle, Spinner, StatusBadge } from '../components/UI';
import type { Cliente, Pedido } from '../types';

export default function DashboardPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [meses, setMeses] = useState<6 | 12>(6);
  const { version } = useData();
  const { user } = useAuth();

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError(null);
      try {
        const [clientsData, ordersData] = await Promise.all([api.todosClientes(), api.pedidos()]);
        if (active) { setClientes(clientsData); setPedidos(ordersData); }
      } catch (e) { if (active) setError(friendlyError(e)); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [retry, version]);

  const summary = useMemo(() => resumoPedidos(pedidos), [pedidos]);
  const top = useMemo(() => topClientes(clientes, pedidos), [clientes, pedidos]);
  const serie = useMemo(() => vendasPorMes(pedidos, meses), [pedidos, meses]);
  const maiorMes = Math.max(1, ...serie.map((m) => m.total));
  const maiorStatus = Math.max(1, ...summary.porStatus.map((s) => s.quantidade));
  const primeiroNome = userDisplayName(user).split(' ')[0];

  return <>
    <PageTitle eyebrow="SEU ESPAÇO DE TRABALHO" title={`Bom te ver, ${primeiroNome}.`} subtitle="Uma visão simples do que está acontecendo com seus clientes." action={<Link className="btn primary" to="/clientes/novo"><CirclePlus size={17}/> Novo cliente</Link>}/>
    {loading ? <div className="card loading-card"><Spinner label="Buscando os dados do seu negócio..."/></div> : error ? <ErrorState message={error} onRetry={() => setRetry((v) => v + 1)} /> : <>
      <div className="dashboard-welcome"><div className="welcome-intro"><span className="welcome-label"><Sparkles size={14}/> VISÃO GERAL</span><strong>Organize seus contatos.<br/><em>Acompanhe cada conquista.</em></strong><p>Os números abaixo acompanham os registros do CRM em tempo real.</p></div><div className="welcome-visual" aria-hidden="true"><span className="orbit orbit-a"/><span className="orbit orbit-b"/><span className="welcome-dot dot-one"/><span className="welcome-dot dot-two"/><div className="welcome-float float-main"><ChartNoAxesCombined size={30}/><span>nexo<span className="tiny-star">✦</span></span></div><div className="welcome-float float-small"><UsersRound size={19}/></div></div></div>
      <div className="metrics">
        <div className="metric-card"><span className="metric-head">Clientes cadastrados <span className="metric-icon blue"><UsersRound size={21}/></span></span><strong>{numberFormat(clientes.length)}</strong><span className="metric-foot">Contatos na sua base</span><div className="metric-decoration"/></div>
        <div className="metric-card"><span className="metric-head">Total vendido <span className="metric-icon green"><Wallet size={21}/></span></span><strong>{money(summary.totalVendido)}</strong><span className="metric-foot">Pedidos não cancelados</span><div className="metric-decoration"/></div>
        <div className="metric-card"><span className="metric-head">Ticket médio <span className="metric-icon purple"><CreditCard size={21}/></span></span><strong>{money(summary.ticketMedio)}</strong><span className="metric-foot">{summary.pedidosValidos} pedidos válidos</span><div className="metric-decoration"/></div>
      </div>
      <section className="card report-card" aria-labelledby="vendas-title">
        <div className="report-heading"><div><span className="eyebrow">PANORAMA DE VENDAS</span><h2 id="vendas-title">Movimento dos últimos meses</h2><p>Valores calculados a partir dos seus pedidos, sem cancelamentos.</p></div><div className="period-switch" aria-label="Período do gráfico"><button type="button" className={meses === 6 ? 'active' : ''} aria-pressed={meses === 6} onClick={() => setMeses(6)}>6 meses</button><button type="button" className={meses === 12 ? 'active' : ''} aria-pressed={meses === 12} onClick={() => setMeses(12)}>12 meses</button></div></div>
        <div className="report-body">
          <div className="sales-chart" role="img" aria-label={serie.map((m) => `${m.legenda} ${m.chave.slice(0, 4)}: ${money(m.total)}`).join('; ')}>
            <div className="sales-chart-grid" aria-hidden="true"><span/><span/><span/><span/></div>
            {serie.map((item, index) => <div className="sales-column" key={item.chave} title={`${item.chave}: ${money(item.total)} em ${item.pedidos} pedidos`} style={{ animationDelay: `${index * 35}ms` }}><span className="sales-value">{item.total > 0 ? money(item.total) : ''}</span><div className="sales-track"><div className="sales-fill" style={{ height: `${item.total === 0 ? 3 : Math.max(7, 100 * item.total / maiorMes)}%` }}/></div><span className="sales-month">{item.legenda}</span></div>)}
          </div>
          <div className="month-sheet"><div className="sheet-heading"><ClipboardList size={16}/><strong>Resumo mensal</strong></div><table><thead><tr><th>Mês</th><th>Pedidos</th><th>Total</th></tr></thead><tbody>{[...serie].slice(-4).reverse().map((mes) => <tr key={mes.chave}><td>{mes.legenda} / {mes.chave.slice(2, 4)}</td><td>{mes.pedidos}</td><td>{money(mes.total)}</td></tr>)}</tbody></table><Link to="/pedidos" className="sheet-link">Consultar pedidos <ArrowRight size={15}/></Link></div>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="card dashboard-status"><div className="section-title-row"><div><span className="eyebrow">ACOMPANHAMENTO</span><h2>Pedidos por status</h2><p>Quantidade e valor em cada etapa.</p></div><span className="section-round-icon"><ClipboardList size={20}/></span></div>
          <div className="status-summary">{summary.porStatus.map((s) => <div className="status-summary-row" key={s.status}><div className="status-summary-label"><StatusBadge status={s.status}/><span className="status-summary-count">{s.quantidade} {s.quantidade === 1 ? 'pedido' : 'pedidos'}</span></div><strong>{money(s.valor)}</strong><div className="status-progress" aria-hidden="true"><span className={`status-progress-bar bar-${s.status}`} style={{ width: `${100 * s.quantidade / maiorStatus}%` }}/></div></div>)}</div>
          <Link className="text-link" to="/pedidos">Ver todos os pedidos <ArrowRight size={16}/></Link>
        </section>
        <section className="card dashboard-top"><div className="section-title-row"><div><span className="eyebrow">RELACIONAMENTO</span><h2>Top 3 clientes</h2><p>Quem mais comprou, sem pedidos cancelados.</p></div><span className="section-round-icon yellow"><Crown size={20}/></span></div>
          {top.length === 0 ? <EmptyState title="Sem clientes ainda" message="Cadastre o primeiro cliente para acompanhar o ranking." /> : <div className="leaderboard">{top.map((item, i) => <Link key={String(item.cliente.id)} to={`/clientes/${item.cliente.id}`} className="leaderboard-row"><span className={`rank rank-${i + 1}`}>{String(i + 1).padStart(2, '0')}</span><span className="client-avatar">{item.cliente.nome.charAt(0).toUpperCase()}</span><span className="leaderboard-name"><strong>{item.cliente.nome}</strong><small>{item.cliente.empresa || item.cliente.email}</small></span><span className="leaderboard-value">{money(item.total)}</span><ArrowUpRight size={16}/></Link>)}</div>}
        </section>
      </div>
      <section className="action-banner"><div className="action-banner-icon"><UsersRound size={26}/></div><div><h3>Faz tempo que você não fala com alguém?</h3><p>Deixe os contatos em dia e mantenha o histórico de cada conversa organizado.</p></div><Link to="/clientes" className="btn banner-button">Ver meus clientes <ArrowRight size={17}/></Link></section>
    </>}
  </>;
}
