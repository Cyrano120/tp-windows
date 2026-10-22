import { Link } from "react-router-dom";
import ArticleCard from "../components/ArticleCard";
import { PRODUITS, normaliserProduit } from "../data/catalogue";

const AVIS = [
  { nom: "Alice M.", note: "★★★★★", texte: "Commande reçue en 48h ! Produit conforme, je recommande." },
  { nom: "Jean K.", note: "★★★★★", texte: "Enfin une plateforme locale qui fonctionne. Paiement mobile simple et rapide." },
  { nom: "Sarah B.", note: "★★★★☆", texte: "Beau catalogue et service client réactif. Je suis conquise." },
];

const CATEGORIES = [
  { nom: "Homme", image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=700&h=700&fit=crop" },
  { nom: "Femme", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=700&h=700&fit=crop" },
  { nom: "Accessoires", image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=700&h=700&fit=crop" },
];

const ETAPES = [
  { titre: "Trouve ta pièce", texte: "Parcours le catalogue, filtre par catégorie, taille ou budget." },
  { titre: "Négocie ou achète", texte: "Fais une offre au vendeur ou ajoute directement au panier." },
  { titre: "Reçois chez toi", texte: "Paiement mobile, livraison suivie et protection acheteur." },
];

export default function Accueil() {
  const produits = PRODUITS.map(normaliserProduit);
  const nouveautes = produits.slice(0, 8);
  const compteurs = produits.reduce((acc, p) => {
    acc[p.categorie] = (acc[p.categorie] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="accueil">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">🇬🇦 La marketplace mode du Gabon</span>
          <h1>Achète et vends <span className="gradient-text">seconde main</span> en toute confiance.</h1>
          <p>Des pièces uniques, des vendeurs vérifiés et une livraison suivie partout au Gabon. Donne une seconde vie à ton dressing.</p>
          <div className="hero-actions">
            <Link to="/catalogue" className="btn-primary btn-lg">Explorer le catalogue</Link>
            <Link to="/register" className="btn-secondary btn-lg">Vendre un article</Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><strong>{produits.length}+</strong>articles en ligne</div>
            <div className="hero-stat"><strong>4,8/5</strong>note moyenne</div>
            <div className="hero-stat"><strong>48h</strong>livraison locale</div>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-tile t1"><img src={produits[1]?.image} alt="" /></div>
          <div className="hero-tile t2"><img src={produits[7]?.image} alt="" /></div>
          <div className="hero-tile t3"><img src={produits[4]?.image} alt="" /></div>
          <div className="hero-float"><span>🛡️</span> Protection acheteur incluse</div>
        </div>
      </section>

      <section className="cat-section">
        <div className="section-header">
          <div>
            <h2>Explore par catégorie</h2>
            <p>Des looks pour tous les styles, à petits prix.</p>
          </div>
          <Link to="/catalogue" className="btn-secondary btn-sm">Tout voir</Link>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map((cat) => (
            <Link key={cat.nom} to={`/catalogue?cat=${cat.nom}`} className="cat-card">
              <img src={cat.image} alt={cat.nom} loading="lazy" />
              <div className="cat-overlay">
                <h3>{cat.nom}</h3>
                <span>{compteurs[cat.nom] || 0} articles</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="pop-section">
        <div className="section-header">
          <div>
            <h2>Nouveautés</h2>
            <p>Les dernières pièces ajoutées par nos vendeurs.</p>
          </div>
          <Link to="/catalogue?tri=nouveaux" className="btn-secondary btn-sm">Voir plus</Link>
        </div>
        <div className="products-grid">
          {nouveautes.map((produit) => <ArticleCard key={produit.id} produit={produit} />)}
        </div>
      </section>

      <section className="how-section">
        <div className="section-header">
          <div>
            <h2>Comment ça marche ?</h2>
            <p>Trois étapes, zéro complication.</p>
          </div>
        </div>
        <div className="how-grid">
          {ETAPES.map((etape, i) => (
            <div key={etape.titre} className="how-card">
              <div className="how-step">{i + 1}</div>
              <h3>{etape.titre}</h3>
              <p>{etape.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="avis-section">
        <div className="section-header">
          <div>
            <h2>Ils nous font confiance</h2>
            <p>Les avis de la communauté Cyrano.</p>
          </div>
        </div>
        <div className="avis-grid">
          {AVIS.map((avis) => (
            <div key={avis.nom} className="avis-card">
              <span className="avis-note">{avis.note}</span>
              <p className="avis-texte">« {avis.texte} »</p>
              <span className="avis-nom">{avis.nom}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-card">
          <h2>Ton dressing peut rapporter gros.</h2>
          <p>Ouvre ta boutique en 2 minutes, gratuitement. Tu fixes tes prix, on s'occupe du reste.</p>
          <div className="hero-actions">
            <Link to="/register" className="btn-primary btn-lg">Devenir vendeur</Link>
            <Link to="/catalogue" className="btn-secondary btn-lg">Voir le catalogue</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
