
import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { CompanySettings } from '../types';

export const useCompanySettings = () => {
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(doc(db, 'settings', 'company'),
            (doc) => {
                if (doc.exists()) {
                    setSettings(doc.data() as CompanySettings);
                } else {
                    setSettings(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error("Firebase settings error:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const updateCompanySettings = async (newSettings: Partial<CompanySettings>) => {
        await setDoc(doc(db, 'settings', 'company'), newSettings, { merge: true });
    };

    return { settings, loading, error, updateCompanySettings };
};
