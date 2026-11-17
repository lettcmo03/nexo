import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight, CirclePlus, Mail, MapPin, Search } from 'lucide-react';
import { api, friendlyError } from '../lib/api';
import { money, seloCliente, totalComprado } from '../lib/utils';
import { useData } from '../context/DataContext';
import { ClientBadge, EmptyState, ErrorState, PageTitle, Spinner } from '../components/UI';
import type { Cliente, Pedido } from '../types';

const PAGE_SIZE = 5;
export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const { version } = useData();

  useEffect(() => {
    const timer = window.setTimeout(() => { setQuery(search); setPage(0); }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError(null);
      try {
        const [res, allOrders] = await Promise.all([api.clientes(query, PAGE_SIZE, page * PAGE_SIZE), api.pedidos()]);
        if (active) { setClientes(res.clientes); setTotal(res.total); setOrders(allOrders); }
      } catch (e) { if (active) setError(friendlyError(e)); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [page, query, retry, version]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  function submit(e: FormEvent) { e.preventDefault(); setQuery(search); setPage(0); }
  return <>
    <PageTitle eyebrow="RELACIONAMENTO" title="Clientes" subtitle="Sua base de contatos, organizada em um só lugar." action={<Link className="btn primary" to="/clientes/novo"><CirclePlus size={17}/> Novo cliente</Link>}/>
    <div className="card list-panel"><div className="list-toolbar"><div><h2>Todos os clientes</h2><p>{total} {total === 1 ? 'cliente encontrado' : 'clientes encontrados'}</p></div><form className="search-input" onSubmit={submit}><Search size={18}/><input type="search" aria-label="Pesquisar clientes" placeholder="Buscar nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)}/><button type="submit" aria-label="Buscar"><ArrowRight size={17}/></button></form></div>
      {loading ? <Spinner label="Buscando clientes..." /> : error ? <ErrorState message={error} onRetry={() => setRetry((v) => v + 1)}/> : clientes.length === 0 ? <EmptyState title={query ? 'Nenhum resultado encontrado' : 'Nenhum cliente cadastrado'} message={query ? 'Experimente outra busca por nome ou e-mail.' : 'Cadastre o primeiro contato para começar.'}>{!query && <Link className="btn primary" to="/clientes/novo"><CirclePlus size={17}/> Cadastrar cliente</Link>}</EmptyState> : <div className="client-list">{clientes.map((cliente) => <Link to={`/clientes/${cliente.id}`} key={String(cliente.id)} className="client-row"><span className="client-avatar large">{cliente.nome.charAt(0).toUpperCase()}</span><span className="client-main"><strong>{cliente.nome}</strong><span><Mail size={14}/>{cliente.email}</span><small>{cliente.cidade && <><MapPin size={13}/>{cliente.cidade}</>}{cliente.empresa && <span>{cliente.empresa}</span>}</small></span><span className="client-values"><ClientBadge badge={seloCliente(orders, cliente.id)}/><strong>{money(totalComprado(orders, cliente.id))}</strong></span><ArrowUpRight size={19} className="row-arrow"/></Link>)}</div>}
      {!loading && !error && total > 0 && <div className="pagination"><span>Mostrando {Math.min(page * PAGE_SIZE + 1, total)}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}</span><div><button aria-label="Página anterior" className="btn secondary small" type="button" disabled={page <= 0} onClick={() => setPage((v) => Math.max(0, v - 1))}><ArrowLeft size={17}/></button><span className="page-number">{Math.min(page + 1, totalPages)} / {totalPages}</span><button aria-label="Próxima página" className="btn secondary small" type="button" disabled={page >= totalPages - 1} onClick={() => setPage((v) => v + 1)}><ArrowRight size={17}/></button></div></div>}
    </div>
  </>;
}
