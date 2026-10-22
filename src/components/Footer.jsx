import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" className="logo">Cyrano</Link>
          <p>La marketplace mode du Gabon. Achète, vends et fais-toi livrer en toute confiance.</p>
          <p style={{ marginTop: 10 }}>📍 Libreville · 🇬🇦 Gabon</p>
        </div>
        <div>
          <h3>Explorer</h3>
          <Link to="/catalogue">Catalogue</Link>
          <Link to="/catalogue?cat=Homme">Homme</Link>
          <Link to="/catalogue?cat=Femme">Femme</Link>
          <Link to="/catalogue?cat=Accessoires">Accessoires</Link>
        </div>
        <div>
          <h3>Vendre</h3>
          <Link to="/register">Devenir vendeur</Link>
          <Link to="/espace-vendeur">Mon espace</Link>
          <Link to="/dashboard">Administration</Link>
        </div>
        <div>
          <h3>Aide</h3>
          <Link to="/suivi">Suivre ma commande</Link>
          <Link to="/messages">Nous contacter</Link>
          <Link to="/profil">Mon compte</Link>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} Cyrano — Paiement mobile Airtel &amp; Moov · Livraison suivie · Protection acheteur
      </div>
    </footer>
  );
}
