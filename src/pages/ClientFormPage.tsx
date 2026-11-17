import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Check, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { api, ApiError, friendlyError } from '../lib/api';
import { useData } from '../context/DataContext';
import { ErrorState, FormField, Notice, PageTitle, Spinner } from '../components/UI';
import type { ClientePayload } from '../types';

const inicial: ClientePayload = { nome: '', email: '', telefone: '', empresa: '', cidade: '' };

function validar(dados: ClientePayload): string | null {
  if (!dados.nome.trim()) return 'Preencha o nome do cliente.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim())) return 'Digite um endereço de e-mail válido.';
  const extras = [dados.telefone, dados.empresa, dados.cidade].filter((v) => Boolean(v?.trim())).length;
  if (extras < 2) return 'Preencha pelo menos 2 campos entre telefone, empresa e cidade.';
  return null;
}

export default function ClientFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { refresh } = useData();
  const [form, setForm] = useState<ClientePayload>(inicial);
  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    let active = true;
    async function load() {
      setLoading(true); setLoadError(null); setNotFound(false);
      try {
        const cliente = await api.cliente(id!);
        if (active) setForm({ nome: cliente.nome || '', email: cliente.email || '', telefone: cliente.telefone || '', empresa: cliente.empresa || '', cidade: cliente.cidade || '' });
      } catch (e) {
        if (active) { if (e instanceof ApiError && e.status === 404) setNotFound(true); else setLoadError(friendlyError(e)); }
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [id, retry]);

  function update(field: keyof ClientePayload, value: string) { setForm((old) => ({ ...old, [field]: value })); }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null);
    const payload: ClientePayload = {
      nome: form.nome.trim(), email: form.email.trim().toLowerCase(),
      telefone: form.telefone?.trim(), empresa: form.empresa?.trim(), cidade: form.cidade?.trim(),
    };
    const msg = validar(payload);
    if (msg) { setError(msg); return; }
    setBusy(true);
    try {
      if (isEdit) await api.editarCliente(id!, payload);
      else await api.criarCliente(payload);
      refresh();
      navigate(isEdit ? `/clientes/${id}` : '/clientes', { replace: true });
    } catch (err) { setError(friendlyError(err)); }
    finally { setBusy(false); }
  }

  return <>
    <Link to={isEdit ? `/clientes/${id}` : '/clientes'} className="back-link"><ArrowLeft size={16}/> Voltar para clientes</Link>
    <PageTitle eyebrow="CADASTRO DE CLIENTES" title={isEdit ? 'Editar cliente' : 'Novo cliente'} subtitle={isEdit ? 'Mantenha os dados deste contato atualizados.' : 'Preencha as informações para iniciar um novo relacionamento.'}/>
    {loading ? <div className="card loading-card"><Spinner label="Carregando cadastro..."/></div> : notFound ? <div className="card state-box"><h2>Cliente não encontrado</h2><p>O cliente solicitado não existe ou foi excluído.</p><Link className="btn primary" to="/clientes">Voltar para a lista</Link></div> : loadError ? <ErrorState message={loadError} onRetry={() => setRetry((x) => x + 1)}/> : <form className="form-card card" onSubmit={save} noValidate>
      <div className="form-card-header"><span className="form-step">01</span><div><h2>Informações do cliente</h2><p>Os campos com * são obrigatórios. Informe também pelo menos 2 entre telefone, empresa e cidade.</p></div></div>
      <div className="form-grid">
        <FormField label="Nome completo" htmlFor="nome" required><div className="input-with-icon"><UserRound size={17}/><input id="nome" placeholder="Ex.: Ana Carolina" maxLength={140} value={form.nome} onChange={(e) => update('nome', e.target.value)} disabled={busy}/></div></FormField>
        <FormField label="E-mail" htmlFor="email" required><div className="input-with-icon"><Mail size={17}/><input id="email" type="email" placeholder="cliente@email.com" value={form.email} onChange={(e) => update('email', e.target.value)} disabled={busy}/></div></FormField>
        <FormField label="Telefone" htmlFor="telefone"><div className="input-with-icon"><Phone size={17}/><input id="telefone" type="tel" placeholder="(21) 99999-9999" value={form.telefone || ''} onChange={(e) => update('telefone', e.target.value)} disabled={busy}/></div></FormField>
        <FormField label="Empresa" htmlFor="empresa"><div className="input-with-icon"><Building2 size={17}/><input id="empresa" placeholder="Nome da empresa" value={form.empresa || ''} onChange={(e) => update('empresa', e.target.value)} disabled={busy}/></div></FormField>
        <FormField label="Cidade" htmlFor="cidade"><div className="input-with-icon"><MapPin size={17}/><input id="cidade" placeholder="Ex.: Saquarema" value={form.cidade || ''} onChange={(e) => update('cidade', e.target.value)} disabled={busy}/></div></FormField>
      </div>
      <Notice message={error}/>
      <div className="form-actions"><Link to={isEdit ? `/clientes/${id}` : '/clientes'} className="btn secondary">Cancelar</Link><button type="submit" disabled={busy} className="btn primary"><Check size={18}/>{busy ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}</button></div>
    </form>}
  </>;
}
