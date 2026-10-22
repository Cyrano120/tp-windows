import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import ArticleCard from "../components/ArticleCard";

export default function Favoris() {
  const items = useSelector((s) => s.favorites.items);

  if (!items.length) {
    return (
      <div className="empty-state">
        <span className="empty-emoji">💚</span>
        <h2>Mes favoris</h2>
        <p>Tu n'as encore aucun favori. Clique sur le cœur d'un article pour le retrouver ici.</p>
        <Link to="/catalogue" className="btn-primary">Explorer le catalogue</Link>
      </div>
    );
  }

  return (
    <div className="favoris">
      <div className="catalogue-head">
        <div>
          <h2>Mes favoris</h2>
          <p className="catalogue-count">{items.length} article{items.length > 1 ? "s" : ""} sauvegardé{items.length > 1 ? "s" : ""}</p>
        </div>
        <Link to="/catalogue" className="btn-secondary btn-sm">Continuer mes achats</Link>
      </div>
      <div className="products-grid">
        {items.map((produit) => <ArticleCard key={produit.id} produit={produit} />)}
      </div>
    </div>
  );
}
