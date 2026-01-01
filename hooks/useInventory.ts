
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, limit, addDoc } from 'firebase/firestore';
import { InventoryItem, WarehouseTransaction } from '../types';

export const useInventory = () => {
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [transactions, setTransactions] = useState<WarehouseTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);

        const unsubInventory = onSnapshot(collection(db, 'inventory'),
            (s) => setInventory(s.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem))),
            (err) => { console.error("Inventory error", err); setError(err.message); }
        );

        const unsubTransactions = onSnapshot(query(collection(db, 'warehouseTransactions'), orderBy('date', 'desc'), limit(50)),
            (s) => {
                setTransactions(s.docs.map(d => ({ id: d.id, ...d.data() } as WarehouseTransaction)));
                setLoading(false);
            },
            (err) => { console.error("Transactions error", err); setError(err.message); }
        );

        return () => {
            unsubInventory();
            unsubTransactions();
        };
    }, []);

    const addWarehouseTransaction = async (transaction: any) => {
        await addDoc(collection(db, 'warehouseTransactions'), transaction);
    };

    return { inventory, transactions, loading, error, addWarehouseTransaction };
};
