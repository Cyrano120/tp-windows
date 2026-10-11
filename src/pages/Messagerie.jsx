import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

function Messagerie() {
  const conversations = useSelector((state) => state.messages.conversations);
  const user = useSelector((state) => state.auth.user);

  if (!user) {
    return (
      <div className="panier-empty">
        <h2>Messagerie</h2>
        <p>Connecte-toi pour voir tes messages.</p>
        <Link to="/login" className="btn-primary">Se connecter</Link>
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="panier-empty">
        <h2>Messagerie</h2>
        <p>Aucune conversation pour le moment. Contacte un vendeur depuis un produit.</p>
        <Link to="/catalogue" className="btn-primary">Voir le catalogue</Link>
      </div>
    );
  }

  return (
    <div className="messagerie">
      <h2>Messagerie</h2>
      <div className="conv-list">
        {conversations.map((conv) => (
          <div key={conv.id} className="conv-card">
            <div className="conv-avatar">{conv.with.charAt(0)}</div>
            <div className="conv-info">
              <strong>{conv.with}</strong>
              <p className="conv-produit">À propos : {conv.productName}</p>
              <p className="conv-preview">{conv.messages[conv.messages.length - 1]?.text}</p>
            </div>
            <span className="conv-date">
              {new Date(conv.messages[conv.messages.length - 1]?.date).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Messagerie;
