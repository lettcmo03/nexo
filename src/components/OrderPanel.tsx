import { useState, type FormEvent } from 'react';
import { CirclePlus, Pencil, ReceiptText, Save, Trash2, X } from 'lucide-react';
import { api, friendlyError } from '../lib/api';
import { dataFormatada, dataRegistro, money, totalPedido, validarItens } from '../lib/utils';
import { EmptyState, FormField, Notice, StatusBadge } from './UI';
import type { Id, ItemPedido, Pedido, PedidoStatus } from '../types';

const novoItem = (): ItemPedido => ({ titulo: '', preco: 0, quantidade: 1 });

function ItemsEditor({ initial, onCancel, onSave }: {
  initial: ItemPedido[]; onCancel: () => void; onSave: (itens: ItemPedido[]) => Promise<void>;
}) {
  const [itens, setItens] = useState<ItemPedido[]>(initial.map((item) => ({ ...item })));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  function change(index: number, key: keyof ItemPedido, value: string) {
    setItens((prev) => prev.map((item, i) => i === index
      ? { ...item, [key]: key === 'titulo' ? value : value === '' ? NaN : Number(value) } : item));
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null);
    const validation = validarItens(itens);
    if (validation) { setError(validation); return; }
    setBusy(true);
    try { await onSave(itens.map((item) => ({ titulo: item.titulo.trim(), preco: item.preco, quantidade: item.quantidade }))); }
    catch (e) { setError(friendlyError(e)); }
    finally { setBusy(false); }
  }
  return <form className="inline-form" onSubmit={submit} noValidate>
    <div className="inline-form-title"><strong>Itens do pedido</strong><span>Preencha título, preço e quantidade de cada item.</span></div>
    {itens.map((item, index) => <div className="item-editor-row" key={index}>
      <div className="item-editor-heading">Item {index + 1}<button type="button" aria-label={`Remover item ${index + 1}`} onClick={() => setItens((list) => list.filter((_, i) => i !== index))} className="text-danger" disabled={busy}><Trash2 size={15}/> Remover</button></div>
      <div className="item-editor-fields"><FormField label="Título" htmlFor={`titulo-${index}`} required><input id={`titulo-${index}`} type="text" placeholder="Ex.: Consultoria" value={item.titulo} onChange={(e) => change(index, 'titulo', e.target.value)} disabled={busy}/></FormField>
      <FormField label="Preço (R$)" htmlFor={`preco-${index}`} required><input id={`preco-${index}`} type="number" min="0" step="0.01" inputMode="decimal" value={Number.isNaN(item.preco) ? '' : item.preco} onChange={(e) => change(index, 'preco', e.target.value)} disabled={busy}/></FormField>
      <FormField label="Quantidade" htmlFor={`quantidade-${index}`} required><input id={`quantidade-${index}`} type="number" min="1" step="1" inputMode="numeric" value={Number.isNaN(item.quantidade) ? '' : item.quantidade} onChange={(e) => change(index, 'quantidade', e.target.value)} disabled={busy}/></FormField></div>
    </div>)}
    <div className="inline-form-bottom"><button type="button" className="btn secondary small" onClick={() => setItens((prev) => [...prev, novoItem()])} disabled={busy}><CirclePlus size={16}/> Adicionar item</button><div className="order-editor-total">Total calculado: <strong>{money(itens.some((item) => !Number.isFinite(item.preco) || !Number.isFinite(item.quantidade)) ? 0 : totalPedido({ itens }))}</strong></div></div>
    <Notice message={error}/>
    <div className="inline-form-actions"><button type="button" className="btn secondary" onClick={onCancel} disabled={busy}>Cancelar</button><button type="submit" className="btn primary" disabled={busy}><Save size={16}/>{busy ? 'Salvando...' : 'Salvar pedido'}</button></div>
  </form>;
}

