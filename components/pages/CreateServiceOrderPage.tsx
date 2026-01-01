
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewServiceOrder, NewOrderDetail, SuggestedService, Client, Car } from '../../types';
import { suggestServicesWithAI } from '../../services/geminiService';
import { PlusIcon, TrashIcon, SparklesIcon, UserPlusIcon, MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/24/outline';
import AddClientAndCarModal from '../modals/AddClientAndCarModal';
import SelectServicesModal from '../modals/SelectServicesModal';
import AddCarModal from '../modals/AddCarModal';
import { useClients } from '../../hooks/useClients';
import { useCars } from '../../hooks/useCars';
import { useCarGroups } from '../../hooks/useCarGroups';
import { useMasters } from '../../hooks/useMasters';
import { useServices } from '../../hooks/useServices';
import { useServiceOrders } from '../../hooks/useServiceOrders';

type OrderService = {
    serviceID: string;
    name: string;
    quantity: number;
    cost: number;
};

const CreateServiceOrderPage: React.FC = () => {
    const navigate = useNavigate();

    const { clients } = useClients();
    const { cars } = useCars();
    const { carGroups } = useCarGroups();
    const { masters } = useMasters();
    const { services: priceList, getSmartPrice } = useServices(cars, carGroups);
    const { addServiceOrder } = useServiceOrders();

    // Form state
    const [clientID, setClientID] = useState('');
    const [carID, setCarID] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState(new Date().toTimeString().substring(0, 5));
    const [mileage, setMileage] = useState('');
    const [reason, setReason] = useState('');
    const [orderServices, setOrderServices] = useState<OrderService[]>([]);
    const [masterIDs, setMasterIDs] = useState<string[]>([]);

    // UI State for modals
    const [isAddClientCarModalOpen, setIsAddClientCarModalOpen] = useState(false);
    const [isSelectServiceModalOpen, setIsSelectServiceModalOpen] = useState(false);
    const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);

    // UI State for new search functionality
    const [searchTerm, setSearchTerm] = useState('');
    const searchRef = useRef<HTMLDivElement>(null);
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    // AI State
    const [suggestions, setSuggestions] = useState<SuggestedService[]>([]);
    const [isAISuggesting, setIsAISuggesting] = useState(false);

    const selectedClient = useMemo(() => clients.find(c => c.clientID === clientID), [clients, clientID]);
    const clientCars = useMemo(() => cars.filter(car => car.ownerID === clientID), [cars, clientID]);

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        const lowerSearch = searchTerm.toLowerCase().trim();
        if (lowerSearch.length < 2) return [];

        const clientsMap = new Map<string, { client: Client; matchingCar: Car | null }>();

        // 1. Search by car number
        cars.forEach(car => {
            if (car.licensePlate.toLowerCase().includes(lowerSearch)) {
                const client = clients.find(c => c.clientID === car.ownerID);
                if (client && !clientsMap.has(client.clientID)) {
                    clientsMap.set(client.clientID, { client, matchingCar: car });
                }
            }
        });

        // 2. Search by client name or phone
        clients.forEach(client => {
            if (
                client.phone.includes(searchTerm.trim()) ||
                client.firstName.toLowerCase().includes(lowerSearch) ||
                client.lastName.toLowerCase().includes(lowerSearch)
            ) {
                if (!clientsMap.has(client.clientID)) {
                    clientsMap.set(client.clientID, { client, matchingCar: null });
                }
            }
        });

        return Array.from(clientsMap.values());
    }, [searchTerm, clients, cars]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMasterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        if (checked) {
            setMasterIDs(prev => [...prev, value]);
        } else {
            setMasterIDs(prev => prev.filter(id => id !== value));
        }
    };

    const handleClientAndCarAdded = (newClientId: string, newCarId: string) => {
        setClientID(newClientId);
        setCarID(newCarId);
        setIsAddClientCarModalOpen(false);
        setSearchTerm('');
    };

    const handleCarAdded = (newCarId: string) => {
        setCarID(newCarId);
        setIsAddCarModalOpen(false);
    };

    const handleClientSelect = (result: { client: Client, matchingCar: Car | null }) => {
        setClientID(result.client.clientID);
        if (result.matchingCar) {
            setCarID(result.matchingCar.carID);
        } else {
            const carsOfClient = cars.filter(c => c.ownerID === result.client.clientID);
            if (carsOfClient.length === 1) {
                setCarID(carsOfClient[0].carID);
            } else {
                setCarID('');
            }
        }
        setSearchTerm('');
        setIsSearchFocused(false);
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

    const handleServicesSelected = (selected: { serviceID: string, quantity: number }[]) => {
        const newServices: OrderService[] = selected.map(({ serviceID, quantity }) => {
            const serviceInfo = priceList.find(s => s.serviceID === serviceID);
            const { price } = getSmartPrice(serviceID, carID || null);
            return {
                serviceID,
                name: serviceInfo?.name || 'Невідома послуга',
                quantity,
                cost: price,
            };
        });

        setOrderServices(prev => {
            const existingIds = new Set(prev.map(s => s.serviceID));
            const trulyNewServices = newServices.filter(s => !existingIds.has(s.serviceID));
            return [...prev, ...trulyNewServices];
        });
        setIsSelectServiceModalOpen(false);
    };

    const handleRemoveService = (serviceID: string) => {
        setOrderServices(prev => prev.filter(s => s.serviceID !== serviceID));
    };

    const handleQuantityChange = (serviceID: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        setOrderServices(prev => prev.map(s => s.serviceID === serviceID ? { ...s, quantity: newQuantity } : s));
    };

    const totalCost = useMemo(() => {
        return orderServices.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    }, [orderServices]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!clientID || !carID || !date || !time || !reason || masterIDs.length === 0) {
            alert('Будь ласка, заповніть усі обов\'язкові поля та оберіть хоча б одного майстра.');
            return;
        }

        const newOrder: NewServiceOrder = { clientID, carID, date, time, mileage: mileage ? Number(mileage) : undefined, reason, masterIDs };
        const newDetails: NewOrderDetail[] = orderServices.map(({ serviceID, quantity, cost }) => ({ serviceID, quantity, cost }));

        if (newDetails.length === 0) {
            alert("Будь ласка, додайте хоча б одну послугу до замовлення.");
            return;
        }

        try {
            const newOrderId = await addServiceOrder(newOrder, newDetails);
            alert(`Замовлення успішно створено!`);
            navigate('/orders');
        } catch (error) {
            console.error("Failed to create service order:", error);
            alert("Не вдалося створити замовлення. Спробуйте ще раз.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <AddClientAndCarModal
                isOpen={isAddClientCarModalOpen}
                onClose={() => setIsAddClientCarModalOpen(false)}
                onClientAndCarAdded={handleClientAndCarAdded}
                initialSearchTerm={searchTerm}
            />
            <SelectServicesModal
                isOpen={isSelectServiceModalOpen}
                onClose={() => setIsSelectServiceModalOpen(false)}
                onServicesSelected={handleServicesSelected}
                alreadyAddedServiceIds={orderServices.map(s => s.serviceID)}
                carIdForPricing={carID || null}
            />
            <AddCarModal
                isOpen={isAddCarModalOpen}
                onClose={() => setIsAddCarModalOpen(false)}
                onCarAdded={handleCarAdded}
                ownerId={clientID}
            />
            <form onSubmit={handleSubmit} className="space-y-6 bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20">
                <h1 className="text-3xl font-extrabold text-slate-800 border-b border-slate-200 pb-4">Створити нове замовлення-наряд</h1>

                {/* Client and Car Section */}
                <div className="p-6 bg-white/50 rounded-2xl border border-white/60 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Клієнт та Автомобіль</h2>
                    {!clientID ? (
                        <div ref={searchRef}>
                            <label htmlFor="client-search" className="block text-sm font-bold text-slate-700 mb-2">
                                Пошук клієнта (за ім'ям, телефоном, держ. номером авто)
                            </label>
                            <div className="relative mt-1">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    id="client-search"
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500 shadow-sm outline-none transition-shadow"
                                    placeholder="Почніть вводити..."
                                    autoComplete="off"
                                />
                            </div>
                            {isSearchFocused && searchTerm && (
                                <div className="relative">
                                    <div className="absolute w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-20 max-h-60 overflow-y-auto">
                                        {searchResults.length > 0 ? (
                                            <ul>
                                                {searchResults.map(({ client, matchingCar }) => (
                                                    <li key={client.clientID}>
                                                        <button type="button" onClick={() => handleClientSelect({ client, matchingCar })} className="w-full text-left px-5 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors">
                                                            <p className="font-bold text-slate-800">{client.firstName} {client.lastName}</p>
                                                            <p className="text-sm text-slate-500">{client.phone}</p>
                                                            {matchingCar && <p className="text-xs text-blue-600 font-medium mt-0.5">Знайдено за авто: {matchingCar.licensePlate}</p>}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="p-6 text-center">
                                                <p className="text-slate-500 mb-3">Клієнта не знайдено.</p>
                                                <button type="button" onClick={() => setIsAddClientCarModalOpen(true)} className="text-blue-600 hover:text-blue-800 font-semibold flex items-center justify-center mx-auto bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                                                    <UserPlusIcon className="w-5 h-5 mr-2" />
                                                    Створити нового клієнта та авто
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Клієнт</p>
                                    <p className="font-bold text-xl text-slate-800 mt-1">{selectedClient?.firstName} {selectedClient?.lastName}</p>
                                    <p className="text-slate-500">{selectedClient?.phone}</p>
                                </div>
                                <button type="button" onClick={() => { setClientID(''); setCarID(''); }} className="flex items-center text-sm font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">
                                    <XCircleIcon className="w-5 h-5 mr-1.5" /> Змінити
                                </button>
                            </div>
                            <div className="mt-5 pt-5 border-t border-slate-100">
                                <label htmlFor="car-select" className="block text-sm font-bold text-slate-700 mb-2">Автомобіль <span className="text-rose-500">*</span></label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-grow">
                                        <select
                                            id="car-select"
                                            value={carID}
                                            onChange={(e) => setCarID(e.target.value)}
                                            className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium"
                                            required
                                        >
                                            <option value="" disabled>Оберіть автомобіль...</option>
                                            {clientCars.map(car => (
                                                <option key={car.carID} value={car.carID}>
                                                    {car.make} {car.model} ({car.licensePlate})
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setIsAddCarModalOpen(true)} className="p-3 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors">
                                        <PlusIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Details */}
                <div className="p-6 bg-white/50 rounded-2xl border border-white/60 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Деталі замовлення</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label htmlFor="date" className="block text-sm font-bold text-slate-700 mb-2">Дата <span className="text-rose-500">*</span></label>
                            <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" required />
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-bold text-slate-700 mb-2">Час <span className="text-rose-500">*</span></label>
                            <input id="time" type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" required />
                        </div>
                        <div>
                            <label htmlFor="mileage" className="block text-sm font-bold text-slate-700 mb-2">Пробіг (км)</label>
                            <input id="mileage" type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="150000" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
                        </div>
                    </div>
                    <div className="mt-6">
                        <label htmlFor="reason" className="block text-sm font-bold text-slate-700 mb-2">Причина звернення / Скарги <span className="text-rose-500">*</span></label>
                        <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm placeholder-slate-400" placeholder="Опишіть проблему..." required></textarea>
                    </div>
                </div>
                {/* AI Suggestions */}
                <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-bold text-indigo-900 flex items-center"><SparklesIcon className="w-6 h-6 mr-2 text-indigo-500" />AI Помічник</h4>
                        <button type="button" onClick={handleGetAISuggestions} disabled={isAISuggesting || !reason || !mileage} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                            {isAISuggesting ? 'Аналіз...' : 'Отримати рекомендації'}
                        </button>
                    </div>
                    {suggestions.length > 0 ? (
                        <div className="mt-4 bg-white/60 p-4 rounded-xl border border-indigo-100/50">
                            <p className="text-sm font-bold text-indigo-800 mb-2">Рекомендовані послуги:</p>
                            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1.5">
                                {suggestions.map((s, i) => <li key={i}><span className="font-semibold">{s.serviceName}</span>: <span className="text-slate-600">{s.reason}</span></li>)}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-sm text-indigo-400 italic">Заповніть пробіг та причину звернення, щоб отримати поради.</p>
                    )}
                </div>

                {/* Masters Section */}
                <div className="p-6 bg-white/50 rounded-2xl border border-white/60 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Призначити майстрів <span className="text-rose-500">*</span></h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {masters.map(master => (
                            <label key={master.masterID} className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer border transition-all ${masterIDs.includes(master.masterID) ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
                                <input
                                    type="checkbox"
                                    value={master.masterID}
                                    checked={masterIDs.includes(master.masterID)}
                                    onChange={handleMasterChange}
                                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm font-medium text-slate-700">{master.name}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Services Section */}
                <div className="p-6 bg-white/50 rounded-2xl border border-white/60 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800">Послуги та Роботи</h2>
                        <button type="button" onClick={() => setIsSelectServiceModalOpen(true)} disabled={!carID} className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center">
                            <PlusIcon className="w-5 h-5 mr-1.5" />
                            Додати
                        </button>
                    </div>
                    <div className="space-y-3">
                        {orderServices.length > 0 ? (
                            orderServices.map(service => (
                                <div key={service.serviceID} className="grid grid-cols-12 gap-4 items-center p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <div className="col-span-12 sm:col-span-6 font-medium text-slate-800">{service.name}</div>
                                    <div className="col-span-4 sm:col-span-2">
                                        <input type="number" value={service.quantity} onChange={e => handleQuantityChange(service.serviceID, parseInt(e.target.value))} className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold" min="1" />
                                    </div>
                                    <div className="col-span-6 sm:col-span-3 text-right font-bold text-slate-800">{(service.cost * service.quantity).toFixed(2)} грн</div>
                                    <div className="col-span-2 sm:col-span-1 flex justify-end">
                                        <button type="button" onClick={() => handleRemoveService(service.serviceID)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                                <p className="text-slate-500 font-medium">Не додано жодної послуги.</p>
                                {!carID && <p className="text-sm text-slate-400 mt-1">Спочатку оберіть автомобіль.</p>}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer with Total and Submit */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-6 border-t border-slate-200">
                    <div className="mb-4 sm:mb-0">
                        <span className="text-lg font-bold text-slate-600">Загальна сума: </span>
                        <span className="text-3xl font-extrabold text-blue-600 ml-2">{totalCost.toFixed(2)} <span className="text-lg text-slate-400 font-normal">грн</span></span>
                    </div>
                    <div className="flex space-x-4 w-full sm:w-auto">
                        <button type="button" onClick={() => navigate('/orders')} className="w-1/2 sm:w-auto px-6 py-3 bg-white text-slate-600 border border-slate-300 rounded-xl font-bold hover:bg-slate-50 transition-colors">Скасувати</button>
                        <button type="submit" className="w-1/2 sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 font-bold transition-all transform hover:-translate-y-0.5">Створити замовлення</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateServiceOrderPage;
