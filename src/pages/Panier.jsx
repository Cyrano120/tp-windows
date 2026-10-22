import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { removeFromCart, updateQuantity, clearCart } from "../store/cartSlice";
import { calculerTotaux, SEUIL_LIVRAISON_GRATUITE } from "../utils/totaux";
import toast from "react-hot-toast";

export default function Panier() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const { sousTotal, livraison, total } = calculerTotaux(items);
  const nbArticles = items.reduce((n, i) => n + i.quantity, 0);

  const viderPanier = () => {
    if (!confirm("Vider entièrement le panier ?")) return;
    dispatch(clearCart());
    toast.success("Panier vidé");
  };

  if (!items.length) {
    return (
      <div className="panier-empty">
        <span className="empty-emoji">🛍️</span>
        <h2>Votre panier est vide</h2>
        <p>Explorez notre catalogue et ajoutez des articles pour commencer.</p>
        <Link to="/catalogue" className="btn-primary">Voir le catalogue</Link>
      </div>
    );
  }

  return (
    <div className="panier">
      <h2>Votre panier <span style={{ fontSize: 16, color: "var(--c-muted)", fontWeight: 500 }}>({nbArticles} article{nbArticles > 1 ? "s" : ""})</span></h2>

      <div className="panier-items">
        {items.map((item) => (
          <div key={`${item.id}-${item.taille || "unique"}`} className="panier-item">
            <Link to={`/produit/${item.id}`} className="panier-thumb">
              {item.image ? <img src={item.image} alt={item.nom} loading="lazy" /> : null}
            </Link>

            <div className="item-info">
              <h3>{item.nom}</h3>
              <p>{item.prix?.toLocaleString("fr-FR")} FCFA</p>
              {item.taille && <p className="item-taille">Taille : {item.taille}</p>}
              {item.stock && item.quantity >= item.stock && (
                <p className="item-taille" style={{ color: "var(--c-warning)" }}>Stock maximum atteint</p>
              )}
            </div>

            <div className="item-actions">
              <button
                aria-label={`Diminuer la quantité de ${item.nom}`}
                onClick={() => dispatch(updateQuantity({ id: item.id, taille: item.taille, quantity: item.quantity - 1 }))}
              >
                −
              </button>
              <span aria-live="polite">{item.quantity}</span>
              <button
                aria-label={`Augmenter la quantité de ${item.nom}`}
                onClick={() => dispatch(updateQuantity({ id: item.id, taille: item.taille, quantity: item.quantity + 1 }))}
              >
                +
              </button>
              <button
                className="btn-remove"
                aria-label={`Retirer ${item.nom} du panier`}
                onClick={() => {
                  dispatch(removeFromCart({ id: item.id, taille: item.taille }));
                  toast.success("Article retiré");
                }}
              >
                ✕
              </button>
            </div>

            <p className="item-subtotal">{(item.prix * item.quantity)?.toLocaleString("fr-FR")} FCFA</p>
          </div>
        ))}
      </div>

      <div className="panier-total">
        <div className="summary-line" style={{ justifyContent: "flex-end", gap: 40 }}>
          <span>Sous-total</span>
          <strong>{sousTotal.toLocaleString("fr-FR")} FCFA</strong>
        </div>
        <div className="summary-line" style={{ justifyContent: "flex-end", gap: 40 }}>
          <span>Livraison</span>
          <strong>{livraison === 0 ? "Offerte" : `${livraison.toLocaleString("fr-FR")} FCFA`}</strong>
        </div>
        <h3>Total : {total.toLocaleString("fr-FR")} FCFA</h3>
        {sousTotal < SEUIL_LIVRAISON_GRATUITE && (
          <p style={{ fontSize: 12.5, color: "var(--c-muted)", marginBottom: 14 }}>
            Plus que {(SEUIL_LIVRAISON_GRATUITE - sousTotal).toLocaleString("fr-FR")} FCFA pour la livraison offerte.
          </p>
        )}
        <div className="panier-actions">
          <button className="btn-clear" onClick={viderPanier}>Vider le panier</button>
          <Link to="/catalogue" className="btn-secondary">Continuer mes achats</Link>
          <Link to="/checkout" className="btn-primary">Commander</Link>
        </div>
      </div>
    </div>
  );
}
