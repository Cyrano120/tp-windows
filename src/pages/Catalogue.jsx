import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { setProducts } from "../store/productsSlice";
import CarreFav from "../components/CarreFav";
import useInfiniteScroll from "../hooks/useInfiniteScroll";

const produitsExemple = [
  { id: "1", nom: "Chemise élégante", categorie: "Homme", prix: 15000, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop", tailles: ["S", "M", "L", "XL"] },
  { id: "2", nom: "Robe fleurie", categorie: "Femme", prix: 22000, image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=400&fit=crop", tailles: ["S", "M", "L"] },
  { id: "3", nom: "Jean slim", categorie: "Homme", prix: 18000, image: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&h=400&fit=crop", tailles: ["38", "40", "42"] },
  { id: "4", nom: "Sac à main", categorie: "Accessoires", prix: 25000, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop", tailles: [] },
  { id: "5", nom: "Montre connectée", categorie: "Accessoires", prix: 35000, image: "https://images.unsplash.com/photo-1546868871-af0de0ae72ba?w=400&h=400&fit=crop", tailles: [] },
  { id: "6", nom: "T-shirt design", categorie: "Homme", prix: 8000, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop", tailles: ["S", "M", "L", "XL"] },
  { id: "7", nom: "Jupe courte", categorie: "Femme", prix: 12000, image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&h=400&fit=crop", tailles: ["S", "M", "L"] },
  { id: "8", nom: "Costume cravate", categorie: "Homme", prix: 45000, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop", tailles: ["M", "L", "XL"] },
  { id: "9", nom: "Lunettes de soleil", categorie: "Accessoires", prix: 15000, image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop", tailles: [] },
  { id: "10", nom: "Chaussures sport", categorie: "Homme", prix: 28000, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", tailles: ["40", "41", "42", "43"] },
  { id: "11", nom: "Veste en cuir", categorie: "Femme", prix: 55000, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop", tailles: ["S", "M", "L"] },
  { id: "12", nom: "Casquette street", categorie: "Accessoires", prix: 7000, image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=400&fit=crop", tailles: [] },
];

const categories = ["Toutes", "Homme", "Femme", "Accessoires"];
const allSizes = ["S", "M", "L", "XL", "38", "40", "42", "43"];

function Skeleton() {
  return (
    <div className="products-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="product-card skeleton">
          <div className="product-img skeleton-img" />
          <div className="product-body">
            <div className="skeleton-line w-60" />
            <div className="skeleton-line w-40" />
            <div className="skeleton-line w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Catalogue() {
  const dispatch = useDispatch();
  const firestoreProducts = useSelector((state) => state.products.items);
  const [search, setSearch] = useState("");
  const [categorie, setCategorie] = useState("Toutes");
  const [taille, setTaille] = useState("");
  const [prixMin, setPrixMin] = useState("");
  const [prixMax, setPrixMax] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "produits")).then((snap) => {
      if (!snap.empty) dispatch(setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    }).catch(() => {});
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [dispatch]);

  const allProducts = useMemo(() => {
    const map = new Map();
    produitsExemple.forEach((p) => map.set(p.id, { ...p, vendeurNom: p.vendeur }));
    firestoreProducts.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [firestoreProducts]);

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      if (search && !p.nom.toLowerCase().includes(search.toLowerCase())) return false;
      if (categorie !== "Toutes" && p.categorie !== categorie) return false;
      if (taille && p.tailles.length > 0 && !p.tailles.includes(taille)) return false;
      if (prixMin && p.prix < Number(prixMin)) return false;
      if (prixMax && p.prix > Number(prixMax)) return false;
      return true;
    });
  }, [search, categorie, taille, prixMin, prixMax]);

  const { displayed, hasMore, loadingMore } = useInfiniteScroll(filtered, 6);

  return (
    <div className="catalogue">
      <h2>Catalogue</h2>

      <div className="catalogue-filters">
        <input
          className="search-bar"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="filters-row">
          <div className="filter-tags">
            {categories.map((cat) => (
              <button key={cat} className={`filter-tag ${categorie === cat ? "active" : ""}`}
                onClick={() => setCategorie(cat)}>{cat}</button>
            ))}
          </div>
          <div className="filter-tags">
            <select className="filter-select" value={taille} onChange={(e) => setTaille(e.target.value)}>
              <option value="">Toutes tailles</option>
              {allSizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="number" className="filter-input" placeholder="Prix min" value={prixMin}
              onChange={(e) => setPrixMin(e.target.value)} />
            <input type="number" className="filter-input" placeholder="Prix max" value={prixMax}
              onChange={(e) => setPrixMax(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <Skeleton />
      ) : !displayed.length ? (
        <p className="no-results">Aucun produit trouvé.</p>
      ) : (
        <>
          <div className="products-grid">
            {displayed.map((product) => (
              <div key={product.id} className="product-card">
                <Link to={`/produit/${product.id}`}>
                  <div className="product-img">
                    <img src={product.image} alt={product.nom} loading="lazy" />
                  </div>
                </Link>
                <div className="product-body">
                  <Link to={`/produit/${product.id}`}>
                    <h3>{product.nom}</h3>
                  </Link>
                  <p className="product-category">{product.categorie}</p>
                  <p className="product-price">{product.prix?.toLocaleString()} FCFA</p>
                  <CarreFav product={product} />
                </div>
              </div>
            ))}
          </div>
          {loadingMore && <div className="loading-more">Chargement...</div>}
          {!hasMore && displayed.length > 0 && <p className="end-list">Tous les produits sont affichés</p>}
        </>
      )}
    </div>
  );
}

export default Catalogue;
