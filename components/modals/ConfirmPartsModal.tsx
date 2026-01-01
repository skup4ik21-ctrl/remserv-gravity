import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { ExtractedPart, TransactionType } from '../../types';
import { TrashIcon, CheckCircleIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import { useInventory } from '../../hooks/useInventory';

interface ConfirmPartsModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedParts: ExtractedPart[] | null;
  onConfirm: (confirmedParts: ExtractedPart[], supplier?: string, addToInventory?: boolean) => void;
}

interface PartForEditing {
  id: number;
  name: string;
  partNumber?: string;
  quantity: number;
  costPrice: number;
  markup: number;
}

const ConfirmPartsModal: React.FC<ConfirmPartsModalProps> = ({ isOpen, onClose, extractedParts, onConfirm }) => {
  const { addWarehouseTransaction } = useInventory();
  const [editableParts, setEditableParts] = useState<PartForEditing[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [addToInventory, setAddToInventory] = useState(true);

  useEffect(() => {
    if (isOpen && extractedParts) {
      setEditableParts(extractedParts.map((p, index) => ({
        id: index,
        name: p.name,
        partNumber: p.partNumber,
        quantity: p.quantity,
        costPrice: p.price,
        markup: 30,
      })));
    } else if (!isOpen) {
      setEditableParts([]);
      setSupplierName('');
      setDocNumber('');
    }
  }, [isOpen, extractedParts]);

  const handlePartChange = (index: number, field: keyof PartForEditing, value: string | number) => {
    const newParts = [...editableParts];
    const partToUpdate = { ...newParts[index] };
    if (field === 'quantity' || field === 'costPrice' || field === 'markup') {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue >= 0) partToUpdate[field] = numValue;
    } else if (field === 'name' || field === 'partNumber') {
      partToUpdate[field] = value as string;
    }
    newParts[index] = partToUpdate;
    setEditableParts(newParts);
  };

  const handleRemovePart = (indexToRemove: number) => {
    setEditableParts(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleConfirmAction = async () => {
    const confirmedParts: ExtractedPart[] = editableParts.map(p => ({
      name: p.name,
      partNumber: p.partNumber,
      quantity: p.quantity,
      price: p.costPrice * (1 + p.markup / 100),
    }));

    if (addToInventory) {
      await addWarehouseTransaction({
        date: new Date().toISOString(),
        type: TransactionType.Arrival,
        docNumber,
        supplier: supplierName,
        parts: editableParts.map(p => ({
          name: p.name,
          partNumber: p.partNumber,
          quantity: p.quantity,
          purchasePrice: p.costPrice,
          sellingPrice: p.costPrice * (1 + p.markup / 100)
        })),
        totalAmount: editableParts.reduce((s, p) => s + (p.costPrice * p.quantity), 0)
      });
    }

    onConfirm(confirmedParts, supplierName, addToInventory);
  };

  const totalCost = useMemo(() => {
    return editableParts.reduce((sum, part) => {
      const finalPrice = part.costPrice * (1 + part.markup / 100);
      return sum + (finalPrice * part.quantity);
    }, 0);
  }, [editableParts]);


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Перевірка розпізнаних запчастин" size="5xl">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex items-start">
        <ArchiveBoxIcon className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
        <p className="text-blue-800 text-sm font-medium">Перевірте дані з накладної. Якщо увімкнено «Поставити на склад», система автоматично збільшить залишки та створить прибуткову накладну.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Постачальник</label>
          <input type="text" value={supplierName} onChange={e => setSupplierName(e.target.value)} className="input w-full" placeholder="Напр. Elit" />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">№ Накладної</label>
          <input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)} className="input w-full" placeholder="12345" />
        </div>
        <div className="flex items-end">
          <label className="flex items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer w-full">
            <input type="checkbox" checked={addToInventory} onChange={e => setAddToInventory(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mr-3" />
            <span className="text-sm font-bold text-slate-700">Поставити на склад</span>
          </label>
        </div>
      </div>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
        {editableParts.length > 0 && (
          <div className="p-3 bg-slate-100 rounded-lg grid grid-cols-12 gap-x-4 items-end sticky top-0 z-10 border border-slate-200">
            <div className="col-span-12 md:col-span-3"><label className="text-[10px] font-bold text-slate-500 uppercase">Назва</label></div>
            <div className="col-span-12 md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase">Артикул</label></div>
            <div className="col-span-3 md:col-span-1"><label className="text-[10px] font-bold text-slate-500 uppercase text-center">К-ть</label></div>
            <div className="col-span-4 md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase">Ціна зак.</label></div>
            <div className="col-span-5 md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase">Націнка %</label></div>
            <div className="col-span-12 md:col-span-2 text-right"><label className="text-[10px] font-bold text-slate-500 uppercase">Кінцева</label></div>
          </div>
        )}
        {editableParts.map((part, index) => {
          const finalPrice = part.costPrice * (1 + part.markup / 100);
          return (
            <div key={part.id} className="p-3 bg-white border border-slate-100 rounded-xl grid grid-cols-12 gap-x-4 gap-y-2 items-center shadow-sm">
              <div className="col-span-12 md:col-span-3"><input type="text" value={part.name} onChange={e => handlePartChange(index, 'name', e.target.value)} className="input text-xs w-full py-1.5" /></div>
              <div className="col-span-12 md:col-span-2"><input type="text" value={part.partNumber || ''} onChange={e => handlePartChange(index, 'partNumber', e.target.value)} className="input text-xs w-full py-1.5 font-mono" /></div>
              <div className="col-span-3 md:col-span-1"><input type="number" value={part.quantity} onChange={e => handlePartChange(index, 'quantity', e.target.value)} className="input text-xs w-full text-center py-1.5" /></div>
              <div className="col-span-4 md:col-span-2"><input type="number" value={part.costPrice} onChange={e => handlePartChange(index, 'costPrice', e.target.value)} className="input text-xs w-full py-1.5" /></div>
              <div className="col-span-5 md:col-span-2"><input type="number" value={part.markup} onChange={e => handlePartChange(index, 'markup', e.target.value)} className="input text-xs w-full py-1.5" /></div>
              <div className="col-span-12 md:col-span-2 flex items-center justify-between">
                <span className="font-bold text-blue-600">{finalPrice.toFixed(2)}</span>
                <button onClick={() => handleRemovePart(index)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-between items-center border-t border-slate-200 pt-5">
        <div className="text-slate-500 font-medium">Разом закупівля: <span className="text-xl font-extrabold text-slate-800">{editableParts.reduce((s, p) => s + (p.costPrice * p.quantity), 0).toFixed(2)} грн</span></div>
        <div className="flex space-x-3">
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium">Скасувати</button>
          <button
            onClick={handleConfirmAction}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl shadow-lg hover:from-emerald-600 hover:to-green-700 font-bold flex items-center"
            disabled={editableParts.length === 0}
          >
            <CheckCircleIcon className="w-5 h-5 mr-2" /> Підтвердити
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmPartsModal;
