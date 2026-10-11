import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const mockSeller = {
  "Alice Mode": { nom: "Alice Mode", ville: "Libreville", note: 4.8, avis: 23, bio: "Passionnée de mode depuis 10 ans. Je sélectionne des pièces uniques et de qualité.", photo: "https://ui-avatars.com/api/?name=Alice+Mode&background=007782&color=fff&size=128" },
  "Style Féminin": { nom: "Style Féminin", ville: "Port-Gentil", note: 4.7, avis: 18, bio: "Mode féminine tendance à prix abordables. Nouveautés chaque semaine.", photo: "https://ui-avatars.com/api/?name=Style+Feminin&background=007782&color=fff&size=128" },
  "Jean K.": { nom: "Jean K.", ville: "Franceville", note: 4.6, avis: 15, bio: "Collectionneur de jeans vintage. Pièces rares et authentiques.", photo: "https://ui-avatars.com/api/?name=Jean+K&background=007782&color=fff&size=128" },
  "Accessoires Plus": { nom: "Accessoires Plus", ville: "Libreville", note: 4.7, avis: 19, bio: "Montres, sacs, lunettes - tout pour compléter votre look.", photo: "https://ui-avatars.com/api/?name=Accessoires+Plus&background=007782&color=fff&size=128" },
  "Tech Wear": { nom: "Tech Wear", ville: "Libreville", note: 4.5, avis: 42, bio: "Wearables et accessoires tech dernier cri.", photo: "https://ui-avatars.com/api/?name=Tech+Wear&background=007782&color=fff&size=128" },
  "Urban Style": { nom: "Urban Style", ville: "Oyem", note: 4.4, avis: 8, bio: "Streetwear et mode urbaine. Des pièces qui font la différence.", photo: "https://ui-avatars.com/api/?name=Urban+Style&background=007782&color=fff&size=128" },
};

const products = [
  { id: "1", nom: "Chemise élégante", categorie: "Homme", prix: 15000, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop", vendeur: "Alice Mode" },
  { id: "8", nom: "Costume cravate", categorie: "Homme", prix: 45000, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop", vendeur: "Alice Mode" },
  { id: "2", nom: "Robe fleurie", categorie: "Femme", prix: 22000, image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop", vendeur: "Style Féminin" },
  { id: "7", nom: "Jupe courte", categorie: "Femme", prix: 12000, image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&h=400&fit=crop", vendeur: "Style Féminin" },
  { id: "11", nom: "Veste en cuir", categorie: "Femme", prix: 55000, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop", vendeur: "Style Féminin" },
  { id: "3", nom: "Jean slim", categorie: "Homme", prix: 18000, image: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&h=400&fit=crop", vendeur: "Jean K." },
  { id: "4", nom: "Sac à main", categorie: "Accessoires", prix: 25000, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop", vendeur: "Accessoires Plus" },
  { id: "5", nom: "Montre connectée", categorie: "Accessoires", prix: 35000, image: "https://images.unsplash.com/photo-1546868871-af0de0ae72ba?w=400&h=400&fit=crop", vendeur: "Tech Wear" },
  { id: "9", nom: "Lunettes de soleil", categorie: "Accessoires", prix: 15000, image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop", vendeur: "Accessoires Plus" },
  { id: "6", nom: "T-shirt design", categorie: "Homme", prix: 8000, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop", vendeur: "Urban Style" },
  { id: "10", nom: "Chaussures sport", categorie: "Homme", prix: 28000, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", vendeur: "Urban Style" },
  { id: "12", nom: "Casquette street", categorie: "Accessoires", prix: 7000, image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop", vendeur: "Urban Style" },
];

function VendeurProfile() {
  const { nom } = useParams();
  const [seller, setSeller] = useState(null);
  const [sellerProducts, setSellerProducts] = useState([]);

  useEffect(() => {
    const s = mockSeller[nom];
    if (s) {
      setSeller(s);
      setSellerProducts(products.filter(p => p.vendeur === nom));
    }
  }, [nom]);

  if (!seller) {
    return <div className="loading">Vendeur introuvable</div>;
  }

  return (
    <div className="vendeur-page">
      <Link to="/catalogue" className="back-link">← Retour au catalogue</Link>

      <div className="vendeur-header">
        <img src={seller.photo} alt={seller.nom} className="vendeur-photo" />
        <div className="vendeur-info">
          <h1>{seller.nom}</h1>
          <p className="vendeur-meta">{seller.ville} · Vendeur depuis 2023</p>
          <div className="vendeur-stats">
            <div><strong>⭐ {seller.note}</strong> <span>({seller.avis} avis)</span></div>
            <div><strong>{sellerProducts.length}</strong> <span>articles</span></div>
          </div>
        </div>
      </div>

      <div className="vendeur-bio">
        <h3>À propos</h3>
        <p>{seller.bio}</p>
      </div>

      <h2>Ses articles ({sellerProducts.length})</h2>
      <div className="products-grid">
        {sellerProducts.map((product) => (
          <Link key={product.id} to={`/produit/${product.id}`} className="product-card">
            <div className="product-img">
              <img src={product.image} alt={product.nom} loading="lazy" />
            </div>
            <div className="product-body">
              <h3>{product.nom}</h3>
              <p className="product-price">{product.prix?.toLocaleString()} FCFA</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default VendeurProfile;
