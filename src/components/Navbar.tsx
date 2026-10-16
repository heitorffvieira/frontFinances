import { NavLink } from 'react-router-dom';
import { History, LayoutGrid, Wallet } from 'lucide-react';

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="navbar__brand" aria-label="Finanças — ir para a visão geral">
          <span className="navbar__logo">
            <Wallet size={17} aria-hidden="true" />
          </span>
          <span className="navbar__name">Finanças</span>
        </NavLink>
        <nav className="navbar__nav" aria-label="Principal">
          <NavLink to="/" end className="navbar__link">
            <LayoutGrid size={16} aria-hidden="true" />
            <span>Visão geral</span>
          </NavLink>
          <NavLink to="/historico" className="navbar__link">
            <History size={16} aria-hidden="true" />
            <span>Histórico</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
