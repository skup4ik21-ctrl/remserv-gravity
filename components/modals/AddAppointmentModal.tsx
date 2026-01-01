import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { NewServiceOrder } from '../../types';
import { format, parseISO, isBefore } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import { useClients } from '../../hooks/useClients';
import { useCars } from '../../hooks/useCars';
import { useMasters } from '../../hooks/useMasters';

interface AddAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDateTime: Date | null;
}

const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({ isOpen, onClose, initialDateTime }) => {
  const { addServiceOrder } = useServiceOrders();
  const { clients } = useClients();
  const { cars } = useCars();
  const { masters } = useMasters();

  const [clientID, setClientID] = useState('');
  const [carID, setCarID] = useState('');
  const [reason, setReason] = useState('');
  const [masterID, setMasterID] = useState('');
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('09:00');

  const clientCars = useMemo(() => cars.filter(car => car.ownerID === clientID), [clientID, cars]);

  useEffect(() => {
    if (!isOpen) {
      setClientID('');
      setCarID('');
      setReason('');
      setMasterID('');
      setEndDate('');
      setTime('09:00');
    } else if (initialDateTime) {
      setEndDate(format(initialDateTime, 'yyyy-MM-dd'));
      setTime(format(initialDateTime, 'HH:mm'));
    }
  }, [isOpen, initialDateTime]);

  useEffect(() => {
    // Automatically select the car if the client has only one
    if (clientCars.length === 1) {
      setCarID(clientCars[0].carID);
    } else {
      setCarID('');
    }
  }, [clientCars]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientID || !carID || !reason || !initialDateTime) {
      alert("Будь ласка, заповніть всі поля.");
      return;
    }

    const startDateStr = format(initialDateTime, 'yyyy-MM-dd');
    if (endDate && isBefore(parseISO(endDate), parseISO(startDateStr))) {
      alert("Дата завершення не може бути раніше дати початку.");
      return;
    }

    const newAppointment: NewServiceOrder = {
      clientID,
      carID,
      date: startDateStr,
      endDate: (endDate && endDate !== startDateStr) ? endDate : undefined,
      time: time,
      reason,
      masterIDs: masterID ? [masterID] : [], // Masters can be assigned later
    };

    // The second argument is an empty array for order details
    addServiceOrder(newAppointment, []);
    onClose();
  };

  const title = initialDateTime
    ? `Новий запис на ${format(initialDateTime, 'd MMMM', { locale: uk })}`
    : 'Новий запис';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Клієнт <span className="text-red-500">*</span></label>
          <select value={clientID} onChange={e => setClientID(e.target.value)} className="input" required>
            <option value="" disabled>Оберіть клієнта</option>
            {clients.map(c => <option key={c.clientID} value={c.clientID}>{c.firstName} {c.lastName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Автомобіль <span className="text-red-500">*</span></label>
          <select value={carID} onChange={e => setCarID(e.target.value)} className="input" required disabled={!clientID}>
            <option value="" disabled>Оберіть автомобіль</option>
            {clientCars.map(c => <option key={c.carID} value={c.carID}>{c.make} {c.model} ({c.licensePlate})</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Час початку</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Дата завершення (для довгих робіт)</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={initialDateTime ? format(initialDateTime, 'yyyy-MM-dd') : undefined}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Призначити майстра (опціонально)</label>
          <select value={masterID} onChange={e => setMasterID(e.target.value)} className="input">
            <option value="">Не призначати</option>
            {masters.map(m => <option key={m.masterID} value={m.masterID}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Причина звернення <span className="text-red-500">*</span></label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            className="input"
            placeholder="Планове ТО, діагностика ходової..."
            required
          ></textarea>
        </div>
        <div className="mt-6 flex justify-end space-x-3 border-t border-slate-200 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-medium">Скасувати</button>
          <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 font-bold">Створити запис</button>
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

export default AddAppointmentModal;