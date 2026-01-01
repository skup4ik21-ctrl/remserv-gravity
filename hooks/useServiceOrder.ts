
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot, collection, query, where, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { ServiceOrder, OrderDetail } from '../types';

export const useServiceOrder = (orderId: string | undefined) => {
    const [order, setOrder] = useState<ServiceOrder | null>(null);
    const [details, setDetails] = useState<OrderDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }

        setLoading(true);

        const orderUnsubscribe = onSnapshot(doc(db, 'serviceOrders', orderId),
            (docSnap) => {
                if (docSnap.exists()) {
                    setOrder({ orderID: docSnap.id, ...docSnap.data() } as ServiceOrder);
                } else {
                    setOrder(null);
                    setError("Замовлення не знайдено");
                }
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching order:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        const detailsQuery = query(collection(db, 'orderDetails'), where('orderID', '==', orderId));
        const detailsUnsubscribe = onSnapshot(detailsQuery,
            (snapshot) => {
                setDetails(snapshot.docs.map(d => ({ detailID: d.id, ...d.data() } as OrderDetail)));
            },
            (err) => {
                console.error("Error fetching order details:", err);
            }
        );

        return () => {
            orderUnsubscribe();
            detailsUnsubscribe();
        };
    }, [orderId]);

    const updateOrder = async (data: Partial<ServiceOrder>) => {
        if (!orderId) return;
        await updateDoc(doc(db, 'serviceOrders', orderId), data);
    };

    const addOrderDetails = async (newDetails: any[]) => {
        if (!orderId) return;
        const promises = newDetails.map(d => addDoc(collection(db, 'orderDetails'), { ...d, orderID: orderId }));
        await Promise.all(promises);
    };

    const updateOrderDetail = async (detailID: string, data: any) => {
        await updateDoc(doc(db, 'orderDetails', detailID), data);
    };

    const deleteOrderDetail = async (detailID: string) => {
        await deleteDoc(doc(db, 'orderDetails', detailID));
    };

    const deleteOrder = async () => {
        if (!orderId) return;
        await deleteDoc(doc(db, 'serviceOrders', orderId));
    };

    return {
        order,
        details,
        loading,
        error,
        updateOrder,
        deleteOrder,
        addOrderDetails,
        updateOrderDetail,
        deleteOrderDetail
    };
};
