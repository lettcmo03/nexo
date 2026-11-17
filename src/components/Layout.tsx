import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpRight, ChartNoAxesCombined, CirclePlus, ClipboardList, LayoutDashboard, LogOut, Menu, Sparkles, UsersRound, X } from 'lucide-react';
import { useAuth, userDisplayName } from '../context/AuthContext';

const links = [
  { to: '/painel', label: 'Painel', icon: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icon: UsersRound },
  { to: '/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/clientes/novo', label: 'Novo cliente', icon: CirclePlus },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const name = userDisplayName(user);
  return (
    <div className="app-shell">
      {open && <button type="button" className="mobile-backdrop" onClick={() => setOpen(false)} aria-label="Fechar menu" />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <Link to="/painel" className="brand" onClick={() => setOpen(false)}>
            <span className="brand-badge">n<span className="brand-dot">.</span></span>
            <span className="brand-text"><strong>nexo</strong><span>SEU ESPAÇO</span></span>
          </Link>
          <button className="icon-only mobile-close" type="button" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={20}/></button>
        </div>
        <div className="sidebar-section-label">NAVEGAÇÃO</div>
        <nav aria-label="Menu principal" className="sidebar-nav">
          {links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setOpen(false)} end={to === '/clientes'} className={({ isActive }) => `side-link ${isActive ? 'selected' : ''}`}><Icon size={19}/><span>{label}</span>{to === '/clientes/novo' && <ArrowUpRight size={14} className="side-arrow" />}</NavLink>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip"><ChartNoAxesCombined size={20}/><strong>Pequenos passos, grandes ideias.</strong><p>Um CRM para cuidar de cada contato.</p></div>
        <div className="sidebar-bottom">
          <div className="avatar">{name.slice(0, 1).toUpperCase()}</div>
          <div className="user-meta"><strong title={name}>{name}</strong><span>Conta conectada</span></div>
          <button type="button" className="icon-only signout" onClick={logout} title="Sair" aria-label="Sair da conta"><LogOut size={18}/></button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button className="icon-only hamburger" aria-label="Abrir menu" onClick={() => setOpen(true)} type="button"><Menu size={22}/></button>
          <div className="breadcrumbs">Nexo <span>/</span> <strong>{links.find((l) => location.pathname === l.to)?.label || (location.pathname.includes('/clientes') ? 'Detalhes do cliente' : 'Nexo CRM')}</strong></div>
          <div className="topbar-right"><span className="topbar-online"/><span className="connection-label">Conectado</span><span className="topbar-name">{name}</span><div className="mini-avatar">{name.charAt(0).toUpperCase()}</div></div>
        </header>
        <main className="content"><Outlet/></main>
        <footer className="footer"><Sparkles size={12}/> NEXO CRM <span>·</span> Feito para organizar o dia a dia</footer>
      </div>
    </div>
  );
}
