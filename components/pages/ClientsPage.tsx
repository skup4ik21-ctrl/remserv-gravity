
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, XCircleIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import AddClientModal from '../modals/AddClientModal';
import EditClientModal from '../modals/EditClientModal';
import ConfirmActionModal from './ConfirmDeleteModal';
import { Client, Car, OrderStatus } from '../../types';
import { useClients } from '../../hooks/useClients';
import { useCars } from '../../hooks/useCars';
import { useServiceOrders } from '../../hooks/useServiceOrders';

// Updated status colors constant
const LIGHT_STATUS_COLORS: { [key: string]: string } = {
    [OrderStatus.New]: 'bg-blue-50 text-blue-700',
    [OrderStatus.InProgress]: 'bg-amber-50 text-amber-700',
    [OrderStatus.AwaitingParts]: 'bg-orange-50 text-orange-700',
    [OrderStatus.Completed]: 'bg-emerald-50 text-emerald-700',
    [OrderStatus.Cancelled]: 'bg-rose-50 text-rose-700',
};

const ClientsPage: React.FC = () => {
    const navigate = useNavigate();
    const { clients, loading: clientsLoading, error: clientsError } = useClients();
    const { cars } = useCars();
    const { orders: serviceOrders } = useServiceOrders();

    // Note: orderDetails were empty in context, avoiding usage for now

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'orders' | 'cars'>('orders');

    if (clientsLoading) return <div className="p-10 flex justify-center text-slate-500">Завантаження клієнтів...</div>;
    if (clientsError) return <div className="p-10 text-red-500 bg-red-50 m-6 rounded-2xl border border-red-100 italic">Помилка: {clientsError}</div>;

    const filteredClients = useMemo(() => {
        if (!searchTerm) {
            return clients;
        }

        const searchLower = searchTerm.toLowerCase();

        return clients.filter(client => {
            const clientCars = cars.filter(car => car.ownerID === client.clientID);
            const hasMatchingCar = clientCars.some(car => car.licensePlate.toLowerCase().includes(searchLower));

            return (
                client.firstName.toLowerCase().includes(searchLower) ||
                client.lastName.toLowerCase().includes(searchLower) ||
                client.phone.includes(searchTerm) ||
                hasMatchingCar
            );
        });
    }, [clients, cars, searchTerm]);

    const selectedClientDetails = useMemo(() => {
        if (!selectedClientId) return null;

        const client = clients.find(c => c.clientID === selectedClientId);
        if (!client) return null;

        const clientOrders = serviceOrders
            .filter(order => order.clientID === selectedClientId)
            .map(order => {
                const car = cars.find(c => c.carID === order.carID);
                // const details = orderDetails.filter(d => d.orderID === order.orderID);
                // const totalCost = details.reduce((sum, d) => sum + d.cost * d.quantity, 0);
                const totalCost = 0; // Details not available for list view currently
                return {
                    ...order,
                    carName: car ? `${car.make} ${car.model} (${car.licensePlate})` : 'N/A',
                    totalCost,
                };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const clientCars = cars.filter(car => car.ownerID === selectedClientId);

        return {
            clientName: `${client.firstName} ${client.lastName}`,
            orders: clientOrders,
            cars: clientCars,
        };
    }, [selectedClientId, clients, serviceOrders, cars]);


    const handleEditClick = (e: React.MouseEvent, client: Client) => {
        e.stopPropagation(); // Prevent row click from firing
        setClientToEdit(client);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (e: React.MouseEvent, client: Client) => {
        e.stopPropagation();
        setClientToDelete(client);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (clientToDelete) {
            try {
                await deleteDoc(doc(db, 'clients', clientToDelete.clientID));
                if (selectedClientId === clientToDelete.clientID) {
                    setSelectedClientId(null);
                }
            } catch (error) {
                console.error("Error deleting client:", error);
                alert("Помилка при видаленні клієнта");
            }
        }
        setIsDeleteModalOpen(false);
        setClientToDelete(null);
    };

    const handleRowClick = (clientId: string) => {
        if (selectedClientId !== clientId) {
            setActiveTab('orders'); // Reset to default tab
        }
        setSelectedClientId(prevId => (prevId === clientId ? null : clientId));
    };

    return (
        <div className="space-y-6">
            <AddClientModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <EditClientModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setClientToEdit(null);
                }}
                client={clientToEdit}
            />
            <ConfirmActionModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Підтвердити видалення клієнта"
                message={`Ви впевнені, що хочете видалити клієнта ${clientToDelete?.firstName} ${clientToDelete?.lastName}? Всі пов'язані з ним автомобілі також будуть видалені. Цю дію неможливо скасувати.`}
                variant="danger"
                confirmButtonText="Видалити"
            />
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Клієнти</h1>
                    <p className="text-slate-500 mt-1">База клієнтів та історія обслуговування</p>
                </div>
                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-72">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Ім'я, телефон, номер авто..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500 shadow-sm focus:outline-none focus:ring-2"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center font-bold transition-transform hover:-translate-y-0.5"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Додати клієнта
                    </button>
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-left text-slate-500 font-bold uppercase text-xs tracking-wider">
                                <th className="px-6 py-4">Ім'я</th>
                                <th className="px-6 py-4">Прізвище</th>
                                <th className="px-6 py-4">Телефон</th>
                                <th className="px-6 py-4">Автомобілі</th>
                                <th className="px-6 py-4">Примітка</th>
                                <th className="px-6 py-4">Дії</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700">
                            {filteredClients.length > 0 ? (
                                filteredClients.map(client => {
                                    const clientCars = cars.filter(car => car.ownerID === client.clientID);
                                    const isSelected = selectedClientId === client.clientID;
                                    return (
                                        <tr
                                            key={client.clientID}
                                            onClick={() => handleRowClick(client.clientID)}
                                            className={`border-b border-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/70 border-blue-100' : 'hover:bg-slate-50/80'}`}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium">{client.firstName}</td>
                                            <td className="px-6 py-4 text-sm font-medium">{client.lastName}</td>
                                            <td className="px-6 py-4 text-sm flex items-center text-slate-500">
                                                <PhoneIcon className="w-3 h-3 mr-1.5" />
                                                {client.phone}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {clientCars.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {clientCars.map(car => (
                                                            <span key={car.carID} className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border border-slate-200">
                                                                {car.make} {car.model}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">Немає</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-xs">{client.notes}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex space-x-3">
                                                    <button onClick={(e) => handleEditClick(e, client)} className="text-blue-500 hover:text-blue-700 font-medium">Ред.</button>
                                                    <button onClick={(e) => handleDeleteClick(e, client)} className="text-rose-500 hover:text-rose-700 font-medium">Вид.</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-slate-400">
                                        Клієнтів не знайдено.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedClientDetails && (
                <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl shadow-2xl shadow-indigo-100/50 p-6 animate-fade-in-up">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4 font-bold text-lg">
                                {selectedClientDetails.clientName.charAt(0)}
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                {selectedClientDetails.clientName}
                            </h2>
                        </div>
                        <button onClick={() => setSelectedClientId(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                            <XCircleIcon className="w-8 h-8" />
                        </button>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="border-b border-slate-200 mb-6">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'orders'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                Історія замовлень ({selectedClientDetails.orders.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('cars')}
                                className={`whitespace-nowrap pb-4 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === 'cars'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                    }`}
                            >
                                Автомобілі клієнта ({selectedClientDetails.cars.length})
                            </button>
                        </nav>
                    </div>

                    {/* Orders Tab Content */}
                    {activeTab === 'orders' && (
                        <>
                            {selectedClientDetails.orders.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="min-w-full leading-normal">
                                        <thead>
                                            <tr className="bg-slate-50 text-left text-slate-500 font-semibold uppercase text-xs">
                                                <th className="px-6 py-3">№</th>
                                                <th className="px-6 py-3">Дата</th>
                                                <th className="px-6 py-3">Автомобіль</th>
                                                <th className="px-6 py-3">Причина</th>
                                                <th className="px-6 py-3">Сума</th>
                                                <th className="px-6 py-3">Статус</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-700 bg-white">
                                            {selectedClientDetails.orders.map(order => (
                                                <tr key={order.orderID} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/orders/${order.orderID}`)}>
                                                    <td className="px-6 py-4 text-sm font-medium">{order.orderID}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(order.date).toLocaleDateString('uk-UA')}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-800 font-medium">{order.carName}</td>
                                                    <td className="px-6 py-4 text-sm max-w-xs truncate text-slate-500">{order.reason}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{order.totalCost.toFixed(2)} грн</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`px-2.5 py-1 font-bold text-xs rounded-full ${LIGHT_STATUS_COLORS[order.status]}`}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    <p>Для цього клієнта ще немає жодного замовлення.</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Cars Tab Content */}
                    {activeTab === 'cars' && (
                        <div>
                            {selectedClientDetails.cars.length > 0 ? (
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="min-w-full leading-normal">
                                        <thead>
                                            <tr className="bg-slate-50 text-left text-slate-500 font-semibold uppercase text-xs">
                                                <th className="px-6 py-3">Автомобіль</th>
                                                <th className="px-6 py-3">Держ. номер</th>
                                                <th className="px-6 py-3">Рік</th>
                                                <th className="px-6 py-3">Двигун</th>
                                                <th className="px-6 py-3">VIN</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-slate-700 bg-white">
                                            {selectedClientDetails.cars.map((car: Car) => (
                                                <tr key={car.carID} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{car.make} {car.model}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className="font-mono bg-yellow-50 text-slate-800 border border-yellow-200 px-2 py-1 rounded-md font-bold">{car.licensePlate}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{car.year}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{car.engineVolume.toFixed(1)} л. ({car.fuel})</td>
                                                    <td className="px-6 py-4 text-sm font-mono text-slate-500">{car.vin || 'Не вказано'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    <p>У цього клієнта немає зареєстрованих автомобілів.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClientsPage;
