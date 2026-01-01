import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../ui/Modal';
import { NewServiceOrder, NewOrderDetail, SuggestedService } from '../../types';
import { suggestServicesWithAI } from '../../services/geminiService';
import { PlusIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useClients } from '../../hooks/useClients';
import { useCars } from '../../hooks/useCars';
import { useServices } from '../../hooks/useServices';
import { useMasters } from '../../hooks/useMasters';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import { useCarGroups } from '../../hooks/useCarGroups';

interface AddServiceOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ServiceLineItem = {
    id: string; // temporary unique id for react key
    serviceID: string;
    masterID: string;
    quantity: number;
    cost: number;
};

const AddServiceOrderModal: React.FC<AddServiceOrderModalProps> = ({ isOpen, onClose }) => {
    const { clients } = useClients();
    const { cars } = useCars();
    const { carGroups } = useCarGroups();
    const { services: priceList, getSmartPrice } = useServices(cars, carGroups);
    const { masters } = useMasters();
    const { addServiceOrder } = useServiceOrders();

    // Form state
    const [clientID, setClientID] = useState('');
    const [carID, setCarID] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(new Date().toTimeString().substring(0, 5));
    const [mileage, setMileage] = useState('');
    const [reason, setReason] = useState('');
    const [serviceItems, setServiceItems] = useState<ServiceLineItem[]>([]);

    // AI State
    const [suggestions, setSuggestions] = useState<SuggestedService[]>([]);
    const [isAISuggesting, setIsAISuggesting] = useState(false);

    const clientCars = useMemo(() => cars.filter(car => car.ownerID === clientID), [clientID, cars]);

    useEffect(() => {
        setCarID(''); // Reset car selection when client changes
    }, [clientID]);

    const resetForm = () => {
        setClientID('');
        setCarID('');
        setDate(new Date().toISOString().split('T')[0]);
        setTime(new Date().toTimeString().substring(0, 5));
        setMileage('');
        setReason('');
        setServiceItems([]);
        setSuggestions([]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleAddService = () => {
        setServiceItems(prev => [
            ...prev,
            { id: `temp-${Date.now()}`, serviceID: '', masterID: '', quantity: 1, cost: 0 }
        ]);
    };

    const handleRemoveService = (id: string) => {
        setServiceItems(prev => prev.filter(item => item.id !== id));
    };

    const handleServiceItemChange = (id: string, field: keyof ServiceLineItem, value: string | number) => {
        setServiceItems(prev => prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'serviceID') {
                    const { price } = getSmartPrice(value as string, carID || null);
                    updatedItem.cost = price;
                }
                if (field === 'quantity') {
                    updatedItem.quantity = Math.max(1, Number(value));
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const handleGetAISuggestions = async () => {
        if (!mileage || !reason) {
            alert('Будь ласка, вкажіть пробіг та причину звернення для отримання рекомендацій.');
            return;
        }
        setIsAISuggesting(true);
        setSuggestions([]);
        try {
            const result = await suggestServicesWithAI(Number(mileage), reason);
            setSuggestions(result);
        } catch (error) {
            console.error("AI suggestion failed:", error);
            alert("Не вдалося отримати рекомендації від AI.");
        } finally {
            setIsAISuggesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientID || !carID || !date || !time || !reason || serviceItems.length === 0) {
            alert('Будь ласка, заповніть усі обов\'язкові поля та додайте хоча б одну послугу.');
            return;
        }

        const masterIDs: string[] = [...new Set<string>(serviceItems.map(item => item.masterID).filter(id => !!id))];

        const newOrder: NewServiceOrder = { clientID, carID, date, time, mileage: mileage ? Number(mileage) : undefined, reason, masterIDs };
        const newDetails: NewOrderDetail[] = serviceItems
            .filter(item => item.serviceID && item.masterID)
            .map(({ serviceID, quantity, cost }) => ({ serviceID, quantity, cost }));

        if (newDetails.length !== serviceItems.length) {
            alert("Будь ласка, для кожної доданої послуги оберіть назву та майстра.");
            return;
        }

        addServiceOrder(newOrder, newDetails);
        handleClose();
    };

    const totalCost = useMemo(() => {
        return serviceItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    }, [serviceItems]);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Створити нове замовлення-наряд" size="xl">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Клієнт <span className="text-red-500">*</span></label>
                        <select value={clientID} onChange={e => setClientID(e.target.value)} className="input" required>
                            <option value="" disabled>Оберіть клієнта</option>
                            {clients.map(c => <option key={c.clientID} value={c.clientID}>{c.firstName} {c.lastName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Автомобіль <span className="text-red-500">*</span></label>
                        <select value={carID} onChange={e => setCarID(e.target.value)} className="input" required disabled={!clientID}>
                            <option value="" disabled>Оберіть автомобіль</option>
                            {clientCars.map(c => <option key={c.carID} value={c.carID}>{c.make} {c.model} ({c.licensePlate})</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Дата <span className="text-red-500">*</span></label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Час <span className="text-red-500">*</span></label>
                        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Пробіг (км)</label>
                        <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="150000" className="input" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Причина звернення / Скарги <span className="text-red-500">*</span></label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} className="input" placeholder="Щось стукає спереду..." required></textarea>
                </div>

                {/* AI Suggestions */}
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <div className="flex items-center justify-between">
                        <h4 className="text-md font-bold text-indigo-800 flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-indigo-500" />AI Помічник</h4>
                        <button type="button" onClick={handleGetAISuggestions} disabled={isAISuggesting} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm">
                            {isAISuggesting ? 'Аналіз...' : 'Рекомендації'}
                        </button>
                    </div>
                    {suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                            <p className="text-sm font-medium text-indigo-900">На основі скарг, ми рекомендуємо:</p>
                            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                                {suggestions.map((s, i) => <li key={i}><span className="font-semibold">{s.serviceName}</span>: {s.reason}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Service Items */}
                <div>
                    <h4 className="text-lg font-bold text-slate-800 mt-2">Послуги та Роботи</h4>
                    <div className="space-y-3 mt-3 max-h-48 overflow-y-auto pr-2">
                        {serviceItems.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="col-span-6">
                                    {index === 0 && <label className="text-xs font-bold text-slate-500 uppercase">Послуга</label>}
                                    <select value={item.serviceID} onChange={e => handleServiceItemChange(item.id, 'serviceID', e.target.value)} className="w-full input text-sm" required>
                                        <option value="" disabled>Оберіть послугу</option>
                                        {priceList.map(s => <option key={s.serviceID} value={s.serviceID}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    {index === 0 && <label className="text-xs font-bold text-slate-500 uppercase">Майстер</label>}
                                    <select value={item.masterID} onChange={e => handleServiceItemChange(item.id, 'masterID', e.target.value)} className="w-full input text-sm" required>
                                        <option value="" disabled>Оберіть майстра</option>
                                        {masters.map(m => <option key={m.masterID} value={m.masterID}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    {index === 0 && <label className="text-xs font-bold text-slate-500 uppercase">К-ть</label>}
                                    <input type="number" value={item.quantity} onChange={e => handleServiceItemChange(item.id, 'quantity', e.target.value)} className="w-full input text-sm text-center" min="1" />
                                </div>
                                <div className="col-span-1 text-right">
                                    {index === 0 && <label className="text-xs font-bold text-slate-500 uppercase">Сума</label>}
                                    <p className="text-sm pt-2 font-bold text-slate-800">{(item.cost * item.quantity).toFixed(2)}</p>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    {index === 0 && <div className="h-4"></div>}
                                    <button type="button" onClick={() => handleRemoveService(item.id)} className="text-rose-500 hover:text-rose-700 bg-rose-50 p-1.5 rounded-lg mt-1 transition-colors">
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddService} className="mt-3 text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center text-sm font-bold transition-colors">
                        <PlusIcon className="w-4 h-4 mr-1.5" /> Додати послугу
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-between items-center border-t border-slate-200 pt-5">
                    <div>
                        <span className="text-lg font-bold text-slate-600">Загальна сума: </span>
                        <span className="text-2xl font-extrabold text-blue-600">{totalCost.toFixed(2)} <span className="text-lg font-normal text-slate-400">грн</span></span>
                    </div>
                    <div className="flex space-x-3">
                        <button type="button" onClick={handleClose} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors">Скасувати</button>
                        <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-red-600 transition-all transform hover:-translate-y-0.5">Створити</button>
                    </div>
                </div>
            </form>
            <style>{`
            .input {
                display: block;
                width: 100%;
                padding: 0.625rem 0.875rem;
                background-color: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 0.75rem;
                box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                color: #1e293b;
                transition: all 0.2s;
            }
            .input::placeholder {
                color: #94a3b8;
            }
            .input:focus {
                outline: none;
                --tw-ring-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
                border-color: #3b82f6;
            }
            `}</style>
        </Modal>
    );
};

export default AddServiceOrderModal;
