import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { clearCart } from "../store/cartSlice";
import { addOrder } from "../store/ordersSlice";

function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector((state) => state.cart.items);
  const [form, setForm] = useState({ nom: "", tel: "", adresse: "" });
  const [loading, setLoading] = useState(false);

  const total = items.reduce((sum, i) => sum + i.prix * i.quantity, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const order = {
        client: form,
        articles: items,
        total,
        status: "Reçue",
        date: new Date().toISOString(),
      };
      const docRef = await addDoc(collection(db, "commandes"), order);
      dispatch(addOrder({ id: docRef.id, ...order }));
      dispatch(clearCart());
      alert("Commande confirmée !");
      navigate("/suivi");
    } catch {
      alert("Erreur lors de la commande.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  if (!items.length) {
    navigate("/panier");
    return null;
  }

  return (
    <div className="checkout">
      <h2>Finaliser la commande</h2>
      <div className="checkout-grid">
        <form onSubmit={handleSubmit} className="checkout-form">
          <input name="nom" placeholder="Nom complet" onChange={handleChange} required />
          <input name="tel" placeholder="Téléphone" onChange={handleChange} required />
          <textarea
            name="adresse"
            placeholder="Adresse de livraison"
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Traitement..." : `Payer ${total.toLocaleString()} FCFA`}
          </button>
        </form>
        <div className="checkout-summary">
          <h3>Récapitulatif</h3>
          {items.map((i) => (
            <p key={i.id}>
              {i.nom} x{i.quantity} = {(i.prix * i.quantity).toLocaleString()} FCFA
            </p>
          ))}
          <hr />
          <strong>Total : {total.toLocaleString()} FCFA</strong>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
