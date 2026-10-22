import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { addDoc, collection, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { clearCart } from "../store/cartSlice";
import { PRODUITS, normaliserProduit } from "../data/catalogue";
import { calculerTotaux } from "../utils/totaux";
import toast from "react-hot-toast";

const PAIEMENTS = [
  { id: "Airtel Money", label: "📱 Airtel Money" },
  { id: "Moov Money", label: "📱 Moov Money" },
  { id: "À la livraison", label: "🚚 À la livraison" },
];

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const items = useSelector((s) => s.cart.items);

  const [form, setForm] = useState({
    nom: user?.nom || "",
    tel: "",
    adresse: "",
    ville: "Libreville",
    note: "",
  });
  const [paiement, setPaiement] = useState("Airtel Money");
  const [loading, setLoading] = useState(false);

  const { sousTotal, livraison, total } = calculerTotaux(items);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  /**
   * Sécurité : on ne fait jamais confiance aux prix stockés dans le panier.
   * Ils sont rechargés depuis le catalogue (démo + Firestore) au moment de payer.
   */
  const construireArticles = async () => {
    const snap = await getDocs(collection(db, "produits"));
    const distants = snap.docs.map((d) => normaliserProduit({ id: d.id, ...d.data() }));
    const catalogue = new Map();
    PRODUITS.map(normaliserProduit).forEach((p) => catalogue.set(String(p.id), p));
    distants.forEach((p) => catalogue.set(String(p.id), p));

    const articles = [];
    for (const item of items) {
      const produit = catalogue.get(String(item.id));
      if (!produit) throw new Error(`« ${item.nom} » n'est plus disponible.`);
      if (produit.vendeurId && produit.vendeurId === user.uid) {
        throw new Error("Tu ne peux pas acheter ton propre article.");
      }
      const stock = Number(produit.stock);
      const prix = Number(produit.prix);
      if (!Number.isFinite(stock) || stock <= 0) {
        throw new Error(`« ${produit.nom} » n'est plus en stock.`);
      }
      if (!Number.isFinite(prix) || prix <= 0) {
        throw new Error(`Le prix de « ${produit.nom} » est invalide.`);
      }
      // Le stock est une contrainte dure : 0 ne doit jamais être confondu
      // avec « stock inconnu ». On borne aussi la quantité basse à 1.
      const quantity = Math.max(1, Math.min(Number(item.quantity) || 1, stock));
      articles.push({
        id: produit.id,
        nom: produit.nom,
        prix: produit.prix,
        quantity,
        taille: item.taille || "",
        image: produit.image,
        vendeurId: produit.vendeurId || null,
        vendeurNom: produit.vendeur,
      });
    }
    return articles;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (form.tel.replace(/\D/g, "").length < 8) {
      return toast.error("Numéro de téléphone invalide (8 chiffres minimum).");
    }
    if (form.adresse.trim().length < 8) {
      return toast.error("Adresse de livraison trop courte.");
    }

    setLoading(true);
    try {
      const articles = await construireArticles();
      const totaux = calculerTotaux(articles);
      const commande = {
        clientId: user.uid,
        clientEmail: user.email,
        client: { ...form, email: user.email },
        articles,
        vendeurs: [...new Set(articles.map((a) => a.vendeurId).filter(Boolean))],
        sousTotal: totaux.sousTotal,
        livraison: totaux.livraison,
        total: totaux.total,
        paiement,
        status: "Reçue",
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      };

      const ref = await addDoc(collection(db, "commandes"), commande);
      dispatch(clearCart());
      toast.success("Commande confirmée !");
      navigate("/suivi", { state: { commandeId: ref.id } });
    } catch (err) {
      toast.error(err.message || "Erreur lors de la commande.");
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) return <Navigate to="/panier" replace />;

  return (
    <div className="checkout">
      <h2>Finaliser la commande</h2>
      <div className="checkout-grid">
        <form onSubmit={handleSubmit} className="checkout-form">
          <label htmlFor="nom">Nom complet</label>
          <input id="nom" name="nom" placeholder="Ex. Alice Mba" value={form.nom} onChange={handleChange} required autoComplete="name" />

          <label htmlFor="tel">Téléphone</label>
          <input id="tel" name="tel" type="tel" placeholder="+241 77 00 00 00" value={form.tel} onChange={handleChange} required autoComplete="tel" />

          <label htmlFor="adresse">Adresse de livraison</label>
          <textarea id="adresse" name="adresse" placeholder="Quartier, rue, numéro…" value={form.adresse} onChange={handleChange} required autoComplete="street-address" />

          <label htmlFor="ville">Ville</label>
          <select id="ville" name="ville" value={form.ville} onChange={handleChange}>
            <option>Libreville</option>
            <option>Port-Gentil</option>
            <option>Franceville</option>
            <option>Oyem</option>
            <option>Autre</option>
          </select>

          <label htmlFor="note">Instructions (optionnel)</label>
          <textarea id="note" name="note" placeholder="Digicode, repère, horaire de livraison…" value={form.note} onChange={handleChange} />

          <label>Moyen de paiement</label>
          <div className="pay-methods">
            {PAIEMENTS.map((p) => (
              <label key={p.id} className={`pay-option ${paiement === p.id ? "selected" : ""}`}>
                <input type="radio" name="paiement" value={p.id} checked={paiement === p.id} onChange={() => setPaiement(p.id)} />
                {p.label}
              </label>
            ))}
          </div>

          <button type="submit" className="btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? "Traitement…" : `Payer ${total.toLocaleString("fr-FR")} FCFA`}
          </button>
          <p className="secure-note">🔒 Paiement simulé pour ce projet — aucune donnée bancaire n'est collectée.</p>
        </form>

        <aside className="checkout-summary" aria-label="Récapitulatif de la commande">
          <h3>Récapitulatif</h3>
          {items.map((i) => (
            <div className="summary-line" key={`${i.id}-${i.taille || "unique"}`}>
              <span>{i.nom}{i.taille ? ` (${i.taille})` : ""} × {i.quantity}</span>
              <strong>{(i.prix * i.quantity).toLocaleString("fr-FR")} FCFA</strong>
            </div>
          ))}
          <hr />
          <div className="summary-line"><span>Sous-total</span><strong>{sousTotal.toLocaleString("fr-FR")} FCFA</strong></div>
          <div className="summary-line"><span>Livraison</span><strong>{livraison === 0 ? "Offerte" : `${livraison.toLocaleString("fr-FR")} FCFA`}</strong></div>
          <hr />
          <div className="summary-total"><span>Total</span><span>{total.toLocaleString("fr-FR")} FCFA</span></div>
          <p className="secure-note">🛡️ Protection acheteur : remboursement si l'article n'est pas conforme.</p>
        </aside>
      </div>
    </div>
  );
}
