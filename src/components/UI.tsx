import { AlertCircle, ArrowRight, LoaderCircle, RefreshCcw, SearchX } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PedidoStatus } from '../types';
import { rotuloStatus } from '../lib/utils';

export function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return <div className="loading-inline" role="status"><LoaderCircle size={21} className="spin" /> {label}</div>;
}

export function FullPageLoader() {
  return <div className="fullpage-loader"><div className="brand-badge">n</div><Spinner label="Preparando seu CRM..." /></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state-box error-state" role="alert">
      <AlertCircle size={25} />
      <strong>Não foi possível carregar</strong>
      <p>{message}</p>
      {onRetry && <button className="btn secondary" onClick={onRetry} type="button"><RefreshCcw size={16} /> Tentar novamente</button>}
    </div>
  );
}

export function EmptyState({ title, message, children }: { title: string; message?: string; children?: ReactNode }) {
  return (
    <div className="state-box"><div className="empty-symbol"><SearchX size={27} /></div><strong>{title}</strong>
      {message && <p>{message}</p>}{children}
    </div>
  );
}

export function Notice({ message, type = 'error' }: { message: string | null; type?: 'error' | 'success' | 'info' }) {
  return message ? <div className={`notice ${type}`} role="alert">{type === 'error' && <AlertCircle size={17} />}<span>{message}</span></div> : null;
}

export function StatusBadge({ status }: { status: PedidoStatus }) {
  return <span className={`status status-${status}`}><span className="status-dot" />{rotuloStatus[status] || status}</span>;
}

export function PageTitle({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="page-heading"><div><span className="eyebrow">{eyebrow || 'GESTÃO INTELIGENTE'}</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action && <div className="heading-action">{action}</div>}</div>;
}

export function ArrowButtonText({ children }: { children: ReactNode }) {
  return <>{children}<ArrowRight size={17}/></>;
}

export function ClientBadge({ badge }: { badge: 'VIP' | 'Regular' | 'Sem compras' }) {
  return <span className={`client-badge ${badge === 'VIP' ? 'vip' : badge === 'Regular' ? 'regular' : 'none'}`}>{badge === 'VIP' ? '✦ ' : ''}{badge}</span>;
}

export function FormField({ label, htmlFor, required = false, children, help }: {
  label: string; htmlFor: string; required?: boolean; children: ReactNode; help?: string;
}) {
  return <div className="form-field"><label htmlFor={htmlFor}>{label}{required && <span className="required"> *</span>}</label>{children}{help && <small>{help}</small>}</div>;
}
