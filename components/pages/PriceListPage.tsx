import React, { useState, useMemo } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, WrenchScrewdriverIcon, Cog6ToothIcon, NoSymbolIcon, KeyIcon, MagnifyingGlassIcon, EyeIcon, XCircleIcon, ClockIcon, TagIcon } from '@heroicons/react/24/outline';
import { ServiceCategory, Service } from '../../types';
import AddEditServiceModal from '../modals/AddEditServiceModal';
import SelectCarModal from '../modals/SelectCarModal';
import ConfirmActionModal from './ConfirmDeleteModal';
import { useServices } from '../../hooks/useServices';
import { useCars } from '../../hooks/useCars';
import { useCarGroups } from '../../hooks/useCarGroups';

const categoryConfig = {
    [ServiceCategory.Chassis]: { icon: WrenchScrewdriverIcon, name: ServiceCategory.Chassis },
    [ServiceCategory.Engine]: { icon: Cog6ToothIcon, name: ServiceCategory.Engine },
    [ServiceCategory.Brakes]: { icon: NoSymbolIcon, name: ServiceCategory.Brakes },
    [ServiceCategory.Maintenance]: { icon: KeyIcon, name: ServiceCategory.Maintenance },
    [ServiceCategory.Diagnostics]: { icon: MagnifyingGlassIcon, name: ServiceCategory.Diagnostics },
};

const categories = Object.values(ServiceCategory);

