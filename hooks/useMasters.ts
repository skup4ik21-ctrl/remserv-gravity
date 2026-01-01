import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Master, NewMaster } from '../types';

export const useMasters = () => {
    const [masters, setMasters] = useState<Master[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'masters'),
            (snapshot) => {
                setMasters(snapshot.docs.map(doc => ({ masterID: doc.id, ...doc.data() } as Master)));
                setLoading(false);
            },
            (err) => {
                console.error("Firebase masters error:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const addMaster = async (master: NewMaster) => {
        const docRef = await addDoc(collection(db, 'masters'), master);
        return docRef.id;
    };

    const updateMaster = async (master: Master) => {
        const { masterID, ...data } = master;
        await updateDoc(doc(db, 'masters', masterID), data);
    };

    const deleteMaster = async (id: string) => {
        await deleteDoc(doc(db, 'masters', id));
    };

    return { masters, loading, error, addMaster, updateMaster, deleteMaster };
};
