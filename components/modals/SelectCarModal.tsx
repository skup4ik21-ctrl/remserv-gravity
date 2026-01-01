import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import { MagnifyingGlassIcon, PlusIcon, TruckIcon, UserIcon } from '@heroicons/react/24/outline';
import { Car } from '../../types';
import AddCarModal from './AddCarModal';
import { useCars } from '../../hooks/useCars';
import { useClients } from '../../hooks/useClients';

interface SelectCarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCarSelect: (carId: string) => void;
    ownerId?: string | null; // Made optional
}

const SelectCarModal: React.FC<SelectCarModalProps> = ({ isOpen, onClose, onCarSelect, ownerId }) => {
    const { cars } = useCars();
    const { clients } = useClients();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);

    // Helper to get owner name
    const getOwnerName = (id: string) => {
        const client = clients.find(c => c.clientID === id);
        return client ? `${client.firstName} ${client.lastName}` : 'Невідомий';
    };

    const displayedCars = useMemo(() => {
        let baseList = cars;

        // If ownerId is provided, filter by it strictly
        if (ownerId) {
            baseList = cars.filter(car => car.ownerID === ownerId);
        }

        if (!searchTerm) {
            // If specific owner selected, show all their cars. 
            // If global search (no ownerId), show nothing until typed (to avoid massive list)
            return ownerId ? baseList : [];
        }

        const searchLower = searchTerm.toLowerCase();
        return baseList.filter(car =>
            car.make.toLowerCase().includes(searchLower) ||
            car.model.toLowerCase().includes(searchLower) ||
            car.licensePlate.toLowerCase().includes(searchLower) ||
            (car.vin && car.vin.toLowerCase().includes(searchLower))
        );
    }, [cars, ownerId, searchTerm]);

    const handleSelect = (car: Car) => {
        onCarSelect(car.carID);
        onClose();
    };

    const handleCarAdded = (carId: string) => {
        setIsAddCarModalOpen(false);
        onCarSelect(carId);
        onClose();
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Обрати автомобіль" size="md">
                <div className="flex flex-col h-[60vh]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex-grow">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Пошук (марка, модель, номер)"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500 shadow-sm focus:outline-none focus:ring-2 font-medium"
                                autoFocus
                            />
                        </div>
                        {ownerId && (
                            <button
                                onClick={() => setIsAddCarModalOpen(true)}
                                className="flex-shrink-0 bg-blue-600 text-white p-3 rounded-xl shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
                                title="Додати новий автомобіль"
                            >
                                <PlusIcon className="w-6 h-6" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {displayedCars.length > 0 ? (
                            <ul className="space-y-3">
                                {displayedCars.map(car => (
                                    <li key={car.carID}>
                                        <button
                                            onClick={() => handleSelect(car)}
                                            className="w-full text-left p-4 bg-white border border-slate-300 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm hover:shadow-md group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className="font-bold text-lg text-slate-800 group-hover:text-blue-700">{car.make} {car.model}</p>
                                                <p className="text-sm font-mono bg-yellow-50 text-slate-800 px-2 py-0.5 rounded border border-yellow-200 font-bold">{car.licensePlate}</p>
                                            </div>
                                            <div className="mt-1 text-sm text-slate-600 font-medium">
                                                {car.year} р. • {car.engineVolume.toFixed(1)}л • {car.fuel}
                                            </div>
                                            <div className="flex justify-between items-end mt-2">
                                                {car.vin ? (
                                                    <span className="text-xs text-slate-400 font-mono">VIN: {car.vin}</span>
                                                ) : <span></span>}

                                                {!ownerId && (
                                                    <span className="flex items-center text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                                                        <UserIcon className="w-3 h-3 mr-1" />
                                                        {getOwnerName(car.ownerID)}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                <TruckIcon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                                <p className="font-bold text-slate-600">Автомобілів не знайдено</p>
                                <p className="mt-1 text-sm">
                                    {ownerId ? "Додайте новий автомобіль." : "Введіть марку або номер авто для пошуку."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
                `}</style>
            </Modal>
            {ownerId && (
                <AddCarModal
                    isOpen={isAddCarModalOpen}
                    onClose={() => setIsAddCarModalOpen(false)}
                    ownerId={ownerId}
                    onCarAdded={handleCarAdded}
                />
            )}
        </>
    );
};

export default SelectCarModal;
