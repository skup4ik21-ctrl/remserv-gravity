import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Car, NewCar } from '../types';

export const useCars = () => {
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'cars'));

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                setCars(snapshot.docs.map(doc => ({ carID: doc.id, ...doc.data() } as Car)));
                setLoading(false);
            },
            (err) => {
                console.error("Firebase cars error:", err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const addCar = async (car: NewCar) => {
        const docRef = await addDoc(collection(db, 'cars'), car);
        return docRef.id;
    };

    const updateCar = async (car: Car) => {
        const { carID, ...data } = car;
        await updateDoc(doc(db, 'cars', carID), data);
    };

    const deleteCar = async (id: string) => {
        await deleteDoc(doc(db, 'cars', id));
    };

    return { cars, loading, error, addCar, updateCar, deleteCar };
};
