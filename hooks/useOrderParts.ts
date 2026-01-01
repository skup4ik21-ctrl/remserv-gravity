
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Part } from '../types';

export const useOrderParts = (orderId: string | undefined) => {
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!orderId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const q = query(collection(db, 'parts'), where('orderID', '==', orderId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setParts(snapshot.docs.map(d => ({ partID: d.id, ...d.data() } as Part)));
            setLoading(false);
        });
        return () => unsubscribe();
    }, [orderId]);

    const addPart = async (part: any) => {
        await addDoc(collection(db, 'parts'), { ...part, orderID: orderId });
    };

    const addMultipleParts = async (newParts: any[]) => {
        const promises = newParts.map(p => addDoc(collection(db, 'parts'), { ...p, orderID: orderId }));
        await Promise.all(promises);
    };

    const updatePart = async (partID: string, data: any) => {
        await updateDoc(doc(db, 'parts', partID), data);
    };

    const deletePart = async (partID: string) => {
        await deleteDoc(doc(db, 'parts', partID));
    };

    return { parts, loading, addPart, addMultipleParts, updatePart, deletePart };
};
