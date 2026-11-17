import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ChartNoAxesCombined, Eye, EyeOff, HeartHandshake, LockKeyhole, ShieldCheck, UsersRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { friendlyError } from '../lib/api';
import { FullPageLoader, Notice } from '../components/UI';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const from = typeof location.state?.from === 'string' && location.state.from.startsWith('/')
    && !location.state.from.startsWith('//') ? location.state.from : '/painel';

  if (loading) return <FullPageLoader/>;
  if (user) return <Navigate to={from} replace />;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) { setError('Informe seu usuário e sua senha.'); return; }
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true, state: null });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-layout">
      <div className="login-side">
        <Link to="/login" className="brand login-brand"><span className="brand-badge">n<span className="brand-dot">.</span></span><span className="brand-text"><strong>nexo</strong><span>CRM PLATFORM</span></span></Link>
        <div className="login-graphic" aria-hidden="true"><div className="graphic-ring ring-1"/><div className="graphic-ring ring-2"/><div className="graphic-card gc-1"><UsersRound size={21}/><span>Relacionamentos<br/><strong>mais próximos</strong></span></div><div className="graphic-card gc-2"><ChartNoAxesCombined size={20}/><span>Resultados em<br/><strong>tempo real</strong></span></div><div className="graphic-center"><HeartHandshake size={64}/></div></div>
        <div className="login-side-copy"><span className="eyebrow light">SEU NEGÓCIO MAIS CONECTADO</span><h2>Mais leve para organizar.<br/><em>Mais fácil de acompanhar.</em></h2><p>Clientes, pedidos e conversas reunidos de um jeito simples, no seu ritmo.</p><div className="login-proof"><ShieldCheck size={18}/> Acesso protegido e gestão simplificada</div></div>
      </div>
      <div className="login-content"><div className="login-card">
        <div className="login-mobile-logo"><span className="brand-badge">n.</span><strong>nexo CRM</strong></div>
        <span className="eyebrow">UM LUGAR PARA SE ORGANIZAR</span><h1>Que bom ter você aqui<span>.</span></h1><p className="login-subtitle">Use suas credenciais para acessar o painel de clientes.</p>
        <form onSubmit={submit} noValidate>
          <div className="form-field"><label htmlFor="username">Usuário</label><input id="username" type="text" autoComplete="username" placeholder="Digite seu usuário" value={username} onChange={(e) => setUsername(e.target.value)} disabled={submitting}/></div>
          <div className="form-field"><label htmlFor="password">Senha</label><div className="password-input"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" value={password} onChange={(e) => setPassword(e.target.value)} disabled={submitting}/><button type="button" title={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword((v) => !v)}><span>{showPassword ? <EyeOff size={19}/> : <Eye size={19}/>}</span></button></div></div>
          <Notice message={error}/>
          <button type="submit" className="btn primary login-submit" disabled={submitting}>{submitting ? 'Entrando...' : 'Acessar painel'}<ArrowRight size={19}/></button>
        </form>
        <div className="login-demo"><LockKeyhole size={18}/><span><strong>Conta de teste</strong><br/>Usuário: <code>emilys</code> · Senha: <code>emilyspass</code></span></div>
        <div className="login-foot">© 2026 Nexo CRM · Projeto acadêmico</div>
      </div></div>
    </div>
  );
}
