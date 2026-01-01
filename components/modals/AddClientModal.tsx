
import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { NewClient } from '../../types';
import { useClients } from '../../hooks/useClients';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded?: (clientId: string) => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onClientAdded }) => {
  const { addClient } = useClients();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setNotes('');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !phone) {
      alert('Будь ласка, заповніть всі обов\'язкові поля: Ім\'я, Телефон.');
      return;
    }
    const newClient: NewClient = {
      firstName,
      lastName,
      phone,
      notes,
    };
    const newId = await addClient(newClient);
    if (newId && onClientAdded) {
      onClientAdded(newId);
    } else {
      onClose(); // Fallback if onClientAdded is not provided
    }
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Додати нового клієнта">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-bold text-slate-700 mb-1">Ім'я <span className="text-red-500">*</span></label>
            <input type="text" id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} className="input" required />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-bold text-slate-700 mb-1">Прізвище</label>
            <input type="text" id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} className="input" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-1">Телефон <span className="text-red-500">*</span></label>
            <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="input" required />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-bold text-slate-700 mb-1">Примітка</label>
            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input"></textarea>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-3 border-t border-slate-200 pt-5">
          <button type="button" onClick={handleClose} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors">Скасувати</button>
          <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 font-bold transition-transform hover:-translate-y-0.5">Додати клієнта</button>
        </div>
      </form>
      <style>{`
        .input {
            display: block; width: 100%; padding: 0.75rem 1rem; background-color: #ffffff;
            border: 1px solid #cbd5e1; border-radius: 0.75rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            color: #1e293b; transition: all 0.2s; font-size: 0.95rem;
        }
        .input::placeholder { color: #94a3b8; }
        .input:focus {
            outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
      `}</style>
    </Modal>
  );
};

export default AddClientModal;
