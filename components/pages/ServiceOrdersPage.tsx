
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon, ListBulletIcon, Squares2X2Icon, CalendarDaysIcon, UserIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { OrderStatus, ServiceOrder } from '../../types';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import { useClients } from '../../hooks/useClients';
import { useCars } from '../../hooks/useCars';

// Status styling configuration
const LIGHT_STATUS_COLORS: { [key in OrderStatus]: string } = {
    [OrderStatus.New]: 'bg-blue-50 text-blue-700 border border-blue-200',
    [OrderStatus.InProgress]: 'bg-amber-50 text-amber-700 border border-amber-200',
    [OrderStatus.AwaitingParts]: 'bg-orange-50 text-orange-700 border border-orange-200',
    [OrderStatus.Completed]: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    [OrderStatus.Cancelled]: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const TAB_ACTIVE_COLORS: { [key in OrderStatus]: string } = {
    [OrderStatus.New]: 'bg-blue-600 text-white shadow-blue-500/30 border-blue-600',
    [OrderStatus.InProgress]: 'bg-amber-500 text-white shadow-amber-500/30 border-amber-500',
    [OrderStatus.AwaitingParts]: 'bg-orange-500 text-white shadow-orange-500/30 border-orange-500',
    [OrderStatus.Completed]: 'bg-emerald-600 text-white shadow-emerald-500/30 border-emerald-600',
    [OrderStatus.Cancelled]: 'bg-rose-600 text-white shadow-rose-500/30 border-rose-600',
};

const COLUMN_COLORS: { [key in OrderStatus]: string } = {
    [OrderStatus.New]: 'border-t-4 border-t-blue-500',
    [OrderStatus.InProgress]: 'border-t-4 border-t-amber-500',
    [OrderStatus.AwaitingParts]: 'border-t-4 border-t-orange-500',
    [OrderStatus.Completed]: 'border-t-4 border-t-emerald-500',
    [OrderStatus.Cancelled]: 'border-t-4 border-t-rose-500',
};

const ServiceOrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const { orders: serviceOrders, updateServiceOrder, loading: ordersLoading, error: ordersError } = useServiceOrders();
    const { clients } = useClients();
    const { cars } = useCars();

    // Note: orderDetails were empty in the previous context implementation.
    // If needed, they should be fetched per order in details view.
    const orderDetails: any[] = [];

    const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all'); // For List View
    const [activeMobileStatus, setActiveMobileStatus] = useState<OrderStatus>(OrderStatus.InProgress); // For Mobile Board View
    const [searchTerm, setSearchTerm] = useState('');
    const [draggedOrderId, setDraggedOrderId] = useState<string | null>(null);

    const ordersWithDetails = useMemo(() => {
        let filtered = serviceOrders;

        if (viewMode === 'list' && statusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        const mapped = filtered.map(order => {
            const client = clients.find(c => c.clientID === order.clientID);
            const car = cars.find(c => c.carID === order.carID);
            // Calculate cost safely
            const details = orderDetails.filter(d => d.orderID === order.orderID);
            const totalCost = details.reduce((sum, d) => sum + (Number(d.cost) * Number(d.quantity)), 0);

            return {
                ...order,
                clientName: client ? `${client.firstName} ${client.lastName}` : 'Невідомий',
                carName: car ? `${car.make} ${car.model}` : 'Невідоме авто',
                licensePlate: car ? car.licensePlate : '---',
                totalCost,
            };
        });

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            return mapped.filter(o =>
                o.orderID.toLowerCase().includes(lowerSearch) ||
                o.clientName.toLowerCase().includes(lowerSearch) ||
                o.carName.toLowerCase().includes(lowerSearch) ||
                o.licensePlate.toLowerCase().includes(lowerSearch)
            );
        }

        // Sort by date descending
        return mapped.sort((a, b) => {
            const dateA = new Date(a.date).getTime() || 0;
            const dateB = new Date(b.date).getTime() || 0;
            return dateB - dateA;
        });
    }, [serviceOrders, clients, cars, orderDetails, statusFilter, searchTerm, viewMode]);

    const filterStatuses: (OrderStatus | 'all')[] = ['all', ...Object.values(OrderStatus)];
    const boardStatuses = Object.values(OrderStatus);

    if (ordersLoading) return <div className="p-10 flex justify-center text-slate-500">Завантаження замовлень...</div>;
    if (ordersError) return (
        <div className="p-10 flex flex-col items-center justify-center text-red-500 bg-red-50 rounded-3xl border border-red-100 m-6">
            <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-bold">Помилка завантаження</h3>
            <p className="text-sm opacity-80">{ordersError}</p>
        </div>
    );

    // --- Drag & Drop ---
    const handleDragStart = (e: React.DragEvent, orderId: string) => {
        setDraggedOrderId(orderId);
        e.dataTransfer.setData("orderId", orderId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, newStatus: OrderStatus) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData("orderId");

        if (orderId) {
            const order = serviceOrders.find(o => o.orderID === orderId);
            if (order && order.status !== newStatus) {
                const updatedOrder: ServiceOrder = { ...order, status: newStatus };
                if (newStatus === OrderStatus.Completed && !order.endDate) {
                    updatedOrder.endDate = new Date().toISOString().split('T')[0];
                }
                await updateServiceOrder(updatedOrder);
            }
        }
        setDraggedOrderId(null);
    };

    // --- Desktop Board ---
    const renderDesktopBoardView = () => (
        <div className="hidden md:flex overflow-x-auto pb-6 gap-6 h-[calc(100vh-220px)] items-start">
            {boardStatuses.map(status => {
                const columnOrders = ordersWithDetails.filter(o => o.status === status);
                return (
                    <div
                        key={status}
                        className={`min-w-[320px] w-[320px] flex-shrink-0 bg-slate-100/70 rounded-2xl p-4 border border-slate-200/60 flex flex-col h-full ${COLUMN_COLORS[status]}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status)}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-700">{status}</h3>
                            <span className="bg-white px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-500 shadow-sm border border-slate-200">
                                {columnOrders.length}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                            {columnOrders.map(order => (
                                <div
                                    key={order.orderID}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, order.orderID)}
                                    onClick={() => navigate(`/orders/${order.orderID}`)}
                                    className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-blue-300 transition-all ${draggedOrderId === order.orderID ? 'opacity-50' : 'opacity-100'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                            #{order.orderID.substring(0, 6)}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center">
                                            <CalendarDaysIcon className="w-3 h-3 mr-1" />
                                            {new Date(order.date).toLocaleDateString('uk-UA').slice(0, 5)}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm">{order.carName}</h4>
                                    <div className="text-xs font-mono text-slate-500 mb-2 bg-yellow-50 inline-block px-1 rounded border border-yellow-100 mt-1">
                                        {order.licensePlate}
                                    </div>
                                    <p className="text-sm text-slate-600 flex items-center mb-2">
                                        <UserIcon className="w-3 h-3 mr-1.5 text-slate-400" />
                                        {order.clientName}
                                    </p>
                                    <p className="text-xs text-slate-500 line-clamp-2 mb-3 bg-slate-50 p-1.5 rounded border border-slate-100">
                                        {order.reason}
                                    </p>
                                </div>
                            ))}
                            {columnOrders.length === 0 && (
                                <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                                    Перетягніть сюди
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    // --- Mobile Board (Tabs) ---
    const renderMobileBoardView = () => {
        const mobileOrders = ordersWithDetails.filter(o => o.status === activeMobileStatus);

        return (
            <div className="md:hidden flex flex-col h-full">
                {/* Scrollable Tabs */}
                <div className="flex overflow-x-auto gap-2 pb-2 mb-2 flex-shrink-0 custom-scrollbar">
                    {boardStatuses.map(status => {
                        const count = ordersWithDetails.filter(o => o.status === status).length;
                        const isActive = activeMobileStatus === status;
                        return (
                            <button
                                key={status}
                                onClick={() => setActiveMobileStatus(status)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${isActive
                                    ? TAB_ACTIVE_COLORS[status]
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {status} <span className="opacity-70 text-xs ml-1 font-normal">({count})</span>
                            </button>
                        );
                    })}
                </div>

                {/* Mobile Card List */}
                <div className="flex-1 overflow-y-auto pb-24 space-y-3 custom-scrollbar px-1">
                    {mobileOrders.length > 0 ? (
                        mobileOrders.map(order => (
                            <div
                                key={order.orderID}
                                onClick={() => navigate(`/orders/${order.orderID}`)}
                                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm active:scale-95 transition-transform"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-extrabold text-slate-800 text-lg leading-tight">{order.carName}</h4>
                                        <span className="font-mono text-sm font-bold bg-yellow-50 text-slate-800 px-2 py-0.5 rounded border border-yellow-200 mt-1 inline-block">
                                            {order.licensePlate}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                            {new Date(order.date).toLocaleDateString('uk-UA').slice(0, 5)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 line-clamp-2">
                                    {order.reason}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400 mt-10">
                            <ListBulletIcon className="w-12 h-12 mb-2 opacity-30" />
                            <p className="font-medium">Немає замовлень</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4 md:space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 flex-shrink-0">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Наряд-замовлення</h1>
                    <p className="text-slate-500 text-sm md:text-base">Керування ремонтами</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm flex-shrink-0">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Список"
                        >
                            <ListBulletIcon className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('board')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-blue-100 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Дошка"
                        >
                            <Squares2X2Icon className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={() => navigate('/orders/create')}
                        className="flex-grow md:flex-grow-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 md:px-6 py-2.5 rounded-xl shadow-lg shadow-orange-500/30 hover:from-orange-600 hover:to-red-600 flex items-center justify-center font-bold transition-all transform hover:-translate-y-0.5 whitespace-nowrap"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        <span className="hidden sm:inline">Створити замовлення</span>
                        <span className="sm:hidden">Створити</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-sm flex-shrink-0">
                {viewMode === 'list' ? (
                    <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 w-full md:w-auto custom-scrollbar">
                        {filterStatuses.map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${statusFilter === status
                                    ? 'bg-slate-800 text-white shadow-md'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                            >
                                {status === 'all' ? 'Всі' : status}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="hidden md:flex text-sm font-bold text-slate-500 items-center">
                        <Squares2X2Icon className="w-5 h-5 mr-2" />
                        Дошка завдань (Drag & Drop)
                    </div>
                )}

                <div className="relative w-full md:w-64">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Пошук..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow shadow-sm"
                    />
                </div>
            </div>

            {/* Main Content Area */}
            {viewMode === 'list' ? (
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/30 flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="overflow-auto flex-1 custom-scrollbar">
                        <table className="min-w-full leading-normal relative">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-slate-50/95 backdrop-blur-md border-b border-slate-100 text-left text-slate-500 font-bold uppercase text-xs tracking-wider shadow-sm">
                                    <th className="px-6 py-4 w-32">Статус</th>
                                    <th className="px-6 py-4 w-24">№</th>
                                    <th className="px-6 py-4">Дата</th>
                                    <th className="px-6 py-4">Клієнт</th>
                                    <th className="px-6 py-4">Автомобіль</th>
                                    <th className="px-6 py-4">Причина</th>
                                </tr>
                            </thead>
                            <tbody className="text-slate-700">
                                {ordersWithDetails.length > 0 ? (
                                    ordersWithDetails.map(order => (
                                        <tr
                                            key={order.orderID}
                                            className="border-b border-slate-50 hover:bg-blue-50/40 cursor-pointer transition-colors"
                                            onClick={() => navigate(`/orders/${order.orderID}`)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 font-bold text-xs rounded-full inline-block shadow-sm ${LIGHT_STATUS_COLORS[order.status]}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-mono text-slate-400">
                                                <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                    {order.orderID.substring(0, 6)}...
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-slate-800">{new Date(order.date).toLocaleDateString('uk-UA')}</span>
                                                    <span className="text-xs text-slate-400">{order.time}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">{order.clientName}</td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex flex-col">
                                                    <span>{order.carName}</span>
                                                    <span className="text-xs text-slate-400 font-mono">{order.licensePlate}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm max-w-xs truncate text-slate-500">{order.reason}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-slate-400">
                                            Замовлень не знайдено.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <>
                    {renderDesktopBoardView()}
                    {renderMobileBoardView()}
                </>
            )}
        </div>
    );
};

export default ServiceOrdersPage;
