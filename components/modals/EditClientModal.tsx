import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Client } from '../../types';
import { useClients } from '../../hooks/useClients';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

const EditClientModal: React.FC<EditClientModalProps> = ({ isOpen, onClose, client }) => {
  const { updateClient } = useClients();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (client) {
      setFirstName(client.firstName);
      setLastName(client.lastName);
      setPhone(client.phone);
      setNotes(client.notes);
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !firstName || !phone) {
      alert("Будь ласка, заповніть обов'язкові поля: Ім'я та Телефон.");
      return;
    }
    const updatedClient: Client = {
      ...client,
      firstName,
      lastName,
      phone,
      notes,
    };
    await updateClient(updatedClient);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Редагувати дані клієнта">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="editFirstName" className="block text-sm font-bold text-slate-700 mb-1">Ім'я <span className="text-red-500">*</span></label>
            <input type="text" id="editFirstName" value={firstName} onChange={e => setFirstName(e.target.value)} className="input" required />
          </div>
          <div>
            <label htmlFor="editLastName" className="block text-sm font-bold text-slate-700 mb-1">Прізвище</label>
            <input type="text" id="editLastName" value={lastName} onChange={e => setLastName(e.target.value)} className="input" />
          </div>
          <div>
            <label htmlFor="editPhone" className="block text-sm font-bold text-slate-700 mb-1">Телефон <span className="text-red-500">*</span></label>
            <input type="tel" id="editPhone" value={phone} onChange={e => setPhone(e.target.value)} className="input" required />
          </div>
          <div>
            <label htmlFor="editNotes" className="block text-sm font-bold text-slate-700 mb-1">Примітка</label>
            <textarea id="editNotes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="input"></textarea>
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-3 border-t border-slate-200 pt-5">
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors">Скасувати</button>
          <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 font-bold transition-transform hover:-translate-y-0.5">Зберегти зміни</button>
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

export default EditClientModal;
