import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, MapPin, Pencil, Phone, Trash2, UserRound } from 'lucide-react';
import { api, ApiError, friendlyError } from '../lib/api';
import { money, seloCliente, totalComprado } from '../lib/utils';
import { useData } from '../context/DataContext';
import { ClientBadge, ErrorState, Notice, PageTitle, Spinner } from '../components/UI';
import OrderPanel from '../components/OrderPanel';
import HistoryPanel from '../components/HistoryPanel';
import type { Atendimento, Cliente, Pedido } from '../types';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { version, refresh } = useData();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    async function load() {
      setLoading(true); setError(null); setNotFound(false);
      try {
        // Detalhe primeiro: evita chamadas extras se o cliente já foi excluído.
        const client = await api.cliente(id!);
        const [orders, history] = await Promise.all([api.pedidosCliente(id!), api.atendimentosCliente(id!)]);
        if (active) { setCliente(client); setPedidos(orders); setAtendimentos(history); }
      } catch (e) {
        if (active) {
          if (e instanceof ApiError && e.status === 404) setNotFound(true);
          else setError(friendlyError(e));
        }
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [id, version, retry]);

  async function excluirCliente() {
    if (!id || !cliente) return;
    const ok = window.confirm(`Excluir ${cliente.nome}?\n\n${pedidos.length} pedido(s) e ${atendimentos.length} atendimento(s) também serão apagados.\n\nEsta ação não pode ser desfeita.`);
    if (!ok) return;
    setDeleting(true); setActionError(null);
    try {
      await api.excluirCliente(id);
      refresh(); navigate('/clientes', { replace: true });
    } catch (e) { setActionError(friendlyError(e)); }
    finally { setDeleting(false); }
  }

  if (!id) return null;
  if (loading) return <div className="card loading-card"><Spinner label="Carregando informações do cliente..."/></div>;
  if (notFound) return <div className="not-found-page"><div className="not-found-code">404</div><h1>Cliente não encontrado</h1><p>Não existe um cliente cadastrado com o código {id}.</p><Link className="btn primary" to="/clientes"><ArrowLeft size={18}/> Voltar para a lista</Link></div>;
  if (error || !cliente) return <ErrorState message={error || 'Não foi possível consultar esse cliente.'} onRetry={() => setRetry((r) => r + 1)}/>;

  return <>
    <Link to="/clientes" className="back-link"><ArrowLeft size={16}/> Voltar para clientes</Link>
    <PageTitle eyebrow="PERFIL DO CLIENTE" title={cliente.nome} subtitle="Acompanhe os dados, compras e todo o histórico de relacionamento." action={<div className="page-actions"><Link className="btn secondary" to={`/clientes/${id}/editar`}><Pencil size={16}/> Editar</Link><button type="button" className="btn danger-outline" onClick={() => void excluirCliente()} disabled={deleting}><Trash2 size={16}/>{deleting ? 'Excluindo...' : 'Excluir'}</button></div>}/>
    <Notice message={actionError}/>
    <div className="profile-grid"><section className="card profile-card"><div className="profile-top"><div className="profile-avatar">{cliente.nome.charAt(0).toUpperCase()}</div><div><h2>{cliente.nome}</h2><span>ID #{cliente.id}</span></div><ClientBadge badge={seloCliente(pedidos.map((p) => ({ ...p, clienteId: id })), id)}/></div><div className="profile-fields"><div><Mail size={18}/><span><small>E-mail</small><strong>{cliente.email}</strong></span></div><div><Phone size={18}/><span><small>Telefone</small><strong>{cliente.telefone || 'Não informado'}</strong></span></div><div><Building2 size={18}/><span><small>Empresa</small><strong>{cliente.empresa || 'Não informada'}</strong></span></div><div><MapPin size={18}/><span><small>Cidade</small><strong>{cliente.cidade || 'Não informada'}</strong></span></div></div></section>
      <section className="card profile-summary"><span className="eyebrow">RESUMO DO CLIENTE</span><div className="profile-summary-amount">{money(totalComprado(pedidos.map((p) => ({ ...p, clienteId: id })), id))}</div><p>Valor comprado (sem cancelados)</p><div className="profile-mini-stats"><div><strong>{pedidos.length}</strong><span>Pedidos</span></div><div><strong>{atendimentos.length}</strong><span>Atendimentos</span></div><div><strong>{pedidos.filter((p) => p.status === 'pago').length}</strong><span>Pagos</span></div></div><div className="profile-summary-footer"><UserRound size={19}/> Tudo sobre este contato em um só lugar.</div></section></div>
    <OrderPanel clienteId={id} pedidos={pedidos} onChanged={refresh}/>
    <HistoryPanel clienteId={id} atendimentos={atendimentos} onChanged={refresh}/>
  </>;
}