export default function OrderPanel({ clienteId, pedidos, onChanged }: {
  clienteId: Id; pedidos: Pedido[]; onChanged: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const ordered = [...pedidos].sort((a, b) => {
    const aDate = new Date(dataRegistro(a) || '').getTime() || 0;
    const bDate = new Date(dataRegistro(b) || '').getTime() || 0;
    return bDate - aDate;
  });

  async function create(itens: ItemPedido[]) {
    await api.criarPedido(clienteId, itens);
    setCreating(false); onChanged();
  }
  async function update(id: Id, itens: ItemPedido[]) {
    await api.editarItens(id, itens);
    setEditingId(null); onChanged();
  }
  async function status(id: Id, next: PedidoStatus) {
    setError(null); setBusyId(String(id));
    try { await api.mudarStatus(id, next); onChanged(); }
    catch (e) { setError(friendlyError(e)); }
    finally { setBusyId(null); }
  }
  async function remove(id: Id) {
    if (!window.confirm('Excluir este pedido e todos os seus itens? Esta ação não pode ser desfeita.')) return;
    setError(null); setBusyId(String(id));
    try { await api.excluirPedido(id); onChanged(); }
    catch (e) { setError(friendlyError(e)); }
    finally { setBusyId(null); }
  }
  return <section className="card detail-section" id="pedidos-do-cliente">
    <div className="section-title-row detail-heading"><div><span className="eyebrow">VENDAS & PEDIDOS</span><h2>Pedidos do cliente <span className="heading-count">{pedidos.length}</span></h2><p>Gerencie compras, itens e situações dos pedidos.</p></div><button type="button" className="btn primary" onClick={() => { setCreating((v) => !v); setEditingId(null); }}><CirclePlus size={17}/>{creating ? 'Fechar formulário' : 'Novo pedido'}</button></div>
    <Notice message={error}/>
    {creating && <ItemsEditor key="new" initial={[novoItem()]} onSave={create} onCancel={() => setCreating(false)}/>}
    {ordered.length === 0 ? <EmptyState title="Nenhum pedido registrado" message="Adicione o primeiro pedido deste cliente."/> : <div className="order-list">{ordered.map((pedido) => <article key={String(pedido.id)} className="order-entry">
      <div className="order-entry-top"><div className="order-entry-ident"><div className="order-icon"><ReceiptText size={20}/></div><div><strong>Pedido #{pedido.id}</strong><span>{dataFormatada(dataRegistro(pedido))}</span></div></div><div className="order-entry-values"><StatusBadge status={pedido.status}/><strong>{money(totalPedido(pedido))}</strong></div></div>
      {editingId === String(pedido.id) ? <ItemsEditor key={String(pedido.id)} initial={pedido.itens || []} onSave={(itens) => update(pedido.id, itens)} onCancel={() => setEditingId(null)}/> : <div className="order-items">{(pedido.itens || []).map((item, index) => <div key={index} className="order-item"><span>{item.titulo} <small>×{item.quantidade}</small></span><strong>{money(Number(item.preco) * Number(item.quantidade))}</strong></div>)}{!pedido.itens?.length && <div className="muted">Nenhum item retornado pela API.</div>}</div>}
      <div className="order-entry-actions">
        {pedido.status === 'aberto' && editingId !== String(pedido.id) && <><button className="btn secondary small" type="button" disabled={busyId === String(pedido.id)} onClick={() => { setEditingId(String(pedido.id)); setCreating(false); }}><Pencil size={14}/> Editar itens</button><button type="button" className="btn soft-success small" disabled={busyId === String(pedido.id)} onClick={() => void status(pedido.id, 'pago')}>Marcar como pago</button><button type="button" className="btn soft-danger small" disabled={busyId === String(pedido.id)} onClick={() => void status(pedido.id, 'cancelado')}>Cancelar pedido</button></>}
        {pedido.status === 'pago' && <><span className="small-hint">Itens somente para leitura.</span><button type="button" className="btn soft-danger small" disabled={busyId === String(pedido.id)} onClick={() => void status(pedido.id, 'cancelado')}>Cancelar pedido</button></>}
        {pedido.status === 'cancelado' && <span className="small-hint">Pedido cancelado: somente leitura.</span>}
        <button type="button" className="btn text-danger small remove-order" disabled={busyId === String(pedido.id)} onClick={() => void remove(pedido.id)}><Trash2 size={15}/> Excluir</button>
      </div>
    </article>)}</div>}
    {creating && <button type="button" onClick={() => setCreating(false)} className="subtle-close"><X size={15}/> Fechar cadastro de pedido</button>}
  </section>;
}
