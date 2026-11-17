import { useState, type FormEvent } from 'react';
import { MessageSquareText, Pencil, PlusCircle, Save, Trash2 } from 'lucide-react';
import { api, friendlyError } from '../lib/api';
import { canalNormalizado, dataHoraFormatada, dataRegistro, rotuloCanal } from '../lib/utils';
import { EmptyState, FormField, Notice } from './UI';
import type { Atendimento, Canal, Id } from '../types';

const canais: Canal[] = ['telefone', 'email', 'whatsapp', 'presencial'];
type FormDataHistory = { titulo: string; texto: string; canal: Canal };
const vazio: FormDataHistory = { titulo: '', texto: '', canal: 'telefone' };

function HistoryEditor({ initial, onSave, onCancel }: { initial: FormDataHistory; onSave: (data: FormDataHistory) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<FormDataHistory>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(null);
    if (!form.titulo.trim()) { setError('Informe o título do atendimento.'); return; }
    if (!form.texto.trim()) { setError('Informe o texto do atendimento.'); return; }
    if (!canais.includes(form.canal)) { setError('Selecione um canal válido.'); return; }
    setBusy(true);
    try { await onSave({ titulo: form.titulo.trim(), texto: form.texto.trim(), canal: form.canal }); }
    catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }
  return <form className="inline-form history-form" onSubmit={submit} noValidate><div className="form-grid"><FormField label="Título" htmlFor="history-title" required><input id="history-title" placeholder="Ex.: Ligação de acompanhamento" value={form.titulo} onChange={(e) => setForm((v) => ({ ...v, titulo: e.target.value }))} disabled={busy}/></FormField><FormField label="Canal" htmlFor="history-channel" required><select id="history-channel" value={form.canal} onChange={(e) => setForm((v) => ({ ...v, canal: e.target.value as Canal }))} disabled={busy}>{canais.map((c) => <option key={c} value={c}>{rotuloCanal(c)}</option>)}</select></FormField><div className="grid-span-2"><FormField label="Descrição do atendimento" htmlFor="history-text" required><textarea id="history-text" placeholder="Conte o que foi conversado com o cliente..." rows={4} value={form.texto} onChange={(e) => setForm((v) => ({ ...v, texto: e.target.value }))} disabled={busy}/></FormField></div></div><Notice message={error}/><div className="inline-form-actions"><button className="btn secondary" type="button" disabled={busy} onClick={onCancel}>Cancelar</button><button className="btn primary" type="submit" disabled={busy}><Save size={16}/>{busy ? 'Salvando...' : 'Salvar atendimento'}</button></div></form>;
}

export default function HistoryPanel({ clienteId, atendimentos, onChanged }: {
  clienteId: Id; atendimentos: Atendimento[]; onChanged: () => void;
}) {
  const [filter, setFilter] = useState<'todos' | Canal>('todos');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const filtered = atendimentos.filter((a) => filter === 'todos' || canalNormalizado(a.canal) === filter)
    .sort((a, b) => new Date(dataRegistro(b) || '').getTime() - new Date(dataRegistro(a) || '').getTime());

  async function create(data: FormDataHistory) {
    await api.criarAtendimento(clienteId, data.titulo, data.texto, data.canal);
    setCreating(false); onChanged();
  }
  async function update(id: Id, data: FormDataHistory) {
    await api.editarAtendimento(id, data.titulo, data.texto, data.canal);
    setEditingId(null); onChanged();
  }
  async function remove(id: Id) {
    if (!window.confirm('Excluir este atendimento do histórico? Esta ação não pode ser desfeita.')) return;
    setError(null); setBusyId(String(id));
    try { await api.excluirAtendimento(id); onChanged(); }
    catch (e) { setError(friendlyError(e)); }
    finally { setBusyId(null); }
  }
  return <section className="card detail-section" id="historico"><div className="section-title-row detail-heading"><div><span className="eyebrow">JORNADA DO CLIENTE</span><h2>Histórico de atendimento</h2><p>Registre ligações, e-mails e conversas.</p></div><button className="btn primary" type="button" onClick={() => { setCreating((v) => !v); setEditingId(null); }}><PlusCircle size={17}/>{creating ? 'Fechar formulário' : 'Novo atendimento'}</button></div>
    {creating && <HistoryEditor key="new" initial={vazio} onSave={create} onCancel={() => setCreating(false)}/>}
    <div className="history-toolbar"><div className="history-count"><strong>{filtered.length}</strong> {filtered.length === 1 ? 'atendimento' : 'atendimentos'}</div><div className="filter-select"><label htmlFor="history-filter">Filtrar canal</label><select id="history-filter" value={filter} onChange={(e) => setFilter(e.target.value as 'todos' | Canal)}><option value="todos">Todos os canais</option>{canais.map((c) => <option key={c} value={c}>{rotuloCanal(c)}</option>)}</select></div></div>
    <Notice message={error}/>
    {filtered.length === 0 ? <EmptyState title="Nenhum atendimento encontrado" message={filter !== 'todos' ? 'Não há registros nesse canal.' : 'Registre o primeiro contato com este cliente.'} /> : <div className="history-list">{filtered.map((item) => <article className="history-row" key={String(item.id)}><div className="history-icon"><MessageSquareText size={18}/></div><div className="history-content"><div className="history-top"><strong>{item.titulo}</strong><span className="channel-badge">{rotuloCanal(item.canal)}</span></div><div className="history-date">{dataHoraFormatada(dataRegistro(item))}</div>{editingId === String(item.id) ? <HistoryEditor key={String(item.id)} initial={{ titulo: item.titulo, texto: item.texto, canal: canalNormalizado(item.canal) as Canal }} onSave={(data) => update(item.id, data)} onCancel={() => setEditingId(null)}/> : <p>{item.texto}</p>}<div className="history-actions"><button type="button" disabled={busyId === String(item.id)} className="link-button" onClick={() => setEditingId(String(item.id))}><Pencil size={14}/> Editar</button><button type="button" disabled={busyId === String(item.id)} className="link-button text-danger" onClick={() => void remove(item.id)}><Trash2 size={14}/> Excluir</button></div></div></article>)}</div>}
  </section>;
}
