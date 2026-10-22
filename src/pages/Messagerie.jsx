import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { sendMessage } from "../store/messagesSlice";
import toast from "react-hot-toast";

export default function Messagerie() {
  const dispatch = useDispatch();
  const conversations = useSelector((s) => s.messages.conversations);
  const user = useSelector((s) => s.auth.user);
  const [activeId, setActiveId] = useState(null);
  const [reponse, setReponse] = useState("");

  if (!conversations.length) {
    return (
      <div className="empty-state">
        <span className="empty-emoji">💬</span>
        <h2>Messagerie</h2>
        <p>Aucune conversation pour le moment. Contacte un vendeur depuis la page d'un article.</p>
        <Link to="/catalogue" className="btn-primary">Voir le catalogue</Link>
      </div>
    );
  }

  const active = conversations.find((c) => c.id === activeId) || conversations[0];

  const envoyer = (e) => {
    e.preventDefault();
    if (!reponse.trim()) return;
    dispatch(sendMessage({
      productId: active.productId,
      productName: active.productName,
      from: user.email,
      to: active.with,
      text: reponse.trim(),
    }));
    setReponse("");
    toast.success("Message envoyé");
  };

  return (
    <div className="messagerie">
      <h2>Messagerie</h2>
      <div className="chat-layout">
        <aside className="chat-list" aria-label="Conversations">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              className={`conv-card ${active.id === conv.id ? "active" : ""}`}
              onClick={() => setActiveId(conv.id)}
            >
              <div className="conv-avatar" aria-hidden="true">{conv.with.charAt(0).toUpperCase()}</div>
              <div className="conv-info">
                <strong>{conv.with}</strong>
                <p className="conv-produit">À propos : {conv.productName}</p>
                <p className="conv-preview">{conv.messages[conv.messages.length - 1]?.text}</p>
              </div>
            </button>
          ))}
        </aside>

        <section className="chat-panel" aria-label={`Conversation avec ${active.with}`}>
          <header className="chat-header">
            <div>
              <strong>{active.with}</strong>
              <p>{active.productName}</p>
            </div>
            <Link to={`/produit/${active.productId}`} className="btn-secondary btn-sm">Voir l'article</Link>
          </header>

          <div className="chat-messages">
            {active.messages.map((m) => {
              const moi = m.from === user.email;
              return (
                <div key={m.id} className={`chat-bubble ${moi ? "mine" : "theirs"}`}>
                  <p>{m.text}</p>
                  <span>{new Date(m.date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              );
            })}
          </div>

          <form className="chat-form" onSubmit={envoyer}>
            <input
              value={reponse}
              onChange={(e) => setReponse(e.target.value)}
              placeholder="Écrire un message…"
              aria-label="Écrire un message"
            />
            <button type="submit" className="btn-primary btn-sm">Envoyer</button>
          </form>
        </section>
      </div>
    </div>
  );
}
