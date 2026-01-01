
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Client, NewClient } from '../types';

export const useClients = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'clients'), orderBy('lastName', 'asc'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                setClients(snapshot.docs.map(doc => ({ clientID: doc.id, ...doc.data() } as Client)));
                setLoading(false);
            },
            (err) => {
                console.error("Firebase clients error:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const addClient = async (client: NewClient) => {
        const docRef = await addDoc(collection(db, 'clients'), client);
        return docRef.id;
    };

    const updateClient = async (client: Client) => {
        const { clientID, ...data } = client;
        await updateDoc(doc(db, 'clients', clientID), data);
    };

    const deleteClient = async (id: string) => {
        await deleteDoc(doc(db, 'clients', id));
    };

    return { clients, loading, error, addClient, updateClient, deleteClient };
};
