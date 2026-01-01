
import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OrderStatus, ServiceOrder, Part, PartStatus, OrderDetail, ExtractedPart, Master, TransactionType } from '../../types';
import { ArrowLeftIcon, PrinterIcon, PlusIcon, TrashIcon, ArchiveBoxIcon, CheckIcon, XMarkIcon, SparklesIcon, DocumentArrowUpIcon, WrenchScrewdriverIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import SelectServicesModal from '../modals/SelectServicesModal';
import PhotoViewerModal from '../modals/PhotoViewerModal';
import { extractPartsFromInvoiceImage } from '../../services/geminiService';
import { sendOrderNotification } from '../../services/telegramService';
import ConfirmPartsModal from '../modals/ConfirmPartsModal';
import { useServiceOrder } from '../../hooks/useServiceOrder';
import { useOrderParts } from '../../hooks/useOrderParts';
import { useClients } from '../../hooks/useClients';
import { useCars } from '../../hooks/useCars';
import { useServices } from '../../hooks/useServices';
import { useMasters } from '../../hooks/useMasters';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { useInventory } from '../../hooks/useInventory';

const PART_STATUS_SELECT_COLORS: { [key in PartStatus]: string } = {
    [PartStatus.Ordered]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [PartStatus.Received]: 'bg-green-100 text-green-800 border-green-200',
    [PartStatus.Reordered]: 'bg-purple-100 text-purple-800 border-purple-200',
    [PartStatus.StockDeducted]: 'bg-blue-100 text-blue-800 border-blue-200',
};

const DETAIL_STATUS_COLORS: { [key in OrderStatus]: string } = {
    [OrderStatus.New]: 'bg-blue-100 text-blue-800 border-blue-200',
    [OrderStatus.InProgress]: 'bg-amber-100 text-amber-800 border-amber-200',
    [OrderStatus.AwaitingParts]: 'bg-orange-100 text-orange-800 border-orange-200',
    [OrderStatus.Completed]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    [OrderStatus.Cancelled]: 'bg-rose-100 text-rose-800 border-rose-200',
};

const ServiceOrderDetailPage: React.FC = () => {
    const { orderID } = useParams<{ orderID: string }>();
    const navigate = useNavigate();

    const {
        order,
        details: localDetails,
        loading: orderLoading,
        updateOrder,
        addOrderDetails
    } = useServiceOrder(orderID);

    const {
        parts: localParts,
        loading: partsLoading,
        addMultipleParts
    } = useOrderParts(orderID);

    const { clients } = useClients();
    const { cars } = useCars();
    const { services: priceList, getSmartPrice } = useServices();
    const { masters } = useMasters();
    const { settings: companySettings } = useCompanySettings();
    const { addWarehouseTransaction } = useInventory();

    const [isSendingTelegram, setIsSendingTelegram] = useState<string | null>(null);
    const [isSelectServiceModalOpen, setIsSelectServiceModalOpen] = useState(false);

    const [currentStatus, setCurrentStatus] = useState<OrderStatus | undefined>(order?.status);
    const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    const [isProcessingInvoice, setIsProcessingInvoice] = useState(false);
    const [extractedParts, setExtractedParts] = useState<ExtractedPart[] | null>(null);
    const [isConfirmPartsModalOpen, setIsConfirmPartsModalOpen] = useState(false);

    useEffect(() => {
        if (order) {
            setCurrentStatus(order.status);
        }
    }, [order]);

    const orderFullDetails = useMemo(() => {
        if (!order) return null;
        const client = clients.find(c => c.clientID === order.clientID);
        const car = cars.find(c => c.carID === order.carID);
        const assignedMasters = masters.filter(m => order.masterIDs.includes(m.masterID));
        const details = localDetails.map(detail => {
            const service = priceList.find(s => s.serviceID === detail.serviceID);
            return {
                ...detail,
                serviceName: detail.customName || service?.name || 'Послуга',
                total: detail.cost * detail.quantity,
            };
        });
        const totalServicesCost = details.reduce((sum, d) => sum + d.total, 0);
        const totalPartsCost = localParts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        return { order, client, car, details, totalServicesCost, totalPartsCost, finalTotalCost: totalServicesCost + totalPartsCost, assignedMasters };
    }, [order, clients, cars, localDetails, priceList, masters, localParts]);

    const handleSendToTelegram = async (master: Master) => {
        if (!companySettings?.telegramBotToken) { alert("Налаштуйте Telegram Bot Token."); return; }
        if (!master.telegramChatId) { alert("У майстра немає Telegram Chat ID."); return; }
        if (!orderFullDetails) return;
        setIsSendingTelegram(master.masterID);
        try {
            await sendOrderNotification(companySettings.telegramBotToken, master, orderFullDetails.order, orderFullDetails.car!, orderFullDetails.details);
            alert(`Успішно надіслано майстру ${master.name}`);
        } finally { setIsSendingTelegram(null); }
    };

    const handleConfirmAddParts = (confirmedParts: ExtractedPart[]) => {
        addMultipleParts(confirmedParts.map(p => ({
            name: p.name,
            partNumber: p.partNumber,
            price: p.price,
            quantity: p.quantity,
            status: PartStatus.Ordered
        })));
        setIsConfirmPartsModalOpen(false);
        setExtractedParts(null);
    };

    const handleStatusUpdate = async (newStatus: OrderStatus) => {
        if (!orderFullDetails || !orderID) return;
        let updatedData: Partial<ServiceOrder> = { status: newStatus };

        // Stock deduction on completion
        if (newStatus === OrderStatus.Completed && !orderFullDetails.order.isStockDeducted) {
            if (localParts.length > 0) {
                await addWarehouseTransaction({
                    date: new Date().toISOString(),
                    type: TransactionType.Sale,
                    docNumber: orderID,
                    parts: localParts.map(p => ({
                        name: p.name,
                        partNumber: p.partNumber,
                        quantity: p.quantity,
                        purchasePrice: p.price / 1.3
                    })),
                    totalAmount: localParts.reduce((s, p) => s + (p.price * p.quantity), 0),
                    orderID: orderID
                });
                updatedData.isStockDeducted = true;
            }
        }

        if (newStatus === OrderStatus.Completed && !orderFullDetails.order.endDate) {
            updatedData.endDate = new Date().toISOString().split('T')[0];
        }

        setCurrentStatus(newStatus);
        await updateOrder(updatedData);
    };

    const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsProcessingInvoice(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64String = reader.result?.toString().split(',')[1];
                const partsFromAI = await extractPartsFromInvoiceImage(base64String!);
                setExtractedParts(partsFromAI);
                setIsConfirmPartsModalOpen(true);
            } catch (error) { alert("Помилка обробки накладної."); } finally { setIsProcessingInvoice(false); }
        };
        reader.readAsDataURL(file);
    };

    if (orderLoading || partsLoading || !orderFullDetails) {
        return <div className="flex justify-center items-center h-screen"><WrenchScrewdriverIcon className="w-16 h-16 text-blue-500 animate-spin" /></div>;
    }

    const { order: currentOrder, client, car, details, totalServicesCost, totalPartsCost, finalTotalCost, assignedMasters } = orderFullDetails;
    const isOrderActive = [OrderStatus.New, OrderStatus.InProgress, OrderStatus.AwaitingParts].includes(currentStatus || OrderStatus.New);

    return (
        <div className="max-w-5xl mx-auto print:w-full print:max-w-none">
            <SelectServicesModal
                isOpen={isSelectServiceModalOpen}
                onClose={() => setIsSelectServiceModalOpen(false)}
                onServicesSelected={(s) => {
                    if (!car || !orderID) return;
                    const newDetails = s.map(x => ({
                        serviceID: x.serviceID,
                        quantity: x.quantity,
                        cost: getSmartPrice(x.serviceID, car.carID).price
                    }));
                    addOrderDetails(newDetails);
                    setIsSelectServiceModalOpen(false);
                }}
                alreadyAddedServiceIds={details.map(d => d.serviceID)}
                carIdForPricing={car?.carID || null}
            />
            <PhotoViewerModal isOpen={isPhotoViewerOpen} onClose={() => setIsPhotoViewerOpen(false)} imageSrc={selectedPhoto} />
            <ConfirmPartsModal isOpen={isConfirmPartsModalOpen} onClose={() => setIsConfirmPartsModalOpen(false)} extractedParts={extractedParts} onConfirm={handleConfirmAddParts} />

            <div className="print:hidden">
                <button onClick={() => navigate('/orders')} className="mb-6 flex items-center text-slate-500 hover:text-blue-600 font-medium transition-colors"><ArrowLeftIcon className="w-5 h-5 mr-2" />Назад до замовлень</button>
                <div className="bg-white/70 backdrop-blur-xl p-6 sm:p-10 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20">
                    <div className="flex flex-col md:flex-row justify-between items-start border-b border-slate-200/60 pb-6 mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Наряд-замовлення №{currentOrder.orderID}</h1>
                            <p className="text-slate-500 mt-1 font-medium">від {new Date(currentOrder.date).toLocaleDateString('uk-UA')} {currentOrder.time}</p>
                        </div>
                        <button onClick={() => window.print()} className="px-4 py-2.5 text-slate-600 bg-white rounded-xl hover:bg-slate-50 border border-slate-300 shadow-sm flex items-center font-medium transition-colors"><PrinterIcon className="w-5 h-5 mr-2" /><span>Друк / PDF</span></button>
                    </div>

                    <div className="mb-8">
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Статус замовлення</label>
                        <div className="flex flex-wrap items-center gap-3">
                            <select
                                value={currentStatus}
                                onChange={(e) => handleStatusUpdate(e.target.value as OrderStatus)}
                                className="block w-full sm:w-48 px-4 py-2.5 bg-white border border-slate-300 rounded-xl shadow-sm text-slate-800 font-medium focus:ring-2 focus:ring-blue-500"
                            >
                                {Object.values(OrderStatus).map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-3 mb-4">Клієнт</h2>
                            <p className="text-slate-600 flex justify-between"><span className="font-medium text-slate-800">Ім'я:</span> <span>{client?.firstName} {client?.lastName}</span></p>
                            <p className="text-slate-600 flex justify-between mt-1"><span className="font-medium text-slate-800">Телефон:</span> <span className="font-mono bg-slate-100 px-2 rounded text-slate-700">{client?.phone}</span></p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h2 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-3 mb-4">Автомобіль</h2>
                            <p className="text-slate-600 flex justify-between"><span className="font-medium text-slate-800">Авто:</span> <span>{car?.make} {car?.model} ({car?.year})</span></p>
                            <p className="text-slate-600 flex justify-between items-center mt-1"><span className="font-medium text-slate-800">Держ. номер:</span> <span className="font-bold bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md">{car?.licensePlate}</span></p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
                        <h2 className="font-bold text-lg text-slate-800 mb-3">Майстри</h2>
                        <div className="flex flex-wrap gap-2">
                            {assignedMasters.map(m => (
                                <div key={m.masterID} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-100">
                                    <span className="text-sm font-bold">{m.name}</span>
                                    {m.telegramChatId && <button onClick={() => handleSendToTelegram(m)} disabled={!!isSendingTelegram} className="p-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all"><PaperAirplaneIcon className="w-3 h-3" /></button>}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <h2 className="font-bold text-xl text-slate-800 flex items-center">
                                <div className="p-2 bg-indigo-100 rounded-lg mr-3 text-indigo-600"><ArchiveBoxIcon className="w-6 h-6" /></div>
                                Запчастини та матеріали
                            </h2>
                            {isOrderActive && (
                                <div className="mt-2 sm:mt-0 flex gap-2">
                                    <input type="file" id="invoice-upload" className="hidden" accept="image/*" onChange={handleInvoiceUpload} disabled={isProcessingInvoice} />
                                    <label htmlFor="invoice-upload" className={`inline-flex items-center bg-indigo-50 text-indigo-700 border border-indigo-100 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isProcessingInvoice ? 'cursor-not-allowed opacity-50' : 'hover:bg-indigo-100 cursor-pointer'}`}>
                                        {isProcessingInvoice ? <><SparklesIcon className="w-5 h-5 mr-2 animate-spin" /> Аналіз AI...</> : <><DocumentArrowUpIcon className="w-5 h-5 mr-2" /> Додати з накладної (AI)</>}
                                    </label>
                                </div>
                            )}
                        </div>
                        <div className="space-y-3 mb-6">
                            {localParts.map(part => (
                                <div key={part.partID} className={`p-4 bg-white rounded-xl border border-slate-200 shadow-sm grid grid-cols-12 gap-x-4 items-center ${part.status === PartStatus.StockDeducted ? 'opacity-60 bg-slate-50' : ''}`}>
                                    <div className="col-span-12 md:col-span-5 mb-2 md:mb-0">
                                        <p className={`font-bold text-slate-800 ${part.status === PartStatus.StockDeducted ? 'line-through text-slate-400' : ''}`}>{part.name}</p>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5">{part.partNumber && `Арт: ${part.partNumber}`} {part.supplier && <span className="text-slate-400">| {part.supplier}</span>}</p>
                                    </div>
                                    <div className="col-span-4 md:col-span-2 text-sm text-center text-slate-600 bg-slate-100 py-1 rounded-lg">{part.quantity} шт. x {part.price.toFixed(2)}</div>
                                    <div className="col-span-4 md:col-span-2 font-bold text-center text-slate-800">{(part.quantity * part.price).toFixed(2)} <span className="text-xs font-normal text-slate-400">грн</span></div>
                                    <div className="col-span-4 md:col-span-3 text-right">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${PART_STATUS_SELECT_COLORS[part.status]}`}>{part.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl border bg-white border-slate-200 shadow-sm mb-8">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-bold text-xl flex items-center text-slate-800">
                                <div className="p-2 bg-orange-100 rounded-lg mr-3 text-orange-600"><WrenchScrewdriverIcon className="w-6 h-6" /></div>
                                Виконані роботи
                            </h2>
                            {isOrderActive && <button onClick={() => setIsSelectServiceModalOpen(true)} className="flex items-center bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-orange-600 transition-all"><PlusIcon className="w-5 h-5 mr-2" />Додати роботу</button>}
                        </div>
                        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                            <table className="min-w-full leading-normal">
                                <thead><tr className="bg-slate-50 text-left text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-200"><th className="px-6 py-4">Послуга</th><th className="px-6 py-4 text-center">К-ть</th><th className="px-6 py-4 text-right">Ціна</th><th className="px-6 py-4 text-right">Сума</th></tr></thead>
                                <tbody className="text-slate-700 divide-y divide-slate-100">
                                    {details.map(detail => (
                                        <tr key={detail.detailID} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium">{detail.serviceName}</td>
                                            <td className="px-6 py-4 text-sm text-center font-mono text-slate-600">{detail.quantity}</td>
                                            <td className="px-6 py-4 text-sm text-right">{detail.cost.toFixed(2)} грн</td>
                                            <td className="px-6 py-4 text-sm text-right font-bold text-slate-800">{detail.total.toFixed(2)} грн</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end mt-8">
                        <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-slate-200 shadow-lg space-y-3">
                            <div className="flex justify-between items-center text-slate-500 font-medium"><span>Роботи:</span><span className="text-slate-800">{totalServicesCost.toFixed(2)} грн</span></div>
                            <div className="flex justify-between items-center text-slate-500 font-medium"><span>Запчастини:</span><span className="text-slate-800">{totalPartsCost.toFixed(2)} грн</span></div>
                            <div className="border-t border-slate-200 pt-3 mt-2 flex justify-between items-center"><span className="text-xl font-extrabold text-slate-800 uppercase tracking-tight">Разом:</span><span className="text-3xl font-extrabold text-blue-600">{finalTotalCost.toFixed(2)} грн</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Area */}
            <div className="hidden print:block bg-white text-black p-0 m-0 w-full font-serif">
                <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold uppercase tracking-wider">{companySettings?.name || 'RemServ'}</h1>
                        <p className="text-sm">Автосервіс та запчастини • тел: {companySettings?.phone || ''}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold">Наряд-замовлення № {currentOrder.orderID}</h2>
                        <p className="text-sm mt-1">Дата: {new Date(currentOrder.date).toLocaleDateString('uk-UA')}</p>
                    </div>
                </div>
                <div className="flex justify-between mb-8 text-sm">
                    <div className="w-[45%] p-2 border border-black"><h3 className="font-bold border-b border-black mb-1">Замовник (Клієнт)</h3><p>{client?.firstName} {client?.lastName}</p><p>Тел: {client?.phone}</p></div>
                    <div className="w-[45%] p-2 border border-black"><h3 className="font-bold border-b border-black mb-1">Транспортний засіб</h3><p>{car?.make} {car?.model} • {car?.year}р.</p><p>Держ. номер: {car?.licensePlate} • VIN: {car?.vin || '-'}</p></div>
                </div>

                <div className="mb-6">
                    <h3 className="font-bold text-lg mb-2">1. Виконані роботи та послуги</h3>
                    <table className="w-full text-sm border-collapse border border-black">
                        <thead><tr className="bg-gray-100 border-b border-black"><th className="border border-black p-1 text-left">Найменування</th><th className="border border-black p-1 text-center">К-ть</th><th className="border border-black p-1 text-right">Ціна, грн</th><th className="border border-black p-1 text-right">Сума, грн</th></tr></thead>
                        <tbody>{details.map((detail, i) => (<tr key={i} className="border-b border-black"><td className="border border-black p-1">{detail.serviceName}</td><td className="border border-black p-1 text-center">{detail.quantity}</td><td className="border border-black p-1 text-right">{detail.cost.toFixed(2)}</td><td className="border border-black p-1 text-right">{detail.total.toFixed(2)}</td></tr>))}</tbody>
                    </table>
                </div>

                {localParts.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-bold text-lg mb-2">2. Використані запасні частини та матеріали</h3>
                        <table className="w-full text-sm border-collapse border border-black">
                            <thead><tr className="bg-gray-100 border-b border-black"><th className="border border-black p-1 text-left">Найменування / Артикул</th><th className="border border-black p-1 text-center">К-ть</th><th className="border border-black p-1 text-right">Ціна, грн</th><th className="border border-black p-1 text-right">Сума, грн</th></tr></thead>
                            <tbody>{localParts.map((part, i) => (<tr key={i} className="border-b border-black"><td className="border border-black p-1">{part.name} {part.partNumber && <span className="text-xs">({part.partNumber})</span>}</td><td className="border border-black p-1 text-center">{part.quantity}</td><td className="border border-black p-1 text-right">{part.price.toFixed(2)}</td><td className="border border-black p-1 text-right">{(part.price * part.quantity).toFixed(2)}</td></tr>))}</tbody>
                        </table>
                    </div>
                )}

                <div className="border-t-2 border-black pt-2 flex flex-col items-end mb-10">
                    <div className="text-xl font-bold uppercase">Всього до оплати: {finalTotalCost.toFixed(2)} грн</div>
                </div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 1.5cm; size: A4; }
                    html, body { height: auto !important; overflow: visible !important; background: white !important; color: black !important; }
                    aside, nav, .print-hidden, .print\\:hidden, button, select, input, textarea { display: none !important; }
                    .hidden.print\\:block { display: block !important; width: 100% !important; }
                }
            `}</style>
        </div>
    );
};

export default ServiceOrderDetailPage;
