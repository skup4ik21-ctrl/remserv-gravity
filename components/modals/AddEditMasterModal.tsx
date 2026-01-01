
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Master, NewMaster } from '../../types';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useMasters } from '../../hooks/useMasters';

interface AddEditMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterToEdit: Master | null;
}

const AddEditMasterModal: React.FC<AddEditMasterModalProps> = ({ isOpen, onClose, masterToEdit }) => {
  const { addMaster, updateMaster } = useMasters();

  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState('40');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  const isEditing = masterToEdit !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditing && masterToEdit) {
        setName(masterToEdit.name);
        setSpecialization(masterToEdit.specialization);
        setCommissionPercentage(String(masterToEdit.commissionPercentage || 40));
        setPhone(masterToEdit.phone || '');
        setNotes(masterToEdit.notes || '');
        setTelegramChatId(masterToEdit.telegramChatId || '');
      } else {
        setName('');
        setSpecialization('');
        setCommissionPercentage('40');
        setPhone('');
        setNotes('');
        setTelegramChatId('');
      }
    }
  }, [isOpen, masterToEdit, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const comm = parseFloat(commissionPercentage);
    if (!name.trim() || !specialization.trim() || isNaN(comm)) {
      alert("Будь ласка, заповніть обов'язкові поля.");
      return;
    }

    if (comm < 0 || comm > 100) {
      alert("Відсоток комісії має бути в межах від 0 до 100.");
      return;
    }

    if (isEditing && masterToEdit) {
      const updatedMaster: Master = {
        ...masterToEdit,
        name: name.trim(),
        specialization: specialization.trim(),
        commissionPercentage: comm,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        telegramChatId: telegramChatId.trim() || undefined,
      };
      await updateMaster(updatedMaster);
    } else {
      const newMaster: NewMaster = {
        name: name.trim(),
        specialization: specialization.trim(),
        commissionPercentage: comm,
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        telegramChatId: telegramChatId.trim() || undefined,
      };
      await addMaster(newMaster);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Редагувати дані майстра' : 'Додати нового майстра'}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="masterName" className="block text-sm font-bold text-slate-700 mb-1">Ім'я та Прізвище <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="masterName"
              value={name}
              onChange={e => setName(e.target.value)}
              className="input w-full"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="masterSpecialization" className="block text-sm font-bold text-slate-700 mb-1">Спеціалізація <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="masterSpecialization"
                value={specialization}
                onChange={e => setSpecialization(e.target.value)}
                className="input w-full"
                required
                placeholder="Напр. Моторист"
              />
            </div>
            <div>
              <label htmlFor="masterCommission" className="block text-sm font-bold text-slate-700 mb-1">Комісія (%) <span className="text-red-500">*</span></label>
              <input
                type="number"
                id="masterCommission"
                value={commissionPercentage}
                onChange={e => setCommissionPercentage(e.target.value)}
                className="input w-full"
                required
                min="0"
                max="100"
              />
            </div>
          </div>
          <div>
            <label htmlFor="masterPhone" className="block text-sm font-bold text-slate-700 mb-1">Контактний телефон</label>
            <input
              type="tel"
              id="masterPhone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <label htmlFor="masterTelegram" className="flex items-center text-sm font-bold text-blue-700 mb-1">
              <PaperAirplaneIcon className="w-4 h-4 mr-1.5" /> Telegram Chat ID
            </label>
            <input
              type="text"
              id="masterTelegram"
              value={telegramChatId}
              onChange={e => setTelegramChatId(e.target.value)}
              className="input w-full border-blue-200 focus:ring-blue-400"
              placeholder="Напр. 123456789"
            />
            <p className="text-[10px] text-blue-400 mt-2">Його можна дізнатися через бот @userinfobot в Telegram.</p>
          </div>
          <div>
            <label htmlFor="masterNotes" className="block text-sm font-bold text-slate-700 mb-1">Примітка</label>
            <textarea
              id="masterNotes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="input w-full"
            ></textarea>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-medium">Скасувати</button>
          <button type="submit" className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg hover:from-orange-600 hover:to-red-600 font-bold transition-all">
            {isEditing ? 'Зберегти зміни' : 'Додати майстра'}
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

export default AddEditMasterModal;
