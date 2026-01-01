import React, { useState } from 'react';
import { CarGroup, CarGroupModelSpec } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, TagIcon } from '@heroicons/react/24/outline';
import AddEditCarGroupModal from '../modals/AddEditCarGroupModal';
import ConfirmActionModal from './ConfirmDeleteModal';
import { useCarGroups } from '../../hooks/useCarGroups';

const formatModelSpec = (spec: CarGroupModelSpec) => {
    let text = `<span class="font-bold text-slate-700">${spec.make}</span> <span class="text-blue-600 font-bold">${spec.model}</span>`;
    if (spec.yearFrom && spec.yearTo) {
        text += ` <span class="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">${spec.yearFrom} - ${spec.yearTo}</span>`;
    } else if (spec.yearFrom) {
        text += ` <span class="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">${spec.yearFrom}+</span>`;
    } else if (spec.yearTo) {
        text += ` <span class="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1">do ${spec.yearTo}</span>`;
    }
    return text;
};

const CarGroupsPage: React.FC = () => {
    const { carGroups, loading, deleteCarGroup } = useCarGroups();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<CarGroup | null>(null);
    const [groupToDelete, setGroupToDelete] = useState<CarGroup | null>(null);

    const handleAdd = () => {
        setGroupToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (group: CarGroup) => {
        setGroupToEdit(group);
        setIsModalOpen(true);
    };

    const handleDelete = (group: CarGroup) => {
        setGroupToDelete(group);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (groupToDelete) {
            await deleteCarGroup(groupToDelete.groupId);
        }
        setIsDeleteModalOpen(false);
        setGroupToDelete(null);
    };

    if (loading) return <div className="p-10 text-center text-slate-500 font-bold">Завантаження груп атвомобілів...</div>;

    return (
        <>
            <AddEditCarGroupModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                groupToEdit={groupToEdit}
            />
            <ConfirmActionModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Підтвердити видалення"
                message={`Ви впевнені, що хочете видалити групу "${groupToDelete?.name}"? Всі спеціальні ціни для цієї групи будуть скасовані.`}
                variant="danger"
                confirmButtonText="Видалити"
            />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-extrabold text-slate-800">Цінові групи автомобілів</h1>
                    <button
                        onClick={handleAdd}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-indigo-700 flex items-center font-bold transition-transform hover:-translate-y-0.5"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Створити групу
                    </button>
                </div>

                <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-sm">
                    <div className="flex items-start">
                        <div className="p-3 bg-blue-100 rounded-2xl mr-4 shadow-sm text-blue-600">
                            <TagIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Що таке цінові групи?</h2>
                            <p className="text-slate-500 mt-2 leading-relaxed">
                                Цінові групи дозволяють встановлювати спеціальні ціни на послуги для певних наборів автомобілів.
                                Наприклад, ви можете створити групу "Комерційні авто" або "VAG (2015+)" і задати для них окремий прайс.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {carGroups.length > 0 ? (
                        carGroups.map(group => (
                            <div key={group.groupId} className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20 hover:shadow-indigo-100/40 transition-shadow">
                                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                                    <h3 className="text-xl font-bold text-slate-800">{group.name}</h3>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => handleEdit(group)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Редагувати">
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDelete(group)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Видалити">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Автомобілі в групі:</h4>
                                    {group.models.length > 0 ? (
                                        <ul className="flex flex-wrap gap-2">
                                            {group.models.map((m, index) => (
                                                <li
                                                    key={index}
                                                    className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm flex items-center text-sm"
                                                    dangerouslySetInnerHTML={{ __html: formatModelSpec(m) }}
                                                />
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">Немає автомобілів в цій групі.</p>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16 text-slate-400 bg-white/40 backdrop-blur-sm rounded-3xl border border-white/50">
                            <p className="text-xl font-medium text-slate-600">Ще не створено жодної цінової групи</p>
                            <p className="mt-2 text-slate-500">Натисніть "Створити групу", щоб почати.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CarGroupsPage;