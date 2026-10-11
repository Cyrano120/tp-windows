import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { toggleFavorite } from "../store/favoritesSlice";
import toast from "react-hot-toast";

function Favoris() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.favorites.items);

  const handleRemove = (product) => {
    dispatch(toggleFavorite(product));
    toast("Retiré des favoris");
  };

  if (!items.length) {
    return (
      <div className="panier-empty">
        <h2>Mes favoris</h2>
        <p>Tu n'as encore aucun favori. Explore le catalogue et ajoute des articles.</p>
        <Link to="/catalogue" className="btn-primary">Explorer le catalogue</Link>
      </div>
    );
  }

  return (
    <div className="favoris">
      <h2>Mes favoris ({items.length})</h2>
      <div className="products-grid">
        {items.map((product) => (
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
              <p className="product-price">{product.prix?.toLocaleString()} FCFA</p>
              <button className="btn-remove-fav" onClick={() => handleRemove(product)}>
                Retirer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Favoris;
