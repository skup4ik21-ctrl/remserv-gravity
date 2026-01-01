import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { AssemblyNode, CustomSchematic } from '../../types';
import { PhotoIcon, SparklesIcon, ArrowPathIcon, LinkIcon } from '@heroicons/react/24/outline';
import { analyzeSchematicWithAI } from '../../services/geminiService';
import { useSchematics } from '../../hooks/useSchematics';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const UploadSchematicModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { addCustomSchematic } = useSchematics();
  const [node, setNode] = useState<AssemblyNode>(AssemblyNode.FrontChassis);
  const [keywords, setKeywords] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [externalUrl, setExternalUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExternalUrl('');
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setImageBase64(reader.result?.toString().split(',')[1] || null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageBase64 && !externalUrl) {
      alert("Будь ласка, завантажте файл або вкажіть посилання.");
      return;
    }
    if (!keywords) return;

    setIsAnalyzing(true);
    try {
      let hotspots = [];
      if (imageBase64) {
        // AI аналізує зображення, щоб знайти номери деталей
        hotspots = await analyzeSchematicWithAI(imageBase64);
      }

      const newSchematic: CustomSchematic = {
        schematicID: `sch-${Date.now()}`,
        node,
        carModelKeywords: keywords.split(',').map(k => k.trim()),
        imageUrl: imageBase64 ? imagePreview! : externalUrl,
        hotspots
      };
      await addCustomSchematic(newSchematic);
      onClose();
      alert("Схему успішно додано!");
    } catch (error) {
      console.error(error);
      alert("Помилка при збереженні схеми.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Додати схему вузла">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Вузол автомобіля</label>
          <select value={node} onChange={e => setNode(e.target.value as AssemblyNode)} className="w-full p-2 border rounded-xl bg-white shadow-sm outline-none focus:ring-2 focus:ring-blue-500">
            {Object.values(AssemblyNode).map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Ключові слова (через кому: Mercedes W212, E-class)</label>
          <input
            type="text"
            value={keywords}
            onChange={e => setKeywords(e.target.value)}
            placeholder="W212, Mercedes E200"
            className="w-full p-2 border rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center">
            <LinkIcon className="w-4 h-4 mr-1 text-slate-400" /> URL з Google Drive (пряме посилання)
          </label>
          <input
            type="url"
            value={externalUrl}
            onChange={e => setExternalUrl(e.target.value)}
            placeholder="https://..."
            className="w-full p-2 border rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50">
          {imagePreview ? (
            <img src={imagePreview} className="max-h-48 mx-auto rounded-lg mb-2 shadow-md" alt="Preview" />
          ) : (
            <div className="py-4">
              <PhotoIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Або завантажте файл</p>
            </div>
          )}
          <input type="file" id="schem-file-modal" className="hidden" accept="image/*" onChange={handleImageChange} />
          <label htmlFor="schem-file-modal" className="mt-2 inline-block bg-white text-blue-600 px-4 py-1.5 rounded-lg border border-blue-100 text-xs font-bold cursor-pointer hover:bg-blue-50 transition-colors">
            Обрати файл
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 font-medium">Скасувати</button>
          <button
            type="submit"
            disabled={isAnalyzing || (!imageBase64 && !externalUrl)}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 hover:bg-blue-700 transition-all"
          >
            {isAnalyzing ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
            Зберегти
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UploadSchematicModal;