import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
import { logout } from "../store/authSlice";
import toast from "react-hot-toast";

/* Icônes inline (aucune dépendance, cohérentes avec le design system) */
const I = {
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" strokeLinecap="round" /></svg>,
  heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" strokeLinejoin="round" /></svg>,
  chat: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.2-.6L3 21l1.7-5.1A8.4 8.4 0 0 1 3 11.5 8.4 8.4 0 0 1 11.5 3h1A8.4 8.4 0 0 1 21 11.5Z" strokeLinejoin="round" /></svg>,
  bag: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 7h12l1 14H5L6 7Z" strokeLinejoin="round" /><path d="M9 7a3 3 0 0 1 6 0" strokeLinecap="round" /></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" /></svg>,
  menu: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" strokeLinejoin="round" /></svg>,
  grid: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
  shop: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9h16l-1 11H5L4 9Z" strokeLinejoin="round" /><path d="M8 9V7a4 4 0 0 1 8 0v2" strokeLinecap="round" /></svg>,
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 16v-4M12 16V8M16 16v-6" strokeLinecap="round" /></svg>,
};

function Badge({ value, accent }) {
  if (!value) return null;
  return <span className={`badge${accent ? " badge-accent" : ""}`}>{value > 99 ? "99+" : value}</span>;
}

export default function Header() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useSelector((s) => s.auth);
  const role = user?.role;
  const cartCount = useSelector((s) => s.cart.items.reduce((n, i) => n + i.quantity, 0));
  const favCount = useSelector((s) => s.favorites.items.length);
  const msgCount = useSelector((s) => s.messages.conversations.length);

  const [recherche, setRecherche] = useState("");
  const [menuOuvert, setMenuOuvert] = useState(false);

  const lancerRecherche = (e) => {
    e.preventDefault();
    const q = recherche.trim();
    navigate(q ? `/catalogue?q=${encodeURIComponent(q)}` : "/catalogue");
    setMenuOuvert(false);
  };

  const deconnexion = async () => {
    await signOut(auth);
    dispatch(logout());
    toast.success("À bientôt !");
    navigate("/");
  };

  const estAdmin = role === "admin";
  const estVendeur = role === "vendeur";
  const initiale = (user?.nom || user?.email || "?").charAt(0).toUpperCase();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo" aria-label="Cyrano, accueil">Cyrano</Link>

        <form className="header-search" onSubmit={lancerRecherche} role="search">
          {I.search}
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un article, une marque…"
            aria-label="Rechercher dans le catalogue"
          />
        </form>

        <nav className="nav" aria-label="Navigation principale">
          {estAdmin ? (
            <Link to="/dashboard" className="btn-admin">{I.dashboard} Tableau de bord</Link>
          ) : estVendeur ? (
            <Link to="/espace-vendeur" className="btn-admin">{I.shop} Mon espace</Link>
          ) : (
            <>
              <Link to="/favoris" className="nav-link" aria-label="Mes favoris">
                {I.heart}<span className="nav-label">Favoris</span><span className="badge-position"><Badge value={favCount} /></span>
              </Link>
              <Link to="/messages" className="nav-link" aria-label="Messages">
                {I.chat}<span className="nav-label">Messages</span><span className="badge-position"><Badge value={msgCount} /></span>
              </Link>
              <Link to="/panier" className="nav-link" aria-label={`Panier, ${cartCount} article(s)`}>
                {I.bag}<span className="nav-label">Panier</span><span className="badge-position"><Badge value={cartCount} accent /></span>
              </Link>
            </>
          )}

          {user ? (
            <Link to="/profil" className="avatar-chip" title={`${user.nom || user.email} — ${role}`}>
              <span className="avatar" aria-hidden="true">{initiale}</span>
              <span className="avatar-name">{user.nom || user.email}</span>
            </Link>
          ) : (
            <Link to="/login" className="btn-admin">Connexion</Link>
          )}
          {user && (
            <button className="nav-link" onClick={deconnexion} aria-label="Se déconnecter" title="Se déconnecter">
              {I.logout}
            </button>
          )}
        </nav>

        <button
          className="menu-toggle"
          onClick={() => setMenuOuvert((v) => !v)}
          aria-expanded={menuOuvert}
          aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {menuOuvert ? I.close : I.menu}
        </button>
      </div>

      <div
        className={`mobile-menu ${menuOuvert ? "open" : ""}`}
        // Ferme le menu dès qu'un lien ou bouton est activé, sans effet React.
        onClick={(e) => { if (e.target.closest("a,button")) setMenuOuvert(false); }}
      >
        <form onSubmit={lancerRecherche} className="header-search" style={{ display: "flex", maxWidth: "none", marginBottom: 8 }}>
          {I.search}
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un article…"
            aria-label="Rechercher dans le catalogue"
          />
        </form>
        <Link to="/">Accueil</Link>
        <Link to="/catalogue">Catalogue</Link>
        {estAdmin && <Link to="/dashboard">Tableau de bord</Link>}
        {estVendeur && <Link to="/espace-vendeur">Mon espace vendeur</Link>}
        {!estAdmin && !estVendeur && (
          <>
            <Link to="/favoris">Favoris <Badge value={favCount} /></Link>
            <Link to="/messages">Messages <Badge value={msgCount} /></Link>
            <Link to="/panier">Panier <Badge value={cartCount} accent /></Link>
          </>
        )}
        {user ? (
          <>
            <Link to="/profil">{user.nom || user.email}</Link>
            <button onClick={deconnexion}>Se déconnecter</button>
          </>
        ) : (
          <Link to="/login">Se connecter</Link>
        )}
      </div>

      <nav className="bottom-nav" aria-label="Navigation rapide">
        <div className="bottom-nav-inner">
          <Link to="/" className={`bottom-item ${pathname === "/" ? "active" : ""}`}>{I.home}<span>Accueil</span></Link>
          <Link to="/catalogue" className={`bottom-item ${pathname.startsWith("/catalogue") ? "active" : ""}`}>{I.grid}<span>Catalogue</span></Link>
          {estAdmin ? (
            <Link to="/dashboard" className={`bottom-item ${pathname === "/dashboard" ? "active" : ""}`}>{I.dashboard}<span>Admin</span></Link>
          ) : estVendeur ? (
            <Link to="/espace-vendeur" className={`bottom-item ${pathname === "/espace-vendeur" ? "active" : ""}`}>{I.shop}<span>Espace</span></Link>
          ) : (
            <Link to="/favoris" className={`bottom-item ${pathname === "/favoris" ? "active" : ""}`}>{I.heart}<span>Favoris</span><Badge value={favCount} /></Link>
          )}
          {!estAdmin && !estVendeur && (
            <Link to="/panier" className={`bottom-item ${pathname === "/panier" ? "active" : ""}`}>{I.bag}<span>Panier</span><Badge value={cartCount} accent /></Link>
          )}
          <Link to={user ? "/profil" : "/login"} className={`bottom-item ${pathname === "/profil" ? "active" : ""}`}>{I.user}<span>{user ? "Profil" : "Connexion"}</span></Link>
        </div>
      </nav>
    </header>
  );
}
