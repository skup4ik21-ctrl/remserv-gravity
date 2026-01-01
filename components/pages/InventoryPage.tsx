
import React, { useState, useMemo } from 'react';
import { InventoryItem, WarehouseTransaction, TransactionType } from '../../types';
import {
    ArchiveBoxIcon, DocumentTextIcon, PrinterIcon, PlusIcon,
    ArrowUpTrayIcon, ArrowDownTrayIcon, MagnifyingGlassIcon,
    ExclamationCircleIcon, ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline';
import { useInventory } from '../../hooks/useInventory';
import { useCompanySettings } from '../../hooks/useCompanySettings';

const InventoryPage: React.FC = () => {
    const { inventory, transactions, loading: invLoading } = useInventory();
    const { settings: companySettings } = useCompanySettings();

    const [activeTab, setActiveTab] = useState<'stock' | 'transactions'>('stock');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDoc, setSelectedDoc] = useState<WarehouseTransaction | null>(null);

    const filteredStock = useMemo(() => {
        return inventory.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.partNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [inventory, searchTerm]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t =>
            t.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.docNumber?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [transactions, searchTerm]);

    const handlePrintDoc = (t: WarehouseTransaction) => {
        setSelectedDoc(t);
        setTimeout(() => window.print(), 200);
    };

    if (invLoading) return <div className="p-10 flex justify-center text-slate-500">Завантаження складу...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Склад запчастин</h1>
                    <p className="text-slate-500">Облік товарних залишків та накладних</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Пошук..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 w-fit mb-6">
                <button
                    onClick={() => setActiveTab('stock')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <ArchiveBoxIcon className="w-5 h-5 inline mr-2" /> Залишки
                </button>
                <button
                    onClick={() => setActiveTab('transactions')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'transactions' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <DocumentTextIcon className="w-5 h-5 inline mr-2" /> Журнал документів
                </button>
            </div>

            {activeTab === 'stock' ? (
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-left text-slate-500 font-bold uppercase text-xs tracking-wider">
                                <th className="px-6 py-4">Назва деталі</th>
                                <th className="px-6 py-4">Артикул</th>
                                <th className="px-6 py-4 text-center">Кількість</th>
                                <th className="px-6 py-4 text-right">Ціна зак.</th>
                                <th className="px-6 py-4 text-right">Ціна прод.</th>
                                <th className="px-6 py-4 text-right">Вартість складу</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700">
                            {filteredStock.map(item => (
                                <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4 font-bold">{item.name}</td>
                                    <td className="px-6 py-4 font-mono text-slate-500">{item.partNumber || '-'}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full font-bold ${item.quantity <= (item.minQuantity || 1) ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>
                                            {item.quantity} шт.
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">{item.purchasePrice.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-blue-600">{item.sellingPrice.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800">{(item.quantity * item.purchasePrice).toFixed(2)} грн</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl overflow-hidden">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-left text-slate-500 font-bold uppercase text-xs tracking-wider">
                                <th className="px-6 py-4">Дата / Тип</th>
                                <th className="px-6 py-4">Документ / Постачальник</th>
                                <th className="px-6 py-4">Деталі</th>
                                <th className="px-6 py-4 text-right">Сума</th>
                                <th className="px-6 py-4 text-center">Дія</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700">
                            {filteredTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold">{new Date(t.date).toLocaleDateString('uk-UA')}</div>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${t.type === TransactionType.Arrival ? 'bg-green-100 text-green-700' : t.type === TransactionType.Return ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800">№ {t.docNumber || '-'}</div>
                                        <div className="text-xs text-slate-500">{t.supplier || 'СТО'}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate">
                                        {t.parts.map(p => `${p.name} (x${p.quantity})`).join(', ')}
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-800">{t.totalAmount.toFixed(2)} грн</td>
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => handlePrintDoc(t)} className="p-2 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg hover:shadow-sm">
                                            <PrinterIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ПРИХОВАНА ОБЛАСТЬ ДЛЯ ДРУКУ СКЛАДСЬКИХ ДОКУМЕНТІВ */}
            {selectedDoc && (
                <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 font-serif text-black leading-normal">
                    <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-extrabold uppercase">{companySettings?.name || 'СТО RemServ'}</h1>
                            <p className="text-sm">Адреса: {companySettings?.address}</p>
                            <p className="text-sm">Тел: {companySettings?.phone}</p>
                            <p className="text-sm mt-1 font-bold">ФОП Реквізити: {companySettings?.fopData}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold">{selectedDoc.type.toUpperCase()} № {selectedDoc.docNumber || selectedDoc.id.slice(0, 8)}</h2>
                            <p className="text-sm">Дата: {new Date(selectedDoc.date).toLocaleDateString('uk-UA')}</p>
                        </div>
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-8 text-sm">
                        <div className="p-2 border border-black">
                            <p className="font-bold mb-1">ОТРИМУВАЧ / ПОКУПЕЦЬ:</p>
                            <p>{companySettings?.name}</p>
                            <p>ЄДРПОУ: {companySettings?.fopData.match(/\d+/)?.[0] || '---'}</p>
                        </div>
                        <div className="p-2 border border-black">
                            <p className="font-bold mb-1">ПОСТАЧАЛЬНИК / ВІДПРАВНИК:</p>
                            <p>{selectedDoc.supplier || 'СТО Internal'}</p>
                            <p>ЄДРПОУ: {selectedDoc.supplierEdrpou || '---'}</p>
                        </div>
                    </div>

                    <table className="w-full border-collapse mb-8 text-sm">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-black p-2 text-left">№</th>
                                <th className="border border-black p-2 text-left">Найменування</th>
                                <th className="border border-black p-2 text-left">Артикул</th>
                                <th className="border border-black p-2 text-center">К-ть</th>
                                <th className="border border-black p-2 text-right">Ціна, грн</th>
                                <th className="border border-black p-2 text-right">Сума, грн</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedDoc.parts.map((p, idx) => (
                                <tr key={idx}>
                                    <td className="border border-black p-2">{idx + 1}</td>
                                    <td className="border border-black p-2 font-bold">{p.name}</td>
                                    <td className="border border-black p-2 font-mono">{p.partNumber || '-'}</td>
                                    <td className="border border-black p-2 text-center">{p.quantity}</td>
                                    <td className="border border-black p-2 text-right">{p.purchasePrice.toFixed(2)}</td>
                                    <td className="border border-black p-2 text-right font-bold">{(p.quantity * p.purchasePrice).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={5} className="border border-black p-2 text-right font-extrabold uppercase">Всього до оплати:</td>
                                <td className="border border-black p-2 text-right font-extrabold">{selectedDoc.totalAmount.toFixed(2)} грн</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="grid grid-cols-2 gap-12 text-sm mt-12">
                        <div className="text-center">
                            <p>Здав (відпустив):</p>
                            <div className="mt-10 border-b border-black w-48 mx-auto"></div>
                            <p className="text-[10px] mt-1 italic text-gray-500">(підпис, ПІБ)</p>
                        </div>
                        <div className="text-center">
                            <p>Прийняв (отримав):</p>
                            <div className="mt-10 border-b border-black w-48 mx-auto"></div>
                            <p className="text-[10px] mt-1 italic text-gray-500">(підпис, ПІБ)</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryPage;
