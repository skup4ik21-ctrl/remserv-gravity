
import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { Service, NewService, Car, CarGroup } from '../types';

export const useServices = (cars: Car[] = [], carGroups: CarGroup[] = []) => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'services'),
            (snapshot) => {
                setServices(snapshot.docs.map(doc => ({ serviceID: doc.id, ...doc.data() } as Service)));
                setLoading(false);
            },
            (err) => {
                console.error("Firebase services error:", err);
                setError(err.message);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    const getSmartPrice = useCallback((serviceID: string, carID: string | null) => {
        const s = services.find(x => x.serviceID === serviceID);
        if (!s) return { price: 0, source: 'base' as const };
        if (!carID) return { price: s.basePrice, source: 'base' as const };

        const car = cars.find(c => c.carID === carID);
        if (!car) return { price: s.basePrice, source: 'base' as const };

        const group = carGroups.find(g => g.models.some(m =>
            m.make.toLowerCase() === car.make.toLowerCase() &&
            m.model.toLowerCase() === car.model.toLowerCase()
        ));

        if (group && s.priceOverrides?.[group.groupId]) {
            return { price: s.priceOverrides[group.groupId], source: 'group' as const };
        }

        return { price: s.basePrice, source: 'base' as const };
    }, [services, cars, carGroups]);

    const addService = async (s: NewService) => {
        const r = await addDoc(collection(db, 'services'), s);
        return { ...s, serviceID: r.id } as Service;
    };

    const updateService = async (s: Service) => {
        const { serviceID, ...data } = s;
        await updateDoc(doc(db, 'services', serviceID), data);
    };

    const deleteService = async (id: string) => {
        await deleteDoc(doc(db, 'services', id));
    };

    return { services, loading, error, getSmartPrice, addService, updateService, deleteService };
};
