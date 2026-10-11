import { useDispatch, useSelector } from "react-redux";
import { toggleFavorite } from "../store/favoritesSlice";
import toast from "react-hot-toast";

function CarreFav({ product }) {
  const dispatch = useDispatch();
  const favorites = useSelector((state) => state.favorites.items);
  const isFav = favorites.some((f) => f.id === product.id);

  const handleFav = (e) => {
    e.preventDefault();
    dispatch(toggleFavorite(product));
    toast(isFav ? "Retiré des favoris" : "Ajouté aux favoris");
  };

  return (
    <button className="fav-mini" onClick={handleFav}>
      {isFav ? "❤️" : "🤍"}
    </button>
  );
}

export default CarreFav;
