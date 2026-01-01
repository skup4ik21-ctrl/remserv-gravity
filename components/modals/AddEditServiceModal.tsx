import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Service, NewService, ServiceCategory } from '../../types';
import { useServices } from '../../hooks/useServices';
import { useCarGroups } from '../../hooks/useCarGroups';

interface AddEditServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceToEdit: Service | null;
  onServiceAdded?: (newService: Service) => void;
  initialName?: string;
}

const AddEditServiceModal: React.FC<AddEditServiceModalProps> = ({ isOpen, onClose, serviceToEdit, onServiceAdded, initialName = '' }) => {
  const { addService, updateService } = useServices();
  const { carGroups } = useCarGroups();

  const [name, setName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [category, setCategory] = useState<ServiceCategory>(ServiceCategory.Diagnostics);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, string>>({});

  const isEditing = serviceToEdit !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && serviceToEdit) {
        setName(serviceToEdit.name);
        setBasePrice(String(serviceToEdit.basePrice));
        setCategory(serviceToEdit.category);
        const overridesAsString = Object.entries(serviceToEdit.priceOverrides).reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>);
        setPriceOverrides(overridesAsString);
      } else {
        setName(initialName);
        setBasePrice('');
        setCategory(ServiceCategory.Diagnostics);
        setPriceOverrides({});
      }
    }
  }, [isOpen, serviceToEdit, isEditing, initialName]);

  const handleOverrideChange = (groupId: string, value: string) => {
    setPriceOverrides(prev => ({ ...prev, [groupId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !basePrice || !category) {
      alert("Будь ласка, заповніть всі основні поля (назва, базова ціна, категорія).");
      return;
    }

    const basePriceNumber = parseFloat(basePrice);
    if (isNaN(basePriceNumber) || basePriceNumber < 0) {
      alert("Будь ласка, введіть коректну базову вартість.");
      return;
    }

    const finalOverrides: Record<string, number> = {};
    for (const [groupId, priceStr] of Object.entries(priceOverrides)) {
      if (priceStr) { // Only include non-empty overrides
        const priceNum = parseFloat(String(priceStr));
        if (!isNaN(priceNum) && priceNum >= 0) {
          finalOverrides[groupId] = priceNum;
        } else {
          alert(`Введено некоректну ціну для групи. Будь ласка, перевірте всі поля.`);
          return;
        }
      }
    }

    if (isEditing && serviceToEdit) {
      const updatedService: Service = {
        ...serviceToEdit,
        name,
        basePrice: basePriceNumber,
        category,
        priceOverrides: finalOverrides
      };
      await updateService(updatedService);
      onClose();
    } else {
      const newServiceData: NewService = {
        name,
        basePrice: basePriceNumber,
        category,
        priceOverrides: finalOverrides
      };
      const newService = await addService(newServiceData);
      if (onServiceAdded) {
        onServiceAdded(newService);
      }
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Редагувати послугу' : 'Додати нову послугу'}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="serviceName" className="block text-sm font-bold text-slate-700 mb-1">Назва послуги <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="serviceName"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input w-full"
              required
            />
          </div>
          <div>
            <label htmlFor="serviceCategory" className="block text-sm font-bold text-slate-700 mb-1">Категорія <span className="text-red-500">*</span></label>
            <select
              id="serviceCategory"
              value={category}
              onChange={e => setCategory(e.target.value as ServiceCategory)}
              className="input w-full"
              required
            >
              {Object.values(ServiceCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="serviceBasePrice" className="block text-sm font-bold text-slate-700 mb-1">Базова вартість (грн) <span className="text-red-500">*</span></label>
            <input
              type="number"
              id="serviceBasePrice"
              value={basePrice}
              onChange={e => setBasePrice(e.target.value)}
              className="input w-full"
              required
              step="0.01"
              min="0"
            />
          </div>

          {carGroups.length > 0 && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl mt-4">
              <legend className="px-1 text-md font-bold text-slate-700">Спеціальні ціни для груп</legend>
              <p className="text-sm text-slate-400 mb-3 px-1">Залиште поле порожнім, щоб використовувати базову ціну.</p>
              <div className="space-y-3">
                {carGroups.map(group => (
                  <div key={group.groupId} className="grid grid-cols-3 gap-3 items-center">
                    <label htmlFor={`override-${group.groupId}`} className="col-span-2 block text-sm font-medium text-slate-600">
                      {group.name}
                    </label>
                    <input
                      type="number"
                      id={`override-${group.groupId}`}
                      value={priceOverrides[group.groupId] || ''}
                      onChange={e => handleOverrideChange(group.groupId, e.target.value)}
                      placeholder="Базова"
                      className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      step="0.01"
                      min="0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-medium">Скасувати</button>
          <button type="submit" className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg hover:from-orange-600 hover:to-red-600 font-bold">
            {isEditing ? 'Зберегти зміни' : 'Додати послугу'}
          </button>
        </div>
      </form>
      <style>{`
            .input {
                display: block; width: 100%; padding: 0.625rem 0.875rem; background-color: #ffffff;
                border: 1px solid #e2e8f0; border-radius: 0.75rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                color: #1e293b; transition: all 0.2s;
            }
            .input::placeholder { color: #94a3b8; }
            .input:focus {
                outline: none; --tw-ring-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); border-color: #3b82f6;
            }
        `}</style>
    </Modal>
  );
};

export default AddEditServiceModal;