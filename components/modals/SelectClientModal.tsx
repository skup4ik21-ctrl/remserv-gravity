import React, { useState, useMemo } from 'react';
import Modal from '../ui/Modal';
import { MagnifyingGlassIcon, UserGroupIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { Client } from '../../types';
import { useClients } from '../../hooks/useClients';
import { useCars } from '../../hooks/useCars';

interface SelectClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClientSelect: (clientId: string) => void;
}

const SelectClientModal: React.FC<SelectClientModalProps> = ({ isOpen, onClose, onClientSelect }) => {
    const { clients } = useClients();
    const { cars } = useCars();
    const [searchTerm, setSearchTerm] = useState('');

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

    const handleSelect = (client: Client) => {
        onClientSelect(client.clientID);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Обрати клієнта" size="md">
            <div className="flex flex-col h-[60vh]">
                <div className="relative mb-4">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Ім'я, телефон або номер авто..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:ring-blue-500 focus:border-blue-500 shadow-sm focus:outline-none focus:ring-2 font-medium"
                        autoFocus
                    />
                </div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {filteredClients.length > 0 ? (
                        <ul className="space-y-3">
                            {filteredClients.map(client => (
                                <li key={client.clientID}>
                                    <button
                                        onClick={() => handleSelect(client)}
                                        className="w-full text-left p-4 bg-white border border-slate-300 rounded-xl hover:bg-blue-50 hover:border-blue-400 transition-all shadow-sm hover:shadow-md group"
                                    >
                                        <p className="font-bold text-lg text-slate-800 group-hover:text-blue-700">{client.firstName} {client.lastName}</p>
                                        <p className="text-sm text-slate-600 font-medium flex items-center mt-1">
                                            <PhoneIcon className="w-4 h-4 mr-1.5 text-slate-400" />
                                            {client.phone}
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <UserGroupIcon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                            <p className="font-bold text-slate-600">Клієнта не знайдено</p>
                            <p className="mt-1 text-sm">Перевірте запит або створіть нового клієнта.</p>
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
    );
};

export default SelectClientModal;