const PriceListPage: React.FC = () => {
    const { cars, loading: carsLoading } = useCars();
    const { carGroups, loading: carGroupsLoading } = useCarGroups();
    const { services: priceList, loading: servicesLoading, deleteService, getSmartPrice } = useServices(cars, carGroups);

    const [selectedCategory, setSelectedCategory] = useState<ServiceCategory>(categories[0]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);

    // Deletion State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

    // Simulation State
    const [isCarSelectOpen, setIsCarSelectOpen] = useState(false);
    const [simulationCarId, setSimulationCarId] = useState<string | null>(null);

    const filteredServices = priceList.filter(service => service.category === selectedCategory);

    const handleAddClick = () => {
        setServiceToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (service: Service) => {
        setServiceToEdit(service);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (service: Service) => {
        setServiceToDelete(service);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (serviceToDelete) {
            await deleteService(serviceToDelete.serviceID);
            setServiceToDelete(null);
            setIsDeleteModalOpen(false);
        }
    };

    const simulationCar = useMemo(() => {
        return cars.find(c => c.carID === simulationCarId);
    }, [cars, simulationCarId]);

    const handleStartSimulation = () => {
        setIsCarSelectOpen(true);
    };

    const handleCarSelected = (carId: string) => {
        setSimulationCarId(carId);
    };

    const handleClearSimulation = () => {
        setSimulationCarId(null);
    };

    if (carsLoading || carGroupsLoading || servicesLoading) {
        return <div className="p-8 text-center text-slate-500 font-bold">Завантаження прайс-листа...</div>;
    }

    return (
        <>
            <AddEditServiceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                serviceToEdit={serviceToEdit}
            />

            <ConfirmActionModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Видалити послугу?"
                message={`Ви впевнені, що хочете видалити послугу "${serviceToDelete?.name}" з прайс-листа?`}
                variant="danger"
                confirmButtonText="Видалити"
            />

            {isCarSelectOpen && (
                <SelectCarModal
                    isOpen={isCarSelectOpen}
                    onClose={() => setIsCarSelectOpen(false)}
                    onCarSelect={handleCarSelected}
                />
            )}

            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800">Прайс-лист</h1>
                        <p className="text-slate-500 mt-1">Керування послугами та цінами</p>
                    </div>
                    <div className="flex gap-3">
                        {!simulationCarId ? (
                            <button
                                onClick={handleStartSimulation}
                                className="bg-white text-blue-600 border border-blue-200 px-5 py-2.5 rounded-xl shadow-sm hover:bg-blue-50 font-bold transition-all flex items-center"
                            >
                                <EyeIcon className="w-5 h-5 mr-2" />
                                Перевірити ціну для авто...
                            </button>
                        ) : (
                            <button
                                onClick={handleClearSimulation}
                                className="bg-blue-100 text-blue-700 px-5 py-2.5 rounded-xl shadow-sm hover:bg-blue-200 font-bold transition-all flex items-center border border-blue-200"
                            >
                                <XCircleIcon className="w-5 h-5 mr-2" />
                                Скинути: {simulationCar?.make} {simulationCar?.model}
                            </button>
                        )}
                        <button
                            onClick={handleAddClick}
                            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-red-600 flex items-center font-bold transition-transform hover:-translate-y-0.5"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Додати послугу
                        </button>
                    </div>
                </div>

                {simulationCarId && simulationCar && (
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-start animate-fade-in-up">
                        <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                            <EyeIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-indigo-900 text-lg">Режим перегляду цін для конкретного авто</h3>
                            <p className="text-indigo-700 text-sm mt-1">
                                Відображаються ціни для <span className="font-bold">{simulationCar.make} {simulationCar.model} ({simulationCar.year})</span>.
                                Система враховує історію обслуговування цієї моделі та цінові групи.
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Категорії послуг</h2>
                    <p className="text-slate-500 text-sm mb-6">Оберіть категорію для перегляду або редагування послуг.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {categories.map(category => {
                            const config = categoryConfig[category];
                            const Icon = config.icon;
                            const isActive = selectedCategory === category;
                            return (
                                <button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 ${isActive
                                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105 border-transparent'
                                            : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:shadow-md'
                                        }`}
                                >
                                    <Icon className={`w-8 h-8 mb-3 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                                    <span className="font-bold text-center text-sm">{config.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {selectedCategory && (
                    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-white/40">
                            <h2 className="text-2xl font-bold text-slate-800">{selectedCategory}</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="min-w-full inline-block align-middle">
                                <div className="border-b border-slate-200">
                                    <div className="flex items-center px-6 py-3 bg-slate-50/80 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <div className="flex-1">Назва послуги</div>
                                        <div className="w-40 text-right">Вартість</div>
                                        <div className="w-24 text-center">Дії</div>
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {filteredServices.length > 0 ? (
                                        filteredServices.map(service => {
                                            const { price, source } = simulationCarId
                                                ? getSmartPrice(service.serviceID, simulationCarId)
                                                : { price: service.basePrice, source: 'base' };

                                            const isSpecialPrice = source !== 'base';

                                            return (
                                                <div key={service.serviceID} className={`flex items-center px-6 py-4 hover:bg-blue-50/40 transition-colors group ${isSpecialPrice ? 'bg-indigo-50/30' : ''}`}>
                                                    <div className="flex-1 font-medium text-slate-700">
                                                        {service.name}
                                                        {isSpecialPrice && (
                                                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold inline-flex items-center ${source === 'history' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                {source === 'history' ? <ClockIcon className="w-3 h-3 mr-1" /> : <TagIcon className="w-3 h-3 mr-1" />}
                                                                {source === 'history' ? 'Історія' : 'Група'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="w-40 text-right">
                                                        {isSpecialPrice && (
                                                            <span className="text-xs text-slate-400 line-through mr-2">
                                                                {service.basePrice.toFixed(2)}
                                                            </span>
                                                        )}
                                                        <span className={`font-bold ${isSpecialPrice ? 'text-indigo-600' : 'text-slate-800'}`}>
                                                            {price.toFixed(2)} <span className="text-xs font-normal text-slate-400">грн</span>
                                                        </span>
                                                    </div>
                                                    <div className="w-24 flex justify-center items-center space-x-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => handleEditClick(service)} className="text-slate-400 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-100 hover:border-blue-200 p-1.5 rounded-lg transition-colors shadow-sm" title="Редагувати">
                                                            <PencilIcon className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(service)} className="text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-100 hover:border-rose-200 p-1.5 rounded-lg transition-colors shadow-sm" title="Видалити">
                                                            <TrashIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-center py-12 text-slate-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <WrenchScrewdriverIcon className="w-12 h-12 text-slate-200 mb-3" />
                                                <p>В цій категорії ще немає послуг.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default PriceListPage;