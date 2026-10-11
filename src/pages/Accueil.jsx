import { Link } from "react-router-dom";

const produits = [
  { id: 1, nom: "Chemise élégante", prix: "15 000", img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&h=300&fit=crop" },
  { id: 2, nom: "Robe fleurie", prix: "22 000", img: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=300&fit=crop" },
  { id: 3, nom: "Montre connectée", prix: "35 000", img: "https://images.unsplash.com/photo-1546868871-af0de0ae72ba?w=300&h=300&fit=crop" },
  { id: 4, nom: "Sac à main", prix: "25 000", img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&h=300&fit=crop" },
];

const categories = [
  { nom: "Homme", img: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=400&fit=crop", count: "45 articles" },
  { nom: "Femme", img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop", count: "38 articles" },
  { nom: "Accessoires", img: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400&h=400&fit=crop", count: "24 articles" },
];

const avis = [
  { nom: "Alice M.", note: "★★★★★", texte: "Commande reçue en 48h ! Produit conforme, je recommande." },
  { nom: "Jean K.", note: "★★★★★", texte: "Enfin une plateforme locale qui fonctionne. Paiement mobile simple et rapide." },
  { nom: "Sarah B.", note: "★★★★☆", texte: "Beau catalogue et service client réactif. Je suis conquise." },
];

function Accueil() {
  return (
    <div className="accueil">
      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-circle c1" />
          <div className="hero-circle c2" />
          <div className="hero-circle c3" />
        </div>
        <div className="hero-content">
          <span className="hero-badge">🔥 Nouvelle collection été 2026</span>
          <h1>
            La mode <span className="gradient-text">africaine</span>
            <br />à portée de clic
          </h1>
          <p>Achète et vends des articles de mode en toute sécurité. Paiement mobile, livraison suivie.</p>
          <div className="hero-actions">
            <Link to="/catalogue" className="btn-primary btn-lg">Explorer le catalogue</Link>
            <Link to="/register" className="btn-secondary btn-lg">Créer un compte</Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><strong>500+</strong> Produits</div>
            <div className="hero-stat"><strong>1 200+</strong> Clients</div>
            <div className="hero-stat"><strong>98%</strong> Satisfaits</div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="cat-section">
        <h2>Nos catégories</h2>
        <div className="cat-grid">
          {categories.map((cat) => (
            <Link key={cat.nom} to="/catalogue" className="cat-card">
              <img src={cat.img} alt={cat.nom} />
              <div className="cat-overlay">
                <h3>{cat.nom}</h3>
                <span>{cat.count}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PRODUITS POPULAIRES */}
      <section className="pop-section">
        <div className="section-header">
          <h2>Produits populaires</h2>
          <Link to="/catalogue" className="btn-secondary">Voir tout →</Link>
        </div>
        <div className="pop-grid">
          {produits.map((p) => (
            <Link key={p.id} to="/catalogue" className="pop-card">
              <div className="pop-img">
                <img src={p.img} alt={p.nom} loading="lazy" />
              </div>
              <div className="pop-body">
                <h4>{p.nom}</h4>
                <p className="pop-price">{p.prix} FCFA</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AVIS */}
      <section className="avis-section">
        <h2>Ce qu'ils disent</h2>
        <div className="avis-grid">
          {avis.map((a, i) => (
            <div key={i} className="avis-card">
              <span className="avis-note">{a.note}</span>
              <p className="avis-texte">"{a.texte}"</p>
              <p className="avis-nom">— {a.nom}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <h2>Prêt à rejoindre Cyrano ?</h2>
          <p>Inscris-toi gratuitement et commence à acheter ou vendre dès aujourd'hui.</p>
          <div className="hero-actions">
            <Link to="/register" className="btn-primary btn-lg">S'inscrire gratuitement</Link>
            <Link to="/catalogue" className="btn-secondary btn-lg">Voir le catalogue</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Accueil;
