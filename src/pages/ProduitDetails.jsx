import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { addToCart } from "../store/cartSlice";
import { toggleFavorite } from "../store/favoritesSlice";
import { sendMessage } from "../store/messagesSlice";
import { ajouterAvis } from "../store/avisSlice";
import { addOffre } from "../store/offresSlice";
import toast from "react-hot-toast";

const products = [
  { id: "1", nom: "Chemise élégante", categorie: "Homme", prix: 15000, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=600&fit=crop", tailles: ["S", "M", "L", "XL"], desc: "Chemise en coton premium, idéale pour les occasions spéciales. Coupe moderne et confortable.", vendeur: "Alice Mode", ville: "Libreville", note: 4.8, avis: 23 },
  { id: "2", nom: "Robe fleurie", categorie: "Femme", prix: 22000, image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=600&fit=crop", tailles: ["S", "M", "L"], desc: "Robe légère à motif floral parfaite pour l'été. Tissu respirant.", vendeur: "Style Féminin", ville: "Port-Gentil", note: 4.9, avis: 31 },
  { id: "3", nom: "Jean slim", categorie: "Homme", prix: 18000, image: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600&h=600&fit=crop", tailles: ["38", "40", "42"], desc: "Jean slim stretch noir. Confort optimal.", vendeur: "Jean K.", ville: "Franceville", note: 4.6, avis: 15 },
  { id: "4", nom: "Sac à main", categorie: "Accessoires", prix: 25000, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop", tailles: [], desc: "Sac en cuir véritable. Compartiments multiples.", vendeur: "Accessoires Plus", ville: "Libreville", note: 4.7, avis: 19 },
  { id: "5", nom: "Montre connectée", categorie: "Accessoires", prix: 35000, image: "https://images.unsplash.com/photo-1546868871-af0de0ae72ba?w=600&h=600&fit=crop", tailles: [], desc: "Écran AMOLED, suivi d'activité, notifications.", vendeur: "Tech Wear", ville: "Libreville", note: 4.5, avis: 42 },
  { id: "6", nom: "T-shirt design", categorie: "Homme", prix: 8000, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop", tailles: ["S", "M", "L", "XL"], desc: "100% coton bio, motif original.", vendeur: "Urban Style", ville: "Oyem", note: 4.4, avis: 8 },
  { id: "7", nom: "Jupe courte", categorie: "Femme", prix: 12000, image: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&h=600&fit=crop", tailles: ["S", "M", "L"], desc: "Jupe en denim léger, look casual.", vendeur: "Style Féminin", ville: "Port-Gentil", note: 4.3, avis: 11 },
  { id: "8", nom: "Costume cravate", categorie: "Homme", prix: 45000, image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=600&fit=crop", tailles: ["M", "L", "XL"], desc: "Costume complet avec cravate assortie.", vendeur: "Alice Mode", ville: "Libreville", note: 4.9, avis: 27 },
  { id: "9", nom: "Lunettes de soleil", categorie: "Accessoires", prix: 15000, image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop", tailles: [], desc: "Polarisées anti-UV, monture légère.", vendeur: "Accessoires Plus", ville: "Libreville", note: 4.2, avis: 6 },
  { id: "10", nom: "Chaussures sport", categorie: "Homme", prix: 28000, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop", tailles: ["40", "41", "42", "43"], desc: "Semelle amortissante, design moderne.", vendeur: "Urban Style", ville: "Oyem", note: 4.6, avis: 34 },
  { id: "11", nom: "Veste en cuir", categorie: "Femme", prix: 55000, image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&h=600&fit=crop", tailles: ["S", "M", "L"], desc: "Cuir véritable, doublure soyeuse.", vendeur: "Style Féminin", ville: "Port-Gentil", note: 4.8, avis: 16 },
  { id: "12", nom: "Casquette street", categorie: "Accessoires", prix: 7000, image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&h=600&fit=crop", tailles: [], desc: "Ajustable, broderie originale.", vendeur: "Urban Style", ville: "Oyem", note: 4.1, avis: 5 },
];

function ProduitDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const favorites = useSelector((state) => state.favorites.items);
  const allAvis = useSelector((state) => state.avis.items);
  const [selectedSize, setSelectedSize] = useState("");
  const [offer, setOffer] = useState("");
  const [showMsg, setShowMsg] = useState(false);
  const [msg, setMsg] = useState("");
  const [newNote, setNewNote] = useState(5);
  const [newComment, setNewComment] = useState("");

  const firestoreProducts = useSelector((state) => state.products.items);
  const raw = products.find((p) => p.id === id) || firestoreProducts.find((p) => p.id === id);
  if (!raw) return <div className="loading">Produit introuvable</div>;
  const product = { ...raw, vendeur: raw.vendeur || raw.vendeurNom || "Vendeur", ville: raw.ville || "", note: raw.note || 0, avis: raw.avis || 0 };

  const isFav = favorites.some((f) => f.id === product.id);
  const productAvis = allAvis.filter((a) => a.produitId === product.id);
  const avgNote = productAvis.length ? (productAvis.reduce((s, a) => s + a.note, 0) / productAvis.length).toFixed(1) : product.note;

  const handleBuy = () => {
    if (!selectedSize && product.tailles.length > 0) return toast.error("Sélectionne une taille");
    dispatch(addToCart({ ...product, taille: selectedSize }));
    toast.success("Ajouté au panier !");
  };

  const handleOffer = async () => {
    if (!offer) return;
    if (!user) return toast.error("Connecte-toi pour faire une offre");
    try {
      const offreData = {
        produitId: product.id,
        produitNom: product.nom,
        clientId: user.uid,
        clientNom: user.nom || user.email,
        montant: Number(offer),
        status: "en_attente",
        date: serverTimestamp(),
        vendeurId: product.vendeurId || null,
        vendeurNom: product.vendeurNom || product.vendeur || null,
      };
      const ref = await addDoc(collection(db, "offres"), offreData);
      dispatch(addOffre({ id: ref.id, ...offreData }));
      toast.success(`Offre de ${Number(offer).toLocaleString()} FCFA envoyée au vendeur !`);
      setOffer("");
    } catch {
      toast.error("Erreur lors de l'envoi de l'offre");
    }
  };

  const handleMessage = () => {
    if (!user) return toast.error("Connecte-toi pour envoyer un message");
    if (!msg) return;
    dispatch(sendMessage({ productId: product.id, productName: product.nom, from: user.email, to: product.vendeur, text: msg }));
    toast.success("Message envoyé !");
    setMsg(""); setShowMsg(false);
  };

  const handleAvis = (e) => {
    e.preventDefault();
    if (!user) return toast.error("Connecte-toi pour laisser un avis");
    dispatch(ajouterAvis({ produitId: product.id, auteur: user.nom || user.email, note: newNote, texte: newComment }));
    toast.success("Avis ajouté !");
    setNewComment(""); setNewNote(5);
  };

  return (
    <div className="detail">
      <Link to="/catalogue" className="back-link">← Retour au catalogue</Link>
      <div className="detail-grid">
        <div className="detail-img">
          <img src={product.image} alt={product.nom} />
        </div>
        <div className="detail-info">
          <div className="detail-header">
            <h1>{product.nom}</h1>
            <button className={`fav-btn ${isFav ? "active" : ""}`} onClick={() => dispatch(toggleFavorite(product))}>
              {isFav ? "❤️" : "🤍"}
            </button>
          </div>
          <p className="detail-price">{product.prix.toLocaleString()} FCFA</p>
          <p className="detail-desc">{product.desc}</p>

          <Link to={`/vendeur/${encodeURIComponent(product.vendeur)}`} className="detail-vendeur">
            <div className="vendeur-avatar">{product.vendeur.charAt(0)}</div>
            <div>
              <strong>{product.vendeur}</strong>
              <p>{product.ville} · ⭐ {product.note} ({product.avis} avis)</p>
            </div>
          </Link>

          {product.tailles.length > 0 && (
            <div className="detail-sizes">
              <p>Taille :</p>
              <div className="size-selector">
                {product.tailles.map((t) => (
                  <button key={t} className={`size-btn ${selectedSize === t ? "active" : ""}`} onClick={() => setSelectedSize(t)}>{t}</button>
                ))}
              </div>
            </div>
          )}

          <button className="btn-primary btn-lg btn-block" onClick={handleBuy}>Ajouter au panier</button>
          <div className="detail-actions">
            <button className="btn-secondary btn-block" onClick={() => setShowMsg(!showMsg)}>💬 Contacter le vendeur</button>
          </div>

          {showMsg && (
            <div className="msg-box">
              <textarea placeholder={`Écrire à ${product.vendeur}...`} value={msg} onChange={(e) => setMsg(e.target.value)} />
              <button className="btn-primary" onClick={handleMessage}>Envoyer</button>
            </div>
          )}

          <div className="offer-box">
            <p>💰 Faire une offre :</p>
            <div className="offer-input">
              <input type="number" placeholder="Votre prix" value={offer} onChange={(e) => setOffer(e.target.value)} />
              <button className="btn-secondary" onClick={handleOffer}>Envoyer</button>
            </div>
          </div>

          <div className="payment-mock">
            <p>💳 Paiement mobile</p>
            <div className="payment-options">
              <button className="payment-btn" onClick={() => toast.success("🔵 Paiement Airtel Money simulé !")}>📱 Airtel Money</button>
              <button className="payment-btn" onClick={() => toast.success("🟢 Paiement Moov Money simulé !")}>📱 Moov Money</button>
            </div>
          </div>
        </div>
      </div>

      <div className="avis-section-detail">
        <h2>Avis ({productAvis.length})</h2>
        {user && (
          <form className="avis-form" onSubmit={handleAvis}>
            <div className="avis-stars">
              {[1, 2, 3, 4, 5].map((s) => (
                <span key={s} className={`star ${s <= newNote ? "active" : ""}`} onClick={() => setNewNote(s)}>★</span>
              ))}
            </div>
            <textarea placeholder="Ton avis..." value={newComment} onChange={(e) => setNewComment(e.target.value)} required />
            <button className="btn-primary" type="submit">Publier</button>
          </form>
        )}
        <div className="avis-list">
          {productAvis.map((a) => (
            <div key={a.id} className="avis-item">
              <div className="avis-item-header">
                <strong>{a.auteur}</strong>
                <span>{'★'.repeat(a.note)}{'☆'.repeat(5 - a.note)}</span>
              </div>
              <p>{a.texte}</p>
              <span className="avis-date">{a.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProduitDetails;
