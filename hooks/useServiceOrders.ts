
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
import { ServiceOrder, NewServiceOrder, NewOrderDetail, OrderStatus } from '../types';

export const useServiceOrders = (limitCount: number = 100) => {
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const q = query(
            collection(db, 'serviceOrders'),
            orderBy('date', 'desc'),
            limit(limitCount)
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                setOrders(snapshot.docs.map(doc => ({ orderID: doc.id, ...doc.data() } as ServiceOrder)));
                setLoading(false);
            },
            (err) => {
                console.error("Firebase orders error:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [limitCount]);

    const addServiceOrder = async (order: NewServiceOrder, details: NewOrderDetail[]) => {
        const docRef = await addDoc(collection(db, 'serviceOrders'), {
            ...order,
            status: OrderStatus.New,
            isStockDeducted: false
        });

        if (details.length > 0) {
            const batch = writeBatch(db);
            details.forEach(d => {
                const detailRef = doc(collection(db, 'orderDetails'));
                batch.set(detailRef, { ...d, orderID: docRef.id });
            });
            await batch.commit();
        }
        return docRef.id;
    };

    const updateServiceOrder = async (order: ServiceOrder) => {
        const { orderID, ...data } = order;
        await updateDoc(doc(db, 'serviceOrders', orderID), data);
    };

    const deleteServiceOrder = async (orderID: string) => {
        await deleteDoc(doc(db, 'serviceOrders', orderID));
    };

    const addOrderDetails = async (orderID: string, details: NewOrderDetail[]) => {
        if (details.length === 0) return;
        const batch = writeBatch(db);
        details.forEach(d => {
            const detailRef = doc(collection(db, 'orderDetails'));
            batch.set(detailRef, { ...d, orderID });
        });
        await batch.commit();
    };

    return { orders, loading, error, addServiceOrder, updateServiceOrder, deleteServiceOrder, addOrderDetails };
};
