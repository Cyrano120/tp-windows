import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { removeFromCart, updateQuantity, clearCart } from "../store/cartSlice";

function Panier() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);

  const total = items.reduce((sum, i) => sum + i.prix * i.quantity, 0);

  if (!items.length) {
    return (
      <div className="panier-empty">
        <h2>Votre panier est vide</h2>
        <p>Explorez notre catalogue et ajoutez des articles.</p>
        <Link to="/catalogue" className="btn-primary">
          Voir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="panier">
      <h2>Votre Panier</h2>
      <div className="panier-items">
        {items.map((item) => (
          <div key={item.id} className="panier-item">
            <div className="item-info">
              <h3>{item.nom}</h3>
              <p>{item.prix?.toLocaleString()} FCFA</p>
            </div>
            <div className="item-actions">
              <button
                onClick={() =>
                  dispatch(
                    updateQuantity({
                      id: item.id,
                      quantity: Math.max(1, item.quantity - 1),
                    })
                  )
                }
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() =>
                  dispatch(
                    updateQuantity({ id: item.id, quantity: item.quantity + 1 })
                  )
                }
              >
                +
              </button>
              <button
                className="btn-remove"
                onClick={() => dispatch(removeFromCart(item.id))}
              >
                ✕
              </button>
            </div>
            <p className="item-subtotal">
              {(item.prix * item.quantity)?.toLocaleString()} FCFA
            </p>
          </div>
        ))}
      </div>
      <div className="panier-total">
        <h3>Total : {total?.toLocaleString()} FCFA</h3>
        <div className="panier-actions">
          <button className="btn-clear" onClick={() => dispatch(clearCart())}>
            Vider le panier
          </button>
          <Link to="/checkout" className="btn-primary">
            Commander
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Panier;
