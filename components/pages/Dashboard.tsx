
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, UserPlusIcon, WrenchScrewdriverIcon, DocumentPlusIcon, CalendarDaysIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import AddClientModal from '../modals/AddClientModal';
import { OrderStatus } from '../../types';
import { startOfWeek, endOfWeek, isWithinInterval, parseISO, format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import { useClients } from '../../hooks/useClients';
import { useCars } from '../../hooks/useCars';

// Override status colors for light mode to be softer
const LIGHT_STATUS_COLORS: { [key in OrderStatus]: string } = {
  [OrderStatus.New]: 'bg-blue-50 text-blue-700 border border-blue-100',
  [OrderStatus.InProgress]: 'bg-amber-50 text-amber-700 border border-amber-100',
  [OrderStatus.AwaitingParts]: 'bg-orange-50 text-orange-700 border border-orange-100',
  [OrderStatus.Completed]: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  [OrderStatus.Cancelled]: 'bg-rose-50 text-rose-700 border border-rose-100',
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { orders: serviceOrders, loading: ordersLoading, error: ordersError } = useServiceOrders();
  const { clients } = useClients();
  const { cars } = useCars();

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  const handleClientAdded = () => {
    setIsAddClientModalOpen(false);
  };

  const actions = [
    { title: 'Нове замовлення', icon: PlusIcon, action: () => navigate('/orders/create'), color: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/30' },
    { title: 'Новий клієнт', icon: UserPlusIcon, action: () => setIsAddClientModalOpen(true), color: 'from-purple-500 to-pink-500', shadow: 'shadow-purple-500/30' },
    { title: 'Всі замовлення', icon: WrenchScrewdriverIcon, action: () => navigate('/orders'), color: 'from-orange-400 to-red-400', shadow: 'shadow-orange-400/30' },
    { title: 'Додати послугу', icon: DocumentPlusIcon, action: () => navigate('/pricelist'), color: 'from-emerald-400 to-teal-400', shadow: 'shadow-emerald-400/30' },
  ];

  const weeklyOrders = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });

    return serviceOrders
      .filter(order => {
        const orderDate = parseISO(order.date);
        const isActive = order.status === OrderStatus.New || order.status === OrderStatus.InProgress || order.status === OrderStatus.AwaitingParts;
        return isActive && isWithinInterval(orderDate, { start, end });
      })
      .map(order => {
        const client = clients.find(c => c.clientID === order.clientID);
        const car = cars.find(c => c.carID === order.carID);
        return {
          ...order,
          clientName: client ? `${client.firstName} ${client.lastName}` : 'N/A',
          carName: car ? `${car.make} ${car.model}` : 'N/A',
        };
      })
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [serviceOrders, clients, cars]);

  if (ordersLoading) return <div className="p-10 flex justify-center text-slate-500">Завантаження...</div>;
  if (ordersError) return (
    <div className="p-10 flex flex-col items-center justify-center text-red-500 bg-red-50 rounded-3xl border border-red-100 m-6">
      <ExclamationTriangleIcon className="w-12 h-12 mb-4" />
      <h3 className="text-lg font-bold">Помилка завантаження даних</h3>
      <p className="text-sm opacity-80">{ordersError}</p>
    </div>
  );

  return (
    <>
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onClientAdded={handleClientAdded}
      />
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2">Панель приладів</h1>
          <p className="text-slate-500 text-lg">Вітаємо в системі управління RemServ</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`relative group overflow-hidden p-6 rounded-3xl bg-white shadow-xl shadow-indigo-100/50 border border-white/50 hover:-translate-y-1 transition-all duration-300`}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity bg-gradient-to-br ${action.color}`} />
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} ${action.shadow} flex items-center justify-center mb-4 text-white transform group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="w-8 h-8" />
              </div>
              <span className="text-xl font-bold text-slate-700 group-hover:text-slate-900">{action.title}</span>
            </button>
          ))}
        </div>

        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/40">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center">
              <div className="p-2 bg-blue-100 rounded-xl mr-3 text-blue-600">
                <CalendarDaysIcon className="w-6 h-6" />
              </div>
              Замовлення на цей тиждень
            </h2>
          </div>

          <div className="space-y-4">
            {weeklyOrders.length > 0 ? (
              weeklyOrders.map(order => (
                <div
                  key={order.orderID}
                  onClick={() => navigate(`/orders/${order.orderID}`)}
                  className="group bg-white/50 hover:bg-white p-5 rounded-2xl border border-slate-100 hover:border-blue-200 flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 bg-indigo-50 text-indigo-600 rounded-xl font-bold">
                      <span className="text-xs uppercase">{format(parseISO(order.date), 'MMM', { locale: uk })}</span>
                      <span className="text-xl">{format(parseISO(order.date), 'dd')}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        {order.carName}
                        <span className="text-sm font-normal text-slate-400">({order.time})</span>
                      </p>
                      <p className="text-slate-500">{order.clientName}</p>
                      <p className="text-sm text-slate-400 mt-1 max-w-md truncate flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>
                        {order.reason}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <span className={`px-4 py-2 font-semibold text-xs rounded-full uppercase tracking-wider ${LIGHT_STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="inline-block p-4 rounded-full bg-slate-50 mb-4">
                  <CalendarDaysIcon className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">На цей тиждень немає запланованих робіт.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
