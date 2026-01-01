
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { CarGroup, NewCarGroup } from '../types';

export const useCarGroups = () => {
    const [carGroups, setCarGroups] = useState<CarGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'carGroups'), (snapshot) => {
            setCarGroups(snapshot.docs.map(d => ({ groupId: d.id, ...d.data() } as CarGroup)));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const addCarGroup = async (group: NewCarGroup) => {
        await addDoc(collection(db, 'carGroups'), group);
    };

    const updateCarGroup = async (group: CarGroup) => {
        await updateDoc(doc(db, 'carGroups', group.groupId), { ...group });
    };

    const deleteCarGroup = async (groupId: string) => {
        await deleteDoc(doc(db, 'carGroups', groupId));
    };

    return { carGroups, loading, addCarGroup, updateCarGroup, deleteCarGroup };
};
