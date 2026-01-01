
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Car } from '../../types';
import AddCarModal from '../modals/AddCarModal';
import { EditCarModal } from '../modals/EditCarModal';
import ConfirmActionModal from './ConfirmDeleteModal';
import CarHistoryModal from '../modals/CarHistoryModal';
import { PlusIcon, MagnifyingGlassIcon, EllipsisVerticalIcon, WrenchIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useCars } from '../../hooks/useCars';
import { useClients } from '../../hooks/useClients';

const CarCardActions: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({ onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <EllipsisVerticalIcon className="w-5 h-5" />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-20 overflow-hidden animate-fade-in-up">
                    <div className="py-1">
                        <button onClick={() => { onEdit(); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                            <PencilIcon className="w-4 h-4 mr-3 text-blue-500" /> Редагувати
                        </button>
                        <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <TrashIcon className="w-4 h-4 mr-3" /> Видалити
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const CarsPage: React.FC = () => {
    const { cars, loading: carsLoading, error: carsError, deleteCar } = useCars();
    const { clients, loading: clientsLoading, error: clientsError } = useClients();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedCar, setSelectedCar] = useState<Car | null>(null);

    const [searchTerm, setSearchTerm] = useState('');

    const ownersMap = useMemo(() => {
        return clients.reduce((acc, client) => {
            acc[client.clientID] = `${client.firstName} ${client.lastName}`;
            return acc;
        }, {} as Record<string, string>);
    }, [clients]);

    const filteredCars = useMemo(() => {
        return cars
            .map(car => ({ ...car, ownerName: ownersMap[car.ownerID] || 'N/A' }))
            .filter(car => {
                const searchLower = searchTerm.toLowerCase();
                const searchMatch =
                    car.make.toLowerCase().includes(searchLower) ||
                    car.model.toLowerCase().includes(searchLower) ||
                    car.licensePlate.toLowerCase().includes(searchLower) ||
                    car.ownerName.toLowerCase().includes(searchLower);
                return searchMatch;
            });
    }, [cars, searchTerm, ownersMap]);

    const handleEdit = (car: Car) => {
        setSelectedCar(car);
        setIsEditModalOpen(true);
    };

    const handleDelete = (car: Car) => {
        setSelectedCar(car);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (selectedCar) {
            await deleteCar(selectedCar.carID);
        }
        setIsDeleteModalOpen(false);
        setSelectedCar(null);
    };

    const handleViewHistory = (car: Car) => {
        setSelectedCar(car);
        setIsHistoryModalOpen(true);
    };

    if (carsLoading || clientsLoading) return <div className="p-10 flex justify-center text-slate-500">Завантаження автомобілів...</div>;

    if (carsError || clientsError) return (
        <div className="p-10 flex flex-col items-center justify-center text-red-500 bg-red-50 rounded-3xl border border-red-100 m-6">
            <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-bold">Помилка завантаження даних</h3>
            <p className="text-sm opacity-80">{carsError || clientsError}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <AddCarModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <EditCarModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} car={selectedCar} />
            <CarHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} car={selectedCar} />
            <ConfirmActionModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Підтвердити видалення"
                message={`Ви впевнені, що хочете видалити автомобіль ${selectedCar?.make} ${selectedCar?.model} (${selectedCar?.licensePlate})? Цю дію неможливо буде скасувати.`}
                variant="danger"
                confirmButtonText="Видалити"
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Автомобілі</h1>
                    <p className="text-slate-500 mt-1">База транспортних засобів</p>
                </div>
                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                    <div className="relative w-full sm:w-64">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Пошук авто..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500 shadow-sm focus:outline-none focus:ring-2"
                        />
                    </div>
                    <button onClick={() => setIsAddModalOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center font-bold transition-transform hover:-translate-y-0.5">
                        <PlusIcon className="w-5 h-5 mr-2" /> Додати
                    </button>
                </div>
            </div>

            {/* Car Cards Grid */}
            {filteredCars.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCars.map(car => (
                        <div key={car.carID} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 flex flex-col justify-between hover:border-blue-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group">
                            <div className="p-5">
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-lg text-slate-800">{car.make} {car.model}</div>
                                    <CarCardActions onEdit={() => handleEdit(car)} onDelete={() => handleDelete(car)} />
                                </div>
                                <div className="my-4 inline-block bg-slate-100 border border-slate-200 text-slate-800 text-center font-mono text-lg tracking-widest rounded-lg px-3 py-1 shadow-sm">
                                    {car.licensePlate}
                                </div>
                                <div className="text-sm text-slate-600 space-y-1.5">
                                    <p><strong className="text-slate-800">Власник:</strong> {car.ownerName}</p>
                                    <p><strong className="text-slate-800">Рік:</strong> {car.year}</p>
                                    <p><strong className="text-slate-800">Двигун:</strong> {car.engineVolume.toFixed(1)} л. <span className="text-slate-400">({car.fuel})</span></p>
                                    <p><strong className="text-slate-800">VIN:</strong> <span className="font-mono text-xs">{car.vin || 'Не вказано'}</span></p>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50/50 rounded-b-2xl border-t border-slate-100">
                                <button onClick={() => handleViewHistory(car)} className="w-full flex items-center justify-center px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-xl shadow-sm text-sm font-semibold hover:bg-blue-50 hover:border-blue-300 transition-colors">
                                    <WrenchIcon className="w-5 h-5 mr-2" /> Історія обслуговування
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-slate-400 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/50 shadow-inner">
                    <p className="text-xl font-medium text-slate-500">Автомобілі не знайдено</p>
                    <p className="mt-2 text-slate-400">Спробуйте змінити критерії пошуку або додати новий автомобіль.</p>
                </div>
            )}
        </div>
    );
};

export default CarsPage;
