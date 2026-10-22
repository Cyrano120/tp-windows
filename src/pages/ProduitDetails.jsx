import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { addToCart } from "../store/cartSlice";
import { toggleFavorite } from "../store/favoritesSlice";
import { sendMessage } from "../store/messagesSlice";
import { addOffre } from "../store/offresSlice";
import ArticleCard from "../components/ArticleCard";
import { PageLoader } from "../components/RequireAuth";
import { PRODUITS, normaliserProduit } from "../data/catalogue";
import toast from "react-hot-toast";

const ICON_HEART = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" strokeLinejoin="round" />
  </svg>
);

const ICON_SHIELD = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z" strokeLinejoin="round" />
    <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICON_TRUCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7" strokeLinejoin="round" />
    <circle cx="7" cy="18" r="1.6" /><circle cx="17.5" cy="18" r="1.6" />
  </svg>
);

const ICON_LOCK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="10" width="14" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" strokeLinecap="round" />
  </svg>
);

export default function ProduitDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const favoris = useSelector((s) => s.favorites.items);
  const produitsStore = useSelector((s) => s.products.items);

  const local = useMemo(() => PRODUITS.find((p) => String(p.id) === String(id)), [id]);
  const [produit, setProduit] = useState(() => (local ? normaliserProduit(local) : null));
  const [chargement, setChargement] = useState(!local);
  const [taille, setTaille] = useState("");
  const [offre, setOffre] = useState("");
  const [message, setMessage] = useState("");
  const [voirMessage, setVoirMessage] = useState(false);
  const [avisFirestore, setAvisFirestore] = useState([]);
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState("");
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    let actif = true;
    const depuisStore = produitsStore.find((p) => String(p.id) === String(id));
    if (depuisStore) {
      // Synchronisation avec le store Redux (produit chargé par le catalogue).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProduit(normaliserProduit(depuisStore));
      setChargement(false);
      return;
    }
    if (local) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "produits", id));
        if (actif) setProduit(snap.exists() ? normaliserProduit({ id: snap.id, ...snap.data() }) : null);
      } catch {
        if (actif) setProduit(null);
      } finally {
        if (actif) setChargement(false);
      }
    })();
    return () => { actif = false; };
  }, [id, local, produitsStore]);

  useEffect(() => {
    let actif = true;
    getDocs(query(collection(db, "avis"), where("produitId", "==", String(id))))
      .then((snap) => actif && setAvisFirestore(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => {});
    return () => { actif = false; };
  }, [id]);

  if (chargement) return <PageLoader label="Chargement de l'article…" />;

  if (!produit) {
    return (
      <div className="empty-state">
        <span className="empty-emoji">🧐</span>
        <h2>Article introuvable</h2>
        <p>Cet article a peut-être été vendu ou retiré du catalogue.</p>
        <Link to="/catalogue" className="btn-primary">Retour au catalogue</Link>
      </div>
    );
  }

  const estFavori = favoris.some((f) => f.id === produit.id);
  const avis = avisFirestore;
  const noteMoyenne = avis.length
    ? (avis.reduce((s, a) => s + Number(a.note || 0), 0) / avis.length).toFixed(1)
    : produit.note;

  const similaires = PRODUITS
    .map(normaliserProduit)
    .filter((p) => p.categorie === produit.categorie && String(p.id) !== String(produit.id))
    .slice(0, 4);

  const ajouterAuPanier = () => {
    if (produit.tailles.length > 0 && !taille) return toast.error("Sélectionne une taille.");
    dispatch(addToCart({ ...produit, taille }));
    toast.success("Ajouté au panier !");
  };

  const envoyerOffre = async () => {
    if (!user) return toast.error("Connecte-toi pour faire une offre.");
    const montant = Number(offre);
    if (!montant || montant <= 0) return toast.error("Saisis un montant valide.");
    if (montant >= produit.prix) return toast.error("Ton offre doit être inférieure au prix affiché.");
    setEnvoi(true);
    try {
      const data = {
        produitId: String(produit.id),
        produitNom: produit.nom,
        clientId: user.uid,
        clientNom: user.nom || user.email,
        montant,
        status: "en_attente",
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
        vendeurId: produit.vendeurId || null,
        vendeurNom: produit.vendeur,
      };
      const ref = await addDoc(collection(db, "offres"), data);
      dispatch(addOffre({ id: ref.id, ...data }));
      toast.success(`Offre de ${montant.toLocaleString("fr-FR")} FCFA envoyée !`);
      setOffre("");
    } catch {
      toast.error("Erreur lors de l'envoi de l'offre.");
    } finally {
      setEnvoi(false);
    }
  };

  const envoyerMessage = () => {
    if (!user) return toast.error("Connecte-toi pour envoyer un message.");
    if (!message.trim()) return;
    dispatch(sendMessage({
      productId: produit.id,
      productName: produit.nom,
      from: user.email,
      to: produit.vendeur,
      text: message.trim(),
    }));
    toast.success("Message envoyé !");
    setMessage("");
    setVoirMessage(false);
  };

  const publierAvis = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Connecte-toi pour laisser un avis.");
    if (commentaire.trim().length < 5) return toast.error("Ton avis est trop court.");
    setEnvoi(true);
    try {
      const data = {
        produitId: String(produit.id),
        clientId: user.uid,
        auteur: user.nom || user.email,
        note,
        texte: commentaire.trim(),
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      };
      const ref = await addDoc(collection(db, "avis"), data);
      setAvisFirestore((prev) => [{ id: ref.id, ...data }, ...prev]);
      toast.success("Merci pour ton avis !");
      setCommentaire("");
      setNote(5);
    } catch {
      toast.error("Erreur lors de la publication.");
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="detail">
      <nav className="breadcrumb" aria-label="Fil d'Ariane">
        <Link to="/">Accueil</Link><span>/</span>
        <Link to="/catalogue">Catalogue</Link><span>/</span>
        <Link to={`/catalogue?cat=${produit.categorie}`}>{produit.categorie}</Link><span>/</span>
        <span style={{ color: "var(--c-text)" }}>{produit.nom}</span>
      </nav>

      <div className="detail-grid">
        <div>
          <div className="detail-img">
            <img src={produit.image} alt={produit.nom} />
            <button
              className={`article-fav ${estFavori ? "active" : ""}`}
              onClick={() => {
                dispatch(toggleFavorite(produit));
                toast.success(estFavori ? "Retiré des favoris" : "Ajouté aux favoris");
              }}
              aria-label={estFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-pressed={estFavori}
            >
              {ICON_HEART}
            </button>
          </div>
          <div className="trust-row">
            <div className="trust-item">{ICON_SHIELD}<span>Protection acheteur</span></div>
            <div className="trust-item">{ICON_TRUCK}<span>Livraison suivie</span></div>
            <div className="trust-item">{ICON_LOCK}<span>Paiement sécurisé</span></div>
          </div>
        </div>

        <div className="detail-panel">
          <div className="detail-header">
            <h1>{produit.nom}</h1>
            <span className={`badge-etat ${/neuf/i.test(produit.etat) ? "neuf" : ""}`}>{produit.etat}</span>
          </div>

          <p className="detail-price">{produit.prix.toLocaleString("fr-FR")} FCFA</p>
          <p className="detail-sub">
            {produit.marque && `${produit.marque} · `}{produit.categorie}
            {produit.stock > 0 ? " · En stock" : " · Épuisé"}
          </p>

          <Link to={`/vendeur/${encodeURIComponent(produit.vendeur)}`} className="detail-vendeur">
            <div className="vendeur-avatar">{produit.vendeur.charAt(0).toUpperCase()}</div>
            <div>
              <strong>{produit.vendeur}</strong>
              <p>{produit.ville || "Gabon"} · ★ {noteMoyenne} {avis.length ? `(${avis.length} avis)` : ""}</p>
            </div>
            <span className="chevron" aria-hidden="true">›</span>
          </Link>

          <p className="detail-desc">{produit.desc}</p>

          {produit.tailles.length > 0 && (
            <div className="detail-sizes">
              <p>Taille</p>
              <div className="size-selector">
                {produit.tailles.map((t) => (
                  <button key={t} className={`size-btn ${taille === t ? "active" : ""}`} onClick={() => setTaille(t)} aria-pressed={taille === t}>{t}</button>
                ))}
              </div>
            </div>
          )}

          <div className="buy-box">
            <button className="btn-primary btn-lg btn-block" onClick={ajouterAuPanier} disabled={produit.stock === 0}>
              {produit.stock === 0 ? "Article épuisé" : "Ajouter au panier"}
            </button>
            <div className="detail-actions">
              <button className="btn-secondary btn-block" onClick={() => setVoirMessage((v) => !v)}>💬 Contacter le vendeur</button>
            </div>
            {voirMessage && (
              <div className="msg-box">
                <textarea
                  placeholder={`Écrire à ${produit.vendeur}…`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  aria-label="Message au vendeur"
                />
                <button className="btn-primary btn-sm" onClick={envoyerMessage}>Envoyer</button>
              </div>
            )}

            <div className="offer-box">
              <p>💰 Faire une offre au vendeur</p>
              <div className="offer-input">
                <input
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max={produit.prix - 1}
                  placeholder="Ton prix en FCFA"
                  value={offre}
                  onChange={(e) => setOffre(e.target.value)}
                  aria-label="Montant de ton offre"
                />
                <button className="btn-secondary" onClick={envoyerOffre} disabled={envoi}>Envoyer</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="avis-section-detail">
        <h2>Avis {avis.length > 0 ? `(${avis.length})` : ""}</h2>

        {user && (
          <form className="avis-form" onSubmit={publierAvis}>
            <div className="avis-stars" role="radiogroup" aria-label="Note">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  type="button"
                  key={s}
                  className={`star ${s <= note ? "active" : ""}`}
                  onClick={() => setNote(s)}
                  aria-label={`${s} étoile${s > 1 ? "s" : ""}`}
                  aria-pressed={s <= note}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea placeholder="Partage ton expérience sur cet article…" value={commentaire} onChange={(e) => setCommentaire(e.target.value)} required />
            <button className="btn-primary" type="submit" disabled={envoi}>Publier mon avis</button>
          </form>
        )}

        <div className="avis-list">
          {avis.length === 0 && <p className="no-results">Aucun avis pour le moment. Sois le premier !</p>}
          {avis.map((a) => (
            <div key={a.id} className="avis-item">
              <div className="avis-item-header">
                <strong>{a.auteur}</strong>
                <span aria-label={`${a.note} sur 5`}>{"★".repeat(a.note)}{"☆".repeat(5 - a.note)}</span>
              </div>
              <p>{a.texte}</p>
              <span className="avis-date">{a.date ? new Date(a.date).toLocaleDateString("fr-FR") : ""}</span>
            </div>
          ))}
        </div>
      </section>

      {similaires.length > 0 && (
        <section className="similar-section">
          <h2>Articles similaires</h2>
          <div className="products-grid">
            {similaires.map((p) => <ArticleCard key={p.id} produit={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
