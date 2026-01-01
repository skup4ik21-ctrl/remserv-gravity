
import React, { useState, useMemo, useEffect } from 'react';
import { PlusIcon, UserIcon, WrenchScrewdriverIcon, CurrencyDollarIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import AddEditMasterModal from '../modals/AddEditMasterModal';
import ConfirmActionModal from './ConfirmDeleteModal';
import { Master, OrderStatus, ServiceOrder, OrderDetail } from '../../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useMasters } from '../../hooks/useMasters';

const MastersPage: React.FC = () => {
    const { masters, loading: mastersLoading, deleteMaster } = useMasters();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [masterToEdit, setMasterToEdit] = useState<Master | null>(null);
    const [masterToDelete, setMasterToDelete] = useState<Master | null>(null);

    const [statsData, setStatsData] = useState<{ orders: ServiceOrder[], details: OrderDetail[] } | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        const fetchMasterStats = async () => {
            setStatsLoading(true);
            try {
                const ordersQuery = query(collection(db, 'serviceOrders'), where('status', '==', OrderStatus.Completed));
                const ordersSnap = await getDocs(ordersQuery);
                const completedOrders = ordersSnap.docs.map(doc => ({ ...doc.data(), orderID: doc.id } as ServiceOrder));

                const detailsSnap = await getDocs(collection(db, 'orderDetails'));
                const allDetails = detailsSnap.docs.map(doc => doc.data() as OrderDetail);

                setStatsData({ orders: completedOrders, details: allDetails });
            } catch (error) {
                console.error("Error calculating master stats:", error);
            } finally {
                setStatsLoading(false);
            }
        };

        fetchMasterStats();
    }, []);

    const masterStats = useMemo(() => {
        const stats = new Map<string, { totalEarnings: number, completedOrders: number }>();

        masters.forEach(master => {
            stats.set(master.masterID, { totalEarnings: 0, completedOrders: 0 });
        });

        if (statsData) {
            const { orders, details } = statsData;

            orders.forEach(order => {
                if (order.masterIDs && order.masterIDs.length > 0) {
                    const detailsForOrder = details.filter(d => d.orderID === order.orderID);
                    const orderLaborTotal = detailsForOrder.reduce((sum, d) => sum + (Number(d.cost) * Number(d.quantity)), 0);

                    // Labor is shared equally among masters
                    const laborSharePerMaster = orderLaborTotal / order.masterIDs.length;

                    order.masterIDs.forEach(masterID => {
                        const masterInfo = masters.find(m => m.masterID === masterID);
                        if (stats.has(masterID) && masterInfo) {
                            const currentStats = stats.get(masterID)!;
                            // EARNINGS = SHARE * COMMISSION_PERCENT / 100
                            const commission = (laborSharePerMaster * (masterInfo.commissionPercentage || 40)) / 100;
                            currentStats.totalEarnings += commission;
                            currentStats.completedOrders += 1;
                            stats.set(masterID, currentStats);
                        }
                    });
                }
            });
        }

        return stats;
    }, [masters, statsData]);


    const handleAdd = () => {
        setMasterToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (master: Master) => {
        setMasterToEdit(master);
        setIsModalOpen(true);
    };

    const handleDelete = (master: Master) => {
        setMasterToDelete(master);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (masterToDelete) {
            await deleteMaster(masterToDelete.masterID);
        }
        setIsDeleteModalOpen(false);
        setMasterToDelete(null);
    };


    return (
        <>
            <AddEditMasterModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                masterToEdit={masterToEdit}
            />
            <ConfirmActionModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Підтвердити видалення"
                message={`Ви впевнені, що хочете видалити майстра "${masterToDelete?.name}"? Цю дію неможливо буде скасувати.`}
                variant="danger"
                confirmButtonText="Видалити"
            />
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-3xl font-extrabold text-slate-800">Майстри та Зарплата</h1>
                    <button
                        onClick={handleAdd}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 flex items-center font-bold transition-transform hover:-translate-y-0.5"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Додати майстра
                    </button>
                </div>

                {masters.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {masters.map(master => {
                            const stats = masterStats.get(master.masterID) || { totalEarnings: 0, completedOrders: 0 };
                            return (
                                <div key={master.masterID} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 flex flex-col justify-between hover:border-blue-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 shadow-sm group">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800">{master.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">{master.specialization}</span>
                                                    <span className="text-[10px] bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-md border border-blue-100 font-bold">
                                                        {master.commissionPercentage}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(master)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Редагувати">
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDelete(master)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors" title="Видалити">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
                                            <div className="flex items-center text-slate-600">
                                                <div className="p-1.5 bg-emerald-100 rounded-lg mr-3 text-emerald-600">
                                                    <CurrencyDollarIcon className="w-5 h-5" />
                                                </div>
                                                <span className="font-medium">Нараховано ЗП:</span>
                                                <span className="font-bold text-slate-800 ml-auto flex items-center">
                                                    {statsLoading ? (
                                                        <ArrowPathIcon className="w-4 h-4 animate-spin text-slate-400" />
                                                    ) : (
                                                        `${stats.totalEarnings.toFixed(2)} грн`
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center text-slate-600">
                                                <div className="p-1.5 bg-blue-100 rounded-lg mr-3 text-blue-600">
                                                    <WrenchScrewdriverIcon className="w-5 h-5" />
                                                </div>
                                                <span className="font-medium">Закрив замовлень:</span>
                                                <span className="font-bold text-slate-800 ml-auto">
                                                    {statsLoading ? (
                                                        <span className="text-xs text-slate-400">...</span>
                                                    ) : (
                                                        stats.completedOrders
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50/50 rounded-b-2xl border-t border-slate-100">
                                        <p className="text-sm text-slate-500">
                                            <strong className="text-slate-700">Контакт:</strong> {master.phone || 'Не вказано'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 text-slate-400 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/50 shadow-inner">
                        <div className="p-4 bg-slate-100 rounded-full inline-flex mb-4">
                            <UserIcon className="w-10 h-10 text-slate-400" />
                        </div>
                        <p className="text-xl font-bold text-slate-600">Немає майстрів у базі</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default MastersPage;
