import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Service, ServiceCategory, Car, CarGroup } from '../../types';
import { MagnifyingGlassIcon, PlusIcon, MinusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import AddEditServiceModal from './AddEditServiceModal';
import { useServices } from '../../hooks/useServices';
import { useCars } from '../../hooks/useCars';
import { useCarGroups } from '../../hooks/useCarGroups';

interface SelectServicesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onServicesSelected: (services: { serviceID: string, quantity: number }[]) => void;
    alreadyAddedServiceIds: string[];
    carIdForPricing: string | null;
}

type SelectedService = {
    serviceID: string;
    name: string;
    price: number;
    quantity: number;
};

const categories = Object.values(ServiceCategory);

const SelectServicesModal: React.FC<SelectServicesModalProps> = ({ isOpen, onClose, onServicesSelected, alreadyAddedServiceIds, carIdForPricing }) => {
    const { cars } = useCars();
    const { carGroups } = useCarGroups();
    const { services: priceList, getSmartPrice } = useServices(cars, carGroups);

    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedServices, setSelectedServices] = useState<Record<string, SelectedService>>({});
    const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSelectedServices({});
            setSearchTerm('');
            setSelectedCategory('all');
        }
    }, [isOpen]);

    const availableServices = useMemo(() => {
        return priceList
            .filter(service => !alreadyAddedServiceIds.includes(service.serviceID))
            .filter(service => {
                if (selectedCategory === 'all') return true;
                return service.category === selectedCategory;
            })
            .filter(service => {
                if (!searchTerm) return true;
                return service.name.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .map(service => {
                const { price, source } = getSmartPrice(service.serviceID, carIdForPricing);
                return { ...service, price, priceSource: source };
            });
    }, [priceList, alreadyAddedServiceIds, selectedCategory, searchTerm, getSmartPrice, carIdForPricing]);

    const handleSelect = (service: any) => {
        setSelectedServices(prev => {
            const existing = prev[service.serviceID];
            if (existing) {
                const newSelected = { ...prev };
                delete newSelected[service.serviceID];
                return newSelected;
            } else {
                return {
                    ...prev,
                    [service.serviceID]: {
                        serviceID: service.serviceID,
                        name: service.name,
                        price: service.price,
                        quantity: 1
                    }
                };
            }
        });
    };

    const handleQuantityChange = (serviceID: string, change: number) => {
        setSelectedServices((prev: Record<string, SelectedService>) => {
            const service = prev[serviceID];
            if (!service) return prev;
            const newQuantity = service.quantity + change;
            if (newQuantity < 1) return prev;
            return {
                ...prev,
                [serviceID]: { ...service, quantity: newQuantity }
            };
        });
    };

    const handleSubmit = () => {
        const result = (Object.values(selectedServices) as SelectedService[]).map(({ serviceID, quantity }) => ({ serviceID, quantity }));
        if (result.length === 0) return;
        onServicesSelected(result);
        onClose();
    };

    const handleNewServiceAdded = (newService: Service) => {
        const { price } = getSmartPrice(newService.serviceID, carIdForPricing);
        handleSelect({ ...newService, price });
        setIsAddServiceModalOpen(false);
    };

    const totalCost = useMemo(() => {
        return (Object.values(selectedServices) as SelectedService[]).reduce((sum, s) => sum + s.price * s.quantity, 0);
    }, [selectedServices]);

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Додати послуги" size="xl">
                <div className="flex flex-col md:flex-row gap-6 max-h-[70vh]">
                    <div className="w-full md:w-3/5 flex flex-col">
                        <div className="mb-4">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Пошук послуги..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <button onClick={() => setSelectedCategory('all')} className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedCategory === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Всі</button>
                                {categories.map(cat => (
                                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1 rounded-lg text-xs font-bold ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{cat}</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            {availableServices.map(service => (
                                <div
                                    key={service.serviceID}
                                    onClick={() => handleSelect(service)}
                                    className={`flex justify-between items-center p-3 rounded-xl cursor-pointer border transition-all ${selectedServices[service.serviceID] ? 'bg-blue-50 border-blue-400 shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                >
                                    <div>
                                        <p className="font-bold text-sm text-slate-700">{service.name}</p>
                                        <p className="text-xs text-slate-400">{service.category}</p>
                                    </div>
                                    <p className="font-bold text-slate-800">{service.price.toFixed(2)} грн</p>
                                </div>
                            ))}
                            {availableServices.length === 0 && (
                                <div className="text-center py-10">
                                    <p className="text-slate-400 text-sm">Послуг не знайдено</p>
                                    <button onClick={() => setIsAddServiceModalOpen(true)} className="mt-2 text-blue-600 font-bold text-sm hover:underline">+ Створити нову послугу</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-2/5 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center mb-4"><ShoppingCartIcon className="w-5 h-5 mr-2 text-blue-600" />Вибрано</h3>
                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                            {(Object.values(selectedServices) as SelectedService[]).map((s) => (
                                <div key={s.serviceID} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                    <p className="font-bold text-sm text-slate-800">{s.name}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <div className="flex items-center bg-slate-100 rounded-lg p-1">
                                            <button onClick={(e) => { e.stopPropagation(); handleQuantityChange(s.serviceID, -1); }} className="p-1 text-slate-500 hover:bg-white rounded"><MinusIcon className="w-3 h-3" /></button>
                                            <span className="w-8 text-center font-bold text-slate-700 text-sm">{s.quantity}</span>
                                            <button onClick={(e) => { e.stopPropagation(); handleQuantityChange(s.serviceID, 1); }} className="p-1 text-slate-500 hover:bg-white rounded"><PlusIcon className="w-3 h-3" /></button>
                                        </div>
                                        <p className="text-sm font-bold text-blue-600">{(s.price * s.quantity).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                            {Object.keys(selectedServices).length === 0 && (
                                <div className="text-center py-10 opacity-30">
                                    <ShoppingCartIcon className="w-10 h-10 mx-auto mb-2" />
                                    <p className="text-xs">Кошик порожній</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-slate-600">Сума:</span>
                                <span className="text-xl font-extrabold text-blue-600">{totalCost.toFixed(2)} грн</span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                disabled={Object.keys(selectedServices).length === 0}
                            >
                                Додати до замовлення
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
            <AddEditServiceModal
                isOpen={isAddServiceModalOpen}
                onClose={() => setIsAddServiceModalOpen(false)}
                serviceToEdit={null}
                onServiceAdded={handleNewServiceAdded}
                initialName={searchTerm}
            />
        </>
    );
};

export default SelectServicesModal;
