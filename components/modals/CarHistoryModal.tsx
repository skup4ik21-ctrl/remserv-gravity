import React, { useMemo } from 'react';
import Modal from '../ui/Modal';
import { Car } from '../../types';
import { STATUS_COLORS } from '../../constants';
import { CalendarDaysIcon, WrenchScrewdriverIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import { useAllOrderDetails } from '../../hooks/useAllOrderDetails';
import { useNavigate } from 'react-router-dom';


interface CarHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  car: Car | null;
}

const CarHistoryModal: React.FC<CarHistoryModalProps> = ({ isOpen, onClose, car }) => {
  const { orders: serviceOrders } = useServiceOrders();
  const carOrderIds = useMemo(() => {
    if (!car) return [];
    return serviceOrders.filter(o => o.carID === car.carID).map(o => o.orderID);
  }, [car, serviceOrders]);

  const { orderDetails } = useAllOrderDetails(carOrderIds);
  const navigate = useNavigate();

  const carHistory = useMemo(() => {
    if (!car) return [];
    return serviceOrders
      .filter(order => order.carID === car.carID)
      .map(order => {
        const details = orderDetails.filter(d => d.orderID === order.orderID);
        const totalCost = details.reduce((sum, d) => sum + d.cost * d.quantity, 0);
        return {
          ...order,
          totalCost,
          navigateToDetail: () => {
            onClose();
            navigate(`/orders/${order.orderID}`);
          }
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [car, serviceOrders, orderDetails, navigate, onClose]);

  if (!car) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Історія обслуговування" size="xl">
      <div className="mb-6 pb-4 border-b border-slate-100">
        <h3 className="text-2xl font-bold text-slate-800">{car.make} {car.model}</h3>
        <span className="inline-block mt-1 px-3 py-1 bg-slate-100 text-slate-700 font-mono text-sm font-bold rounded-lg border border-slate-200">
          {car.licensePlate}
        </span>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {carHistory.length > 0 ? (
          carHistory.map(order => (
            <div
              key={order.orderID}
              className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all duration-200"
              onClick={order.navigateToDetail}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-blue-600 group-hover:underline">#{order.orderID}</span>
                    <span className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-full tracking-wide ${STATUS_COLORS[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 flex items-center mt-1">
                    <CalendarDaysIcon className="w-4 h-4 mr-1.5 text-slate-400" />
                    {new Date(order.date).toLocaleDateString('uk-UA')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800 flex items-center justify-end">
                    {order.totalCost.toFixed(2)} <span className="text-sm font-normal text-slate-400 ml-1">грн</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <p className="text-sm text-slate-700 flex items-start">
                  <WrenchScrewdriverIcon className="w-4 h-4 mr-2 mt-0.5 text-slate-400 flex-shrink-0" />
                  <span><span className="font-semibold text-slate-900">Причина:</span> {order.reason}</span>
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 px-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500 font-medium">Історія обслуговування відсутня</p>
            <p className="text-sm text-slate-400 mt-1">Для цього автомобіля ще не було створено замовлень.</p>
          </div>
        )}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}</style>
    </Modal>
  );
};

export default CarHistoryModal;
