import { useState } from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "../store/cartSlice";
import toast from "react-hot-toast";

function ProduitCard({ product }) {
  const dispatch = useDispatch();
  const [selectedSize, setSelectedSize] = useState(product.tailles?.[0] || "");
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleAdd = () => {
    dispatch(addToCart({ ...product, taille: selectedSize }));
    toast.success(`${product.nom} ajouté au panier`);
  };

  return (
    <div className="product-card">
      <div className="product-img">
        {!imgLoaded && !imgError && <div className="img-placeholder" />}
        {imgError ? (
          <div className="img-fallback">
            <span>{product.categorie === "Homme" ? "👔" : product.categorie === "Femme" ? "👗" : "⌚"}</span>
          </div>
        ) : (
          <img
            src={product.image}
            alt={product.nom}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={imgLoaded ? "img-loaded" : "img-hidden"}
          />
        )}
      </div>
      <div className="product-body">
        <h3>{product.nom}</h3>
        <p className="product-category">{product.categorie}</p>
        <p className="product-price">{product.prix?.toLocaleString()} FCFA</p>

        {product.tailles?.length > 0 && (
          <div className="size-selector">
            {product.tailles.map((t) => (
              <button
                key={t}
                className={`size-btn ${selectedSize === t ? "active" : ""}`}
                onClick={() => setSelectedSize(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <button onClick={handleAdd}>Ajouter au panier</button>
      </div>
    </div>
  );
}

export default ProduitCard;
