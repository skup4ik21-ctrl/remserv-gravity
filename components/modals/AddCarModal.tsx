import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { NewCar, FuelType } from '../../types';
import { CameraIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { extractCarDataFromImage } from '../../services/geminiService';
import { useCars } from '../../hooks/useCars';
import { useClients } from '../../hooks/useClients';

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId?: string;
  onCarAdded?: (carId: string) => void;
}

const AddCarModal: React.FC<AddCarModalProps> = ({ isOpen, onClose, ownerId, onCarAdded }) => {
  const { addCar } = useCars();
  const { clients } = useClients();

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [engineVolume, setEngineVolume] = useState('');
  const [fuel, setFuel] = useState<FuelType>(FuelType.Petrol);
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [ownerID, setOwnerID] = useState('');

  const [imageBase64Front, setImageBase64Front] = useState<string | null>(null);
  const [imagePreviewFront, setImagePreviewFront] = useState<string | null>(null);
  const [imageBase64Back, setImageBase64Back] = useState<string | null>(null);
  const [imagePreviewBack, setImagePreviewBack] = useState<string | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);


  const resetForm = () => {
    setMake('');
    setModel('');
    setYear('');
    setEngineVolume('');
    setFuel(FuelType.Petrol);
    setLicensePlate('');
    setVin('');
    setOwnerID(ownerId || '');
    setIsProcessingAI(false);
    setImageBase64Front(null);
    setImagePreviewFront(null);
    setImageBase64Back(null);
    setImagePreviewBack(null);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm(); // Always reset form when modal opens for a clean state
      if (ownerId) {
        setOwnerID(ownerId);
      }
    }
  }, [isOpen, ownerId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 2) {
      alert("Будь ласка, виберіть не більше двох фотографій.");
      e.target.value = ''; // Reset file input
      return;
    }

    // Reset previous images
    setImageBase64Front(null);
    setImagePreviewFront(null);
    setImageBase64Back(null);
    setImagePreviewBack(null);

    // Process first file (front)
    const fileReaderFront = new FileReader();
    fileReaderFront.onloadend = () => {
      const base64String = fileReaderFront.result?.toString().split(',')[1];
      const previewUrl = fileReaderFront.result as string;
      setImageBase64Front(base64String || null);
      setImagePreviewFront(previewUrl);
    };
    fileReaderFront.readAsDataURL(files[0]);

    // Process second file (back) if it exists
    if (files.length === 2) {
      const fileReaderBack = new FileReader();
      fileReaderBack.onloadend = () => {
        const base64String = fileReaderBack.result?.toString().split(',')[1];
        const previewUrl = fileReaderBack.result as string;
        setImageBase64Back(base64String || null);
        setImagePreviewBack(previewUrl);
      };
      fileReaderBack.readAsDataURL(files[1]);
    }

    e.target.value = ''; // Reset file input
  };

  const handleRecognizeData = async () => {
    if (!imageBase64Front && !imageBase64Back) {
      alert('Будь ласка, завантажте хоча б одне фото.');
      return;
    }
    setIsProcessingAI(true);
    try {
      const carData = await extractCarDataFromImage({
        front: imageBase64Front || undefined,
        back: imageBase64Back || undefined,
      });
      if (carData.make) setMake(carData.make);
      if (carData.model) setModel(carData.model);
      if (carData.year) setYear(carData.year.toString());
      if (carData.engineVolume) setEngineVolume(carData.engineVolume.toString());
      if (carData.fuel) setFuel(carData.fuel);
      if (carData.licensePlate) setLicensePlate(carData.licensePlate);
      if (carData.vin) setVin(carData.vin);
    } catch (error) {
      console.error(error);
      alert('Не вдалося розпізнати дані з фото.');
    } finally {
      setIsProcessingAI(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make || !model || !licensePlate || !ownerID || !year || !engineVolume) {
      alert('Будь ласка, заповніть всі обов\'язкові поля.');
      return;
    }
    const newCar: NewCar = {
      make,
      model,
      licensePlate,
      vin,
      ownerID,
      year: Number(year),
      engineVolume: Number(engineVolume),
      fuel,
    };
    const newId = await addCar(newCar);
    if (newId && onCarAdded) {
      onCarAdded(newId);
    } else {
      onClose();
    }
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Додати новий автомобіль">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="owner" className="block text-sm font-bold text-slate-700 mb-1">Власник <span className="text-red-500">*</span></label>
            <select id="owner" value={ownerID} onChange={e => setOwnerID(e.target.value)} className="input" required disabled={!!ownerId}>
              <option value="" disabled>Оберіть власника</option>
              {clients.map(client => (
                <option key={client.clientID} value={client.clientID}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="p-5 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl my-4 text-center">
            <h4 className="text-md font-bold text-blue-800 flex items-center justify-center"><SparklesIcon className="w-5 h-5 mr-2" />AI Розпізнавання</h4>
            <p className="text-sm text-slate-500 mt-1">Завантажте фото техпаспорта для автозаповнення</p>

            <div className="mt-4">
              <input
                type="file"
                id="tech-passport-upload"
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={isProcessingAI}
              />
              <label
                htmlFor="tech-passport-upload"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-white text-blue-600 border border-blue-300 rounded-xl shadow-sm text-sm font-bold hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <CameraIcon className="w-5 h-5 mr-2" />
                Завантажити фото (до 2-х)
              </label>

              <div className="mt-4 flex justify-center items-start gap-4">
                {imagePreviewFront && (
                  <div className="text-center">
                    <img src={imagePreviewFront} alt="Front Preview" className="h-24 w-auto rounded-lg object-contain border border-slate-300 shadow-sm" />
                    <p className="text-xs text-slate-500 mt-1">Лицьова сторона</p>
                  </div>
                )}
                {imagePreviewBack && (
                  <div className="text-center">
                    <img src={imagePreviewBack} alt="Back Preview" className="h-24 w-auto rounded-lg object-contain border border-slate-300 shadow-sm" />
                    <p className="text-xs text-slate-500 mt-1">Зворотна сторона</p>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleRecognizeData}
              disabled={isProcessingAI || (!imageBase64Front && !imageBase64Back)}
              className="mt-4 w-full inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 font-bold transition-all disabled:opacity-50"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              {isProcessingAI ? 'Обробка...' : 'Розпізнати дані'}
            </button>
          </div>

          <div>
            <label htmlFor="make" className="block text-sm font-bold text-slate-700 mb-1">Марка <span className="text-red-500">*</span></label>
            <input type="text" id="make" value={make} onChange={e => setMake(e.target.value)} className="input" required />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-bold text-slate-700 mb-1">Модель <span className="text-red-500">*</span></label>
            <input type="text" id="model" value={model} onChange={e => setModel(e.target.value)} className="input" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-bold text-slate-700 mb-1">Рік <span className="text-red-500">*</span></label>
              <input type="number" id="year" value={year} onChange={e => setYear(e.target.value)} className="input" required />
            </div>
            <div>
              <label htmlFor="engineVolume" className="block text-sm font-bold text-slate-700 mb-1">Об'єм (л) <span className="text-red-500">*</span></label>
              <input type="number" step="0.1" id="engineVolume" value={engineVolume} onChange={e => setEngineVolume(e.target.value)} className="input" required />
            </div>
          </div>
          <div>
            <label htmlFor="fuel" className="block text-sm font-bold text-slate-700 mb-1">Пальне <span className="text-red-500">*</span></label>
            <select id="fuel" value={fuel} onChange={e => setFuel(e.target.value as FuelType)} className="input" required>
              {Object.values(FuelType).map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="licensePlate" className="block text-sm font-bold text-slate-700 mb-1">Держ. номер <span className="text-red-500">*</span></label>
            <input type="text" id="licensePlate" value={licensePlate} onChange={e => setLicensePlate(e.target.value)} className="input" required />
          </div>
          <div>
            <label htmlFor="vin" className="block text-sm font-bold text-slate-700 mb-1">VIN-код</label>
            <input type="text" id="vin" value={vin} onChange={e => setVin(e.target.value)} className="input" />
          </div>
        </div>
        <div className="mt-8 flex justify-end space-x-3 border-t border-slate-200 pt-5">
          <button type="button" onClick={handleClose} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors">Скасувати</button>
          <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg hover:from-orange-600 hover:to-red-600 font-bold transition-transform hover:-translate-y-0.5">Додати автомобіль</button>
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

export default AddCarModal;
