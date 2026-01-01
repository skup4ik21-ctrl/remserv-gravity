import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Car, FuelType } from '../../types';
import { useCars } from '../../hooks/useCars';
import { useClients } from '../../hooks/useClients';

interface EditCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
}

export const EditCarModal: React.FC<EditCarModalProps> = ({ isOpen, onClose, car }) => {
  const { updateCar } = useCars();
  const { clients } = useClients();

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [engineVolume, setEngineVolume] = useState('');
  const [fuel, setFuel] = useState<FuelType>(FuelType.Petrol);
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');

  useEffect(() => {
    if (car) {
      setMake(car.make);
      setModel(car.model);
      setYear(String(car.year));
      setEngineVolume(String(car.engineVolume));
      setFuel(car.fuel);
      setLicensePlate(car.licensePlate);
      setVin(car.vin || '');
    }
  }, [car]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!car || !make || !model || !licensePlate || !year || !engineVolume) {
      alert('Будь ласка, заповніть всі обов\'язкові поля.');
      return;
    }
    const updatedCar: Car = {
      ...car,
      make,
      model,
      licensePlate,
      vin,
      year: Number(year),
      engineVolume: Number(engineVolume),
      fuel,
    };
    await updateCar(updatedCar);
    onClose();
  };

  const owner = car ? clients.find(c => c.clientID === car.ownerID) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Редагувати дані автомобіля">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Власник</label>
            <input type="text" value={owner ? `${owner.firstName} ${owner.lastName}` : ''} className="input bg-slate-100 text-slate-500 border-slate-200" disabled />
          </div>
          <div>
            <label htmlFor="editMake" className="block text-sm font-bold text-slate-700 mb-1">Марка <span className="text-red-500">*</span></label>
            <input type="text" id="editMake" value={make} onChange={e => setMake(e.target.value)} className="input" required />
          </div>
          <div>
            <label htmlFor="editModel" className="block text-sm font-bold text-slate-700 mb-1">Модель <span className="text-red-500">*</span></label>
            <input type="text" id="editModel" value={model} onChange={e => setModel(e.target.value)} className="input" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="editYear" className="block text-sm font-bold text-slate-700 mb-1">Рік <span className="text-red-500">*</span></label>
              <input type="number" id="editYear" value={year} onChange={e => setYear(e.target.value)} className="input" required />
            </div>
            <div>
              <label htmlFor="editEngineVolume" className="block text-sm font-bold text-slate-700 mb-1">Об'єм (л) <span className="text-red-500">*</span></label>
              <input type="number" step="0.1" id="editEngineVolume" value={engineVolume} onChange={e => setEngineVolume(e.target.value)} className="input" required />
            </div>
          </div>
          <div>
            <label htmlFor="editFuel" className="block text-sm font-bold text-slate-700 mb-1">Пальне <span className="text-red-500">*</span></label>
            <select id="editFuel" value={fuel} onChange={e => setFuel(e.target.value as FuelType)} className="input" required>
              {Object.values(FuelType).map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="editLicensePlate" className="block text-sm font-bold text-slate-700 mb-1">Держ. номер <span className="text-red-500">*</span></label>
            <input type="text" id="editLicensePlate" value={licensePlate} onChange={e => setLicensePlate(e.target.value)} className="input" required />
          </div>
          <div>
            <label htmlFor="editVin" className="block text-sm font-bold text-slate-700 mb-1">VIN-код</label>
            <input type="text" id="editVin" value={vin} onChange={e => setVin(e.target.value)} className="input" />
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-3 border-t border-slate-200 pt-5">
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors">Скасувати</button>
          <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg hover:from-orange-600 hover:to-red-600 font-bold transition-transform hover:-translate-y-0.5">Зберегти зміни</button>
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
