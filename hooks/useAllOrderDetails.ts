
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { OrderDetail } from '../types';

export const useAllOrderDetails = (orderIds?: string[]) => {
    const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orderIds && orderIds.length === 0) {
            setOrderDetails([]);
            setLoading(false);
            return;
        }

        let q = query(collection(db, 'orderDetails'));

        // Firestore 'in' operator is limited to 30 items
        if (orderIds && orderIds.length > 0) {
            // If many orders, we might need to chunk this or just fetch all
            // For now, let's just fetch all if it's too many or not provided
            if (orderIds.length <= 30) {
                q = query(collection(db, 'orderDetails'), where('orderID', 'in', orderIds));
            }
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setOrderDetails(snapshot.docs.map(doc => ({ ...doc.data(), detailID: doc.id } as OrderDetail)));
            setLoading(false);
        });

        return () => unsubscribe();
    }, [orderIds]);

    return { orderDetails, loading };
};
