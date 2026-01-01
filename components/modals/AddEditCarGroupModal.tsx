import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { CarGroup, NewCarGroup, CarGroupModelSpec } from '../../types';
import { PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import SelectCarModal from './SelectCarModal';
import { useCarGroups } from '../../hooks/useCarGroups';
import { useCars } from '../../hooks/useCars';

const AddEditCarGroupModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  groupToEdit: CarGroup | null;
}> = ({ isOpen, onClose, groupToEdit }) => {
  const { addCarGroup, updateCarGroup } = useCarGroups();
  const { cars } = useCars();

  const [name, setName] = useState('');
  const [models, setModels] = useState<CarGroupModelSpec[]>([]);
  const [newMake, setNewMake] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newYearFrom, setNewYearFrom] = useState('');
  const [newYearTo, setNewYearTo] = useState('');
  const [isSelectCarOpen, setIsSelectCarOpen] = useState(false);


  const isEditing = groupToEdit !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && groupToEdit) {
        setName(groupToEdit.name);
        setModels([...groupToEdit.models]);
      } else {
        setName('');
        setModels([]);
      }
      setNewMake('');
      setNewModel('');
      setNewYearFrom('');
      setNewYearTo('');
    }
  }, [isOpen, groupToEdit, isEditing]);

  const handleAddModel = () => {
    if (newMake.trim() && newModel.trim()) {
      const newSpec: CarGroupModelSpec = {
        make: newMake.trim(),
        model: newModel.trim(),
      };
      const yearFromNum = parseInt(newYearFrom, 10);
      const yearToNum = parseInt(newYearTo, 10);
      if (!isNaN(yearFromNum)) newSpec.yearFrom = yearFromNum;
      if (!isNaN(yearToNum)) newSpec.yearTo = yearToNum;

      setModels(prev => [...prev, newSpec]);
      setNewMake('');
      setNewModel('');
      setNewYearFrom('');
      setNewYearTo('');
    }
  };

  const handleCarFromDbSelected = (carId: string) => {
    const car = cars.find(c => c.carID === carId);
    if (car) {
      setModels(prev => [...prev, { make: car.make, model: car.model }]);
    }
    setIsSelectCarOpen(false);
  };

  const handleRemoveModel = (indexToRemove: number) => {
    setModels(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Будь ласка, введіть назву групи.");
      return;
    }

    if (isEditing && groupToEdit) {
      const updatedGroup: CarGroup = {
        ...groupToEdit,
        name,
        models,
      };
      await updateCarGroup(updatedGroup);
    } else {
      const newGroup: NewCarGroup = {
        name,
        models,
      };
      await addCarGroup(newGroup);
    }
    onClose();
  };

  const formatModelSpec = (spec: CarGroupModelSpec) => {
    let text = `<span class="font-bold">${spec.make}</span> ${spec.model}`;
    if (spec.yearFrom && spec.yearTo) {
      text += ` <span class="text-xs bg-slate-100 text-slate-500 px-1 rounded ml-1">${spec.yearFrom} - ${spec.yearTo}</span>`;
    } else if (spec.yearFrom) {
      text += ` <span class="text-xs bg-slate-100 text-slate-500 px-1 rounded ml-1">${spec.yearFrom}+</span>`;
    } else if (spec.yearTo) {
      text += ` <span class="text-xs bg-slate-100 text-slate-500 px-1 rounded ml-1">до ${spec.yearTo}</span>`;
    }
    return text;
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Редагувати групу' : 'Створити нову групу'}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="groupName" className="block text-sm font-bold text-slate-700 mb-1">Назва групи <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="groupName"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div className="p-4 border border-slate-200 bg-slate-50/50 rounded-xl">
              <h4 className="font-bold text-slate-700 mb-2">Автомобілі в групі</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 bg-white rounded-lg border border-slate-200 p-2">
                {models.map((m, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-100">
                    <span className="text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: formatModelSpec(m) }} />
                    <button type="button" onClick={() => handleRemoveModel(index)} className="p-1 text-slate-400 hover:text-red-500">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {models.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Додайте автомобілі до групи</p>}
              </div>

              <div className="mt-4 border-t border-slate-200 pt-3">
                <h5 className="text-sm font-bold text-slate-600 mb-2 uppercase">Додати автомобіль</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="newMake" className="text-xs font-bold text-slate-500 mb-1 block">Марка</label>
                    <input type="text" id="newMake" value={newMake} onChange={e => setNewMake(e.target.value)} placeholder="Напр. Volkswagen" className="w-full input text-sm py-1.5" />
                  </div>
                  <div>
                    <label htmlFor="newModel" className="text-xs font-bold text-slate-500 mb-1 block">Модель</label>
                    <input type="text" id="newModel" value={newModel} onChange={e => setNewModel(e.target.value)} placeholder="Напр. Golf" className="w-full input text-sm py-1.5" />
                  </div>
                  <div>
                    <label htmlFor="newYearFrom" className="text-xs font-bold text-slate-500 mb-1 block">Рік від (опц)</label>
                    <input type="number" id="newYearFrom" value={newYearFrom} onChange={e => setNewYearFrom(e.target.value)} placeholder="2015" className="w-full input text-sm py-1.5" />
                  </div>
                  <div>
                    <label htmlFor="newYearTo" className="text-xs font-bold text-slate-500 mb-1 block">Рік до (опц)</label>
                    <input type="number" id="newYearTo" value={newYearTo} onChange={e => setNewYearTo(e.target.value)} placeholder="2020" className="w-full input text-sm py-1.5" />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={handleAddModel} className="flex-1 p-2 bg-blue-100 text-blue-700 font-bold rounded-lg hover:bg-blue-200 flex items-center justify-center transition-colors">
                    <PlusIcon className="w-5 h-5 mr-1" /> Додати модель
                  </button>
                  <button type="button" onClick={() => setIsSelectCarOpen(true)} className="flex-1 p-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200 flex items-center justify-center transition-colors border border-slate-200">
                    <MagnifyingGlassIcon className="w-5 h-5 mr-1" /> З бази авто
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-medium">Скасувати</button>
            <button type="submit" className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg hover:from-orange-600 hover:to-red-600 font-bold">
              {isEditing ? 'Зберегти зміни' : 'Створити групу'}
            </button>
          </div>
        </form>
        <style>{`
              .input {
                  display: block; width: 100%; padding: 0.5rem 0.75rem; background-color: #ffffff;
                  border: 1px solid #e2e8f0; border-radius: 0.5rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                  color: #1e293b; transition: all 0.2s;
              }
              .input::placeholder { color: #94a3b8; }
              .input:focus {
                  outline: none; --tw-ring-color: #3b82f6;
                  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); border-color: #3b82f6;
              }
          `}</style>
      </Modal>
      <SelectCarModal
        isOpen={isSelectCarOpen}
        onClose={() => setIsSelectCarOpen(false)}
        onCarSelect={handleCarFromDbSelected}
      />
    </>
  );
};

export default AddEditCarGroupModal;
