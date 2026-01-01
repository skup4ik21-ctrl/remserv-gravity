import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import { NewOrderDetail, SuggestedService } from '../../types';
import { suggestServicesWithAI } from '../../services/geminiService';
import { PlusIcon, TrashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useServices } from '../../hooks/useServices';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import { useCars } from '../../hooks/useCars';
import { useCarGroups } from '../../hooks/useCarGroups';

interface AddServicesToOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    currentReason: string;
    currentMileage?: number;
}

type ServiceLineItem = {
    id: string; // temporary unique id for react key
    serviceID: string;
    quantity: number;
    cost: number;
};

const AddServicesToOrderModal: React.FC<AddServicesToOrderModalProps> = ({ isOpen, onClose, orderId, currentReason, currentMileage }) => {
    const { cars } = useCars();
    const { carGroups } = useCarGroups();
    const { services: priceList } = useServices(cars, carGroups);
    const { addOrderDetails } = useServiceOrders();

    // Form state
    const [serviceItems, setServiceItems] = useState<ServiceLineItem[]>([]);

    // AI State
    const [suggestions, setSuggestions] = useState<SuggestedService[]>([]);
    const [isAISuggesting, setIsAISuggesting] = useState(false);

    const resetForm = () => {
        setServiceItems([]);
        setSuggestions([]);
        setIsAISuggesting(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleAddService = () => {
        setServiceItems(prev => [
            ...prev,
            { id: `temp-${Date.now()}`, serviceID: '', quantity: 1, cost: 0 }
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
                    const service = priceList.find(s => s.serviceID === value);
                    // FIX: Property 'price' does not exist on type 'Service'. Changed to 'basePrice'.
                    updatedItem.cost = service ? service.basePrice : 0;
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
        if (!currentMileage || !currentReason) {
            alert('Для отримання рекомендацій потрібні дані про пробіг та причину звернення.');
            return;
        }
        setIsAISuggesting(true);
        setSuggestions([]);
        try {
            const result = await suggestServicesWithAI(currentMileage, currentReason);
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
        if (serviceItems.length === 0) {
            alert('Будь ласка, додайте хоча б одну послугу.');
            return;
        }

        const newDetails: NewOrderDetail[] = serviceItems
            .filter(item => item.serviceID)
            .map(({ serviceID, quantity, cost }) => ({ serviceID, quantity, cost }));

        if (newDetails.length !== serviceItems.length) {
            alert("Будь ласка, для кожної доданої послуги оберіть її назву.");
            return;
        }

        addOrderDetails(orderId, newDetails);
        handleClose();
    };

    const totalCost = useMemo(() => {
        return serviceItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    }, [serviceItems]);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Додати послуги до замовлення" size="xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* AI Suggestions */}
                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                    <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-blue-900 flex items-center"><SparklesIcon className="w-5 h-5 mr-2 text-blue-500" />AI Помічник</h4>
                        <button type="button" onClick={handleGetAISuggestions} disabled={isAISuggesting} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 shadow-sm transition-all">
                            {isAISuggesting ? 'Аналіз...' : 'Рекомендації'}
                        </button>
                    </div>
                    {suggestions.length > 0 && (
                        <div className="mt-4 bg-white p-4 rounded-lg border border-blue-100/50">
                            <p className="text-sm font-bold text-slate-800 mb-2">Рекомендовані послуги:</p>
                            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                                {suggestions.map((s, i) => <li key={i}><b>{s.serviceName}</b>: {s.reason}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Service Items */}
                <div className="bg-white/50 border border-slate-200 p-4 rounded-2xl">
                    <h4 className="text-lg font-bold text-slate-800 mb-3">Нові послуги</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {serviceItems.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <div className="col-span-8">
                                    {index === 0 && <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Послуга</label>}
                                    <select value={item.serviceID} onChange={e => handleServiceItemChange(item.id, 'serviceID', e.target.value)} className="w-full input text-sm" required>
                                        <option value="" disabled>Оберіть послугу</option>
                                        {priceList.map(s => <option key={s.serviceID} value={s.serviceID}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    {index === 0 && <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">К-ть</label>}
                                    <input type="number" value={item.quantity} onChange={e => handleServiceItemChange(item.id, 'quantity', e.target.value)} className="w-full input text-sm text-center" min="1" />
                                </div>
                                <div className="col-span-2 text-right">
                                    {index === 0 && <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Сума</label>}
                                    <p className="text-sm pt-2 font-bold text-slate-800">{(item.cost * item.quantity).toFixed(2)}</p>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    {index === 0 && <div className="h-5"></div>}
                                    <button type="button" onClick={() => handleRemoveService(item.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors mt-0.5">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={handleAddService} className="mt-4 text-blue-600 hover:text-blue-800 flex items-center text-sm font-bold bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                        <PlusIcon className="w-5 h-5 mr-2" /> Додати рядок
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-between items-center border-t border-slate-200 pt-5">
                    <div>
                        <span className="text-lg font-bold text-slate-600">Сума до додавання: </span>
                        <span className="text-xl font-extrabold text-blue-600">{totalCost.toFixed(2)} грн</span>
                    </div>
                    <div className="flex space-x-3">
                        <button type="button" onClick={handleClose} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors">Скасувати</button>
                        <button type="submit" className="px-5 py-2.5 bg-orange-500 text-white rounded-xl shadow-lg hover:bg-orange-600 font-bold transition-all transform hover:-translate-y-0.5">Додати</button>
                    </div>
                </div>
            </form>
            <style>{`
            .input {
                display: block; width: 100%; padding: 0.6rem 0.75rem; background-color: #ffffff;
                border: 1px solid #e2e8f0; border-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                color: #1e293b; transition: all 0.2s;
            }
            .input::placeholder { color: #94a3b8; }
            .input:focus {
                outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
            }
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
            `}</style>
        </Modal>
    );
};

export default AddServicesToOrderModal;
