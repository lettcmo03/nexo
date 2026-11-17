import { ArrowLeft, Home, SearchX } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return <div className="not-found-page"><div className="not-found-art"><SearchX size={48}/></div><div className="not-found-code">404</div><h1>Página não encontrada</h1><p>O endereço que você tentou acessar não existe. Volte para o seu painel e continue de onde parou.</p><div className="actions-center"><Link className="btn primary" to="/painel"><Home size={18}/> Ir para o Painel</Link><Link className="btn secondary" to="/clientes"><ArrowLeft size={18}/> Ver clientes</Link></div></div>;
}
