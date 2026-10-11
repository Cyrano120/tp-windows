import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";

const vendeurs = {
  "Alice Mode": { ville: "Libreville", tel: "+241 77 00 00 01", inscrit: "2024", ventes: 45, note: 4.8 },
  "Style Féminin": { ville: "Port-Gentil", tel: "+241 77 00 00 02", inscrit: "2023", ventes: 78, note: 4.7 },
  "Jean K.": { ville: "Franceville", tel: "+241 77 00 00 03", inscrit: "2025", ventes: 23, note: 4.6 },
  "Accessoires Plus": { ville: "Libreville", tel: "+241 77 00 00 04", inscrit: "2024", ventes: 52, note: 4.5 },
  "Tech Wear": { ville: "Libreville", tel: "+241 77 00 00 05", inscrit: "2023", ventes: 89, note: 4.5 },
  "Urban Style": { ville: "Oyem", tel: "+241 77 00 00 06", inscrit: "2025", ventes: 34, note: 4.4 },
};

function Vendeur() {
  const { nom } = useParams();
  const decoded = decodeURIComponent(nom);
  const produits = useSelector((state) => state.products.items);
  const infos = vendeurs[decoded];
  const articles = produits.filter((p) => p.vendeur === decoded || p.vendeurNom === decoded || p.vendeurNom === decoded);

  if (!infos && articles.length === 0) return <div className="loading">Vendeur introuvable</div>;

  const data = infos || { ville: "", tel: "Non renseigné", inscrit: "", ventes: articles.length, note: 4.0 };

  return (
    <div className="vendeur-page">
      <div className="vendeur-header">
        <div className="vendeur-avatar-large">{decoded.charAt(0)}</div>
        <div className="vendeur-infos">
          <h1>{decoded}</h1>
          <p>📍 {data.ville} · {data.inscrit ? `Membre depuis ${data.inscrit}` : ""}</p>
          <div className="vendeur-stats">
            <span>⭐ {data.note}</span>
            <span>📦 {data.ventes} ventes</span>
            <span>📞 {data.tel}</span>
          </div>
        </div>
      </div>

      <h2>Articles en vente ({articles.length})</h2>
      {articles.length === 0 ? (
        <p className="no-results">Aucun article pour le moment.</p>
      ) : (
        <div className="products-grid">
          {articles.map((p) => (
            <Link key={p.id} to={`/produit/${p.id}`} className="product-card">
              <div className="product-img">
                <img src={p.image} alt={p.nom} loading="lazy" />
              </div>
              <div className="product-body">
                <h3>{p.nom}</h3>
                <p className="product-price">{p.prix?.toLocaleString()} FCFA</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Vendeur;
