import { Component } from "react";

/**
 * Filet de sécurité UI : une erreur dans un écran ne doit pas laisser
 * l'utilisateur devant une page blanche.
 */
export default class ErrorBoundary extends Component {
  state = { erreur: null };

  static getDerivedStateFromError(erreur) {
    return { erreur };
  }

  componentDidCatch(erreur, infos) {
    console.error("Erreur non gérée :", erreur, infos?.componentStack);
  }

  render() {
    if (this.state.erreur) {
      return (
        <div className="empty-state" role="alert">
          <span className="empty-emoji" aria-hidden="true">⚠️</span>
          <h2>Quelque chose s'est mal passé</h2>
          <p>Recharge la page. Si le problème persiste, contacte le support Cyrano.</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Recharger la page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
