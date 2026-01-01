
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { CustomSchematic } from '../types';

export const useSchematics = () => {
    const [schematics, setSchematics] = useState<CustomSchematic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'customSchematics'), (snapshot) => {
            setSchematics(snapshot.docs.map(doc => ({ ...doc.data(), schematicID: doc.id } as CustomSchematic)));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const addCustomSchematic = async (schematic: CustomSchematic) => {
        const { schematicID, ...data } = schematic;
        await addDoc(collection(db, 'customSchematics'), data);
    };

    return { schematics, loading, addCustomSchematic };
};
