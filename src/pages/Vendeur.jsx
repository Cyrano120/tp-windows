import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import ArticleCard from "../components/ArticleCard";
import { PageLoader } from "../components/RequireAuth";
import { PRODUITS, normaliserProduit } from "../data/catalogue";

const VENDEURS_DEMO = {
  "Alice Mode": { ville: "Libreville", inscrit: "2024", ventes: 45, note: 4.8, bio: "Passionnée de mode depuis 10 ans. Je sélectionne des pièces uniques et de qualité." },
  "Style Féminin": { ville: "Port-Gentil", inscrit: "2023", ventes: 78, note: 4.7, bio: "Mode féminine tendance à prix abordables. Nouveautés chaque semaine." },
  "Jean K.": { ville: "Franceville", inscrit: "2025", ventes: 23, note: 4.6, bio: "Collectionneur de jeans vintage. Pièces rares et authentiques." },
  "Accessoires Plus": { ville: "Libreville", inscrit: "2024", ventes: 52, note: 4.5, bio: "Montres, sacs, lunettes — tout pour compléter votre look." },
  "Tech Wear": { ville: "Libreville", inscrit: "2023", ventes: 89, note: 4.5, bio: "Wearables et accessoires tech dernier cri." },
  "Urban Style": { ville: "Oyem", inscrit: "2025", ventes: 34, note: 4.4, bio: "Streetwear et mode urbaine. Des pièces qui font la différence." },
};

export default function Vendeur() {
  const { nom } = useParams();
  const decoded = decodeURIComponent(nom || "");
  const [produitsFirestore, setProduitsFirestore] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let actif = true;
    getDocs(collection(db, "produits"))
      .then((snap) => actif && setProduitsFirestore(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => {})
      .finally(() => actif && setChargement(false));
    return () => { actif = false; };
  }, []);

  const articles = useMemo(() => {
    const tous = [...PRODUITS, ...produitsFirestore].map(normaliserProduit);
    return tous.filter((p) => p.vendeur === decoded);
  }, [produitsFirestore, decoded]);

  const demo = VENDEURS_DEMO[decoded];
  const infos = demo || {
    ville: articles[0]?.ville || "Gabon",
    inscrit: "",
    ventes: articles.length,
    note: articles[0]?.note || 0,
    bio: "Vendeur indépendant sur Cyrano.",
  };

  if (chargement) return <PageLoader />;

  if (!demo && articles.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-emoji">🏪</span>
        <h2>Vendeur introuvable</h2>
        <p>Cette boutique n'existe pas ou n'a plus d'articles en ligne.</p>
        <Link to="/catalogue" className="btn-primary">Retour au catalogue</Link>
      </div>
    );
  }

  return (
    <div className="vendeur-page">
      <div className="vendeur-header">
        <div className="vendeur-avatar-large">{decoded.charAt(0).toUpperCase()}</div>
        <div className="vendeur-infos">
          <h1>{decoded}</h1>
          <p>📍 {infos.ville}{infos.inscrit ? ` · Membre depuis ${infos.inscrit}` : ""}</p>
          <div className="vendeur-stats">
            <span>★ {infos.note}</span>
            <span>📦 {infos.ventes} ventes</span>
            <span>🛍️ {articles.length} article{articles.length > 1 ? "s" : ""} en ligne</span>
          </div>
        </div>
      </div>

      <div className="vendeur-bio">
        <h3>À propos</h3>
        <p>{infos.bio}</p>
      </div>

      <h2>Articles en vente ({articles.length})</h2>
      {articles.length === 0 ? (
        <div className="empty-state">
          <span className="empty-emoji">📭</span>
          <h2>Boutique vide</h2>
          <p>Ce vendeur n'a aucun article en ligne pour le moment.</p>
          <Link to="/catalogue" className="btn-secondary">Voir d'autres articles</Link>
        </div>
      ) : (
        <div className="products-grid">
          {articles.map((p) => <ArticleCard key={p.id} produit={p} />)}
        </div>
      )}
    </div>
  );
}
