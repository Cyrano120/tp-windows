import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { setOrders, setLoading } from "../store/ordersSlice";

const statusSteps = ["Reçue", "En cours", "Expédiée", "Livrée"];

function Suivi() {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    const fetchOrders = async () => {
      dispatch(setLoading(true));
      try {
        const snapshot = await getDocs(collection(db, "commandes"));
        const ords = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        dispatch(setOrders(ords));
      } catch {
        console.error("Erreur chargement commandes");
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchOrders();
  }, [dispatch]);

  if (loading) return <div className="loading">Chargement...</div>;

  return (
    <div className="suivi">
      <h2>Suivi de mes commandes</h2>
      {!orders.length && <p>Aucune commande pour le moment.</p>}
      <div className="orders-list">
        {orders.map((order) => {
          const stepIdx = statusSteps.indexOf(order.status);
          return (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <span className="order-id">Commande #{order.id?.slice(0, 8)}</span>
                <span className={`order-status status-${order.status?.toLowerCase().replace(/\s/g, "")}`}>
                  {order.status}
                </span>
              </div>
              <div className="order-steps">
                {statusSteps.map((s, i) => (
                  <div key={s} className={`step ${i <= stepIdx ? "active" : ""}`}>
                    <div className="step-dot" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <div className="order-total">
                Total : <strong>{order.total?.toLocaleString()} FCFA</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Suivi;
