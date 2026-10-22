import { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleFavorite } from "../store/favoritesSlice";
import toast from "react-hot-toast";

const ICON_HEART = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" strokeLinejoin="round" />
  </svg>
);

export default function ArticleCard({ produit, afficherFavori = true }) {
  const dispatch = useDispatch();
  const favoris = useSelector((s) => s.favorites.items);
  const [imgErreur, setImgErreur] = useState(false);
  const [imgChargee, setImgChargee] = useState(false);
  const estFavori = favoris.some((f) => f.id === produit.id);

  const basculerFavori = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleFavorite(produit));
    toast.success(estFavori ? "Retiré des favoris" : "Ajouté aux favoris");
  };

  const etatNeuf = /neuf/i.test(produit.etat || "");

  return (
    <article className="article-card">
      <div className="article-img">
        {!imgChargee && !imgErreur && <div className="img-placeholder" />}
        {imgErreur ? (
          <div className="img-fallback" aria-hidden="true">
            <span>{produit.categorie === "Homme" ? "👔" : produit.categorie === "Femme" ? "👗" : "👜"}</span>
          </div>
        ) : (
          <img
            src={produit.image}
            alt={produit.nom}
            loading="lazy"
            onLoad={() => setImgChargee(true)}
            onError={() => setImgErreur(true)}
            className={imgChargee ? "img-loaded" : "img-hidden"}
          />
        )}

        {afficherFavori && (
          <button
            className={`article-fav ${estFavori ? "active" : ""}`}
            onClick={basculerFavori}
            aria-label={estFavori ? `Retirer ${produit.nom} des favoris` : `Ajouter ${produit.nom} aux favoris`}
            aria-pressed={estFavori}
          >
            {ICON_HEART}
          </button>
        )}

        <div className="article-badges">
          {produit.etat && (
            <span className={`badge-etat ${etatNeuf ? "neuf" : ""}`}>{produit.etat}</span>
          )}
        </div>
      </div>

      <Link to={`/produit/${produit.id}`} className="article-body">
        <h3 className="article-title">{produit.nom}</h3>
        <p className="article-meta">
          {produit.marque ? `${produit.marque} · ` : ""}{produit.categorie}
          {produit.tailles?.length > 0 ? ` · ${produit.tailles.join(" ")}` : ""}
        </p>
        <p className="article-price">{produit.prix?.toLocaleString("fr-FR")} FCFA</p>
        <p className="article-seller">
          <span>{produit.vendeur || produit.vendeurNom || "Vendeur Cyrano"}</span>
          {produit.note > 0 && <><span className="dot" /><span>★ {produit.note}</span></>}
        </p>
      </Link>
    </article>
  );
}
