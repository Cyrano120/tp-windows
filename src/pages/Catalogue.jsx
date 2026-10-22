import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { setProducts } from "../store/productsSlice";
import ArticleCard from "../components/ArticleCard";
import useInfiniteScroll from "../hooks/useInfiniteScroll";
import { PRODUITS, CATEGORIES, TAILLES, normaliserProduit } from "../data/catalogue";

function Skeleton() {
  return (
    <div className="products-grid" aria-hidden="true">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="article-card skeleton">
          <div className="article-img skeleton-img" />
          <div className="article-body">
            <div className="skeleton-line w-60" />
            <div className="skeleton-line w-40" />
            <div className="skeleton-line w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Catalogue() {
  const dispatch = useDispatch();
  const produitsFirestore = useSelector((s) => s.products.items);
  const [params, setParams] = useSearchParams();
  const [chargement, setChargement] = useState(true);

  const recherche = params.get("q") || "";
  const categorie = params.get("cat") || "Toutes";
  const taille = params.get("taille") || "";
  const prixMin = params.get("min") || "";
  const prixMax = params.get("max") || "";
  const tri = params.get("tri") || "pertinence";

  /** Applique plusieurs filtres en UNE seule navigation (évite les écrasements). */
  const majParams = (modifications) => {
    const suivant = new URLSearchParams(params);
    Object.entries(modifications).forEach(([cle, valeur]) => {
      if (!valeur || valeur === "Toutes" || valeur === "pertinence") suivant.delete(cle);
      else suivant.set(cle, valeur);
    });
    setParams(suivant, { replace: true });
  };

  const majParam = (cle, valeur) => majParams({ [cle]: valeur });

  const reinitialiser = () => setParams({}, { replace: true });

  useEffect(() => {
    let actif = true;
    getDocs(collection(db, "produits"))
      .then((snap) => {
        if (actif && !snap.empty) {
          dispatch(setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
        }
      })
      .catch(() => {})
      .finally(() => actif && setChargement(false));
    const secours = setTimeout(() => actif && setChargement(false), 900);
    return () => { actif = false; clearTimeout(secours); };
  }, [dispatch]);

  /** Fusion démo + Firestore, dédoublonnée par id. */
  const tous = useMemo(() => {
    const map = new Map();
    PRODUITS.forEach((p) => map.set(String(p.id), normaliserProduit(p)));
    produitsFirestore.forEach((p) => map.set(String(p.id), normaliserProduit(p)));
    return Array.from(map.values());
  }, [produitsFirestore]);

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    let liste = tous.filter((p) => {
      if (q && !`${p.nom} ${p.marque} ${p.categorie} ${p.vendeur}`.toLowerCase().includes(q)) return false;
      if (categorie !== "Toutes" && p.categorie !== categorie) return false;
      if (taille && !p.tailles.includes(taille)) return false;
      if (prixMin && p.prix < Number(prixMin)) return false;
      if (prixMax && p.prix > Number(prixMax)) return false;
      return true;
    });

    switch (tri) {
      case "prix-asc": liste = [...liste].sort((a, b) => a.prix - b.prix); break;
      case "prix-desc": liste = [...liste].sort((a, b) => b.prix - a.prix); break;
      case "note": liste = [...liste].sort((a, b) => b.note - a.note); break;
      case "nouveaux": liste = [...liste].reverse(); break;
      default: break;
    }
    return liste;
  }, [tous, recherche, categorie, taille, prixMin, prixMax, tri]);

  const compteurs = useMemo(() => {
    const c = { Toutes: tous.length };
    tous.forEach((p) => { c[p.categorie] = (c[p.categorie] || 0) + 1; });
    return c;
  }, [tous]);

  const { displayed, hasMore, loadingMore } = useInfiniteScroll(resultats, 8);
  const filtresActifs = [recherche, categorie !== "Toutes" ? categorie : "", taille, prixMin, prixMax, tri !== "pertinence" ? tri : ""].filter(Boolean);

  return (
    <div className="catalogue">
      <div className="catalogue-head">
        <div>
          <h2>{recherche ? `Résultats pour « ${recherche} »` : "Le catalogue"}</h2>
          <p className="catalogue-count" aria-live="polite">
            {resultats.length} article{resultats.length > 1 ? "s" : ""} disponible{resultats.length > 1 ? "s" : ""}
          </p>
        </div>
        <div className="catalogue-tools">
          <label htmlFor="tri" className="sr-only">Trier par</label>
          <select id="tri" className="filter-select" value={tri} onChange={(e) => majParam("tri", e.target.value)}>
            <option value="pertinence">Pertinence</option>
            <option value="nouveaux">Nouveautés</option>
            <option value="prix-asc">Prix croissant</option>
            <option value="prix-desc">Prix décroissant</option>
            <option value="note">Mieux notés</option>
          </select>
        </div>
      </div>

      <div className="catalogue-filters">
        <input
          className="search-bar"
          type="search"
          placeholder="Rechercher par nom, marque, vendeur…"
          value={recherche}
          onChange={(e) => majParam("q", e.target.value)}
          aria-label="Rechercher un produit"
        />
        <div className="filters-row">
          <div className="filter-tags" role="group" aria-label="Filtrer par catégorie">
            {CATEGORIES.map((cat) => (
              <button key={cat} className={`filter-tag ${categorie === cat ? "active" : ""}`} onClick={() => majParam("cat", cat)} aria-pressed={categorie === cat}>
                {cat}{compteurs[cat] ? ` (${compteurs[cat]})` : ""}
              </button>
            ))}
          </div>
          <div className="filters-group">
            <select className="filter-select" value={taille} onChange={(e) => majParam("taille", e.target.value)} aria-label="Filtrer par taille">
              <option value="">Toutes tailles</option>
              {TAILLES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" className="filter-input" placeholder="Prix min" value={prixMin} onChange={(e) => majParam("min", e.target.value)} aria-label="Prix minimum" min="0" />
            <input type="number" className="filter-input" placeholder="Prix max" value={prixMax} onChange={(e) => majParam("max", e.target.value)} aria-label="Prix maximum" min="0" />
          </div>
        </div>
      </div>

      {filtresActifs.length > 0 && (
        <div className="chips">
          {recherche && <span className="chip">« {recherche} » <button onClick={() => majParam("q", "")} aria-label="Retirer la recherche">×</button></span>}
          {categorie !== "Toutes" && <span className="chip">{categorie} <button onClick={() => majParam("cat", "")} aria-label="Retirer la catégorie">×</button></span>}
          {taille && <span className="chip">Taille {taille} <button onClick={() => majParam("taille", "")} aria-label="Retirer la taille">×</button></span>}
          {(prixMin || prixMax) && <span className="chip">{prixMin || "0"} – {prixMax || "∞"} FCFA <button onClick={() => majParams({ min: "", max: "" })} aria-label="Retirer le prix">×</button></span>}
          {tri !== "pertinence" && <span className="chip">{tri.replace("-", " ")} <button onClick={() => majParam("tri", "")} aria-label="Retirer le tri">×</button></span>}
          <button className="chip" onClick={reinitialiser} style={{ background: "transparent", border: "1px solid var(--c-border)", color: "var(--c-muted)" }}>Tout effacer</button>
        </div>
      )}

      {chargement ? (
        <Skeleton />
      ) : resultats.length === 0 ? (
        <div className="empty-state">
          <span className="empty-emoji">🔍</span>
          <h2>Aucun article trouvé</h2>
          <p>Essaie d'élargir ta recherche ou de retirer un filtre.</p>
          <button className="btn-primary" onClick={reinitialiser}>Réinitialiser les filtres</button>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {displayed.map((produit) => <ArticleCard key={produit.id} produit={produit} />)}
          </div>
          {loadingMore && <div className="loading-more">Chargement…</div>}
          {!hasMore && displayed.length > 0 && <p className="end-list">Tu as vu tous les articles ✨</p>}
        </>
      )}
    </div>
  );
}
