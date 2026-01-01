import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    eachDayOfInterval,
    parseISO,
    isWithinInterval,
    startOfDay,
    differenceInCalendarDays,
} from 'date-fns';
import { uk } from 'date-fns/locale';
import AddAppointmentModal from '../modals/AddAppointmentModal';
import { ServiceOrder, OrderStatus } from '../../types';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import { useClients } from '../../hooks/useClients';
import { useCars } from '../../hooks/useCars';

interface CalendarEvent {
    order: ServiceOrder;
    clientName: string;
    carName: string;
    start: Date;
    end: Date;
}

const CalendarPage: React.FC = () => {
    const navigate = useNavigate();
    const { orders: serviceOrders, loading: ordersLoading } = useServiceOrders();
    const { clients, loading: clientsLoading } = useClients();
    const { cars, loading: carsLoading } = useCars();

    const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
    const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const calendarEvents = useMemo((): CalendarEvent[] => {
        const activeOrders = serviceOrders.filter(order =>
            order.status !== OrderStatus.Completed && order.status !== OrderStatus.Cancelled
        );

        return activeOrders.map(order => {
            const client = clients.find(c => c.clientID === order.clientID);
            const car = cars.find(c => c.carID === order.carID);

            return {
                order,
                clientName: client ? `${client.firstName} ${client.lastName}` : 'N/A',
                carName: car ? `${car.make} ${car.model}` : 'N/A',
                start: startOfDay(parseISO(order.date)),
                end: startOfDay(order.endDate ? parseISO(order.endDate) : parseISO(order.date)),
            };
        });
    }, [serviceOrders, clients, cars]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, number>();
        calendarEvents.forEach(event => {
            const days = eachDayOfInterval({ start: event.start, end: event.end });
            days.forEach(day => {
                const key = format(day, 'yyyy-MM-dd');
                map.set(key, (map.get(key) || 0) + 1);
            });
        });
        return map;
    }, [calendarEvents]);

    const selectedDayOrders = useMemo(() => {
        return calendarEvents.filter(event =>
            isWithinInterval(selectedDate, { start: event.start, end: event.end })
        ).sort((a, b) => a.order.time.localeCompare(b.order.time));
    }, [selectedDate, calendarEvents]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
    };

    if (ordersLoading || clientsLoading || carsLoading) {
        return <div className="p-10 text-center text-slate-500 font-bold">Завантаження календаря...</div>;
    }

    const renderMiniCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const today = startOfDay(new Date());

        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20 h-fit">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Previous month"><ChevronLeftIcon className="h-5 w-5 text-slate-500" /></button>
                    <h3 className="text-lg font-bold text-slate-800 capitalize">
                        {format(currentMonth, 'LLLL yyyy', { locale: uk })}
                    </h3>
                    <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Next month"><ChevronRightIcon className="h-5 w-5 text-slate-500" /></button>
                </div>
                <div className="grid grid-cols-7 text-center text-xs text-slate-400 font-bold mb-3 uppercase tracking-wider">
                    {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'НД'].map(day => <div key={day}>{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days.map(day => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, today);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const dayKey = format(day, 'yyyy-MM-dd');
                        const hasEvents = eventsByDate.has(dayKey);

                        return (
                            <div key={day.toString()} className="flex justify-center items-center aspect-square">
                                <button
                                    onClick={() => handleDayClick(day)}
                                    className={`
                                        relative w-full h-full flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200
                                        ${isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}
                                        ${!isSelected && isCurrentMonth ? 'hover:bg-blue-50 hover:text-blue-600' : ''}
                                        ${isSelected ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105' : ''}
                                        ${!isSelected && isToday ? 'bg-blue-100/50 text-blue-700 border border-blue-200' : ''}
                                    `}
                                >
                                    {hasEvents && isCurrentMonth && !isSelected && (
                                        <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                    )}
                                    {format(day, 'd')}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderAppointmentsList = () => {
        return (
            <div className="bg-white/50 backdrop-blur-xl rounded-3xl border border-white/60 p-6 min-h-[500px]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">
                        Записи на {format(selectedDate, 'd MMMM', { locale: uk })}
                    </h2>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="text-sm bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-blue-50 transition-colors"
                    >
                        + Додати запис
                    </button>
                </div>

                {selectedDayOrders.length > 0 ? (
                    <div className="space-y-4">
                        {selectedDayOrders.map(event => {
                            const totalDays = differenceInCalendarDays(event.end, event.start) + 1;
                            const currentDayNumber = differenceInCalendarDays(selectedDate, event.start) + 1;
                            return (
                                <div
                                    key={event.order.orderID}
                                    className="group bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-300"
                                    onClick={() => navigate(`/orders/${event.order.orderID}`)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center">
                                            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold text-sm mr-3">
                                                {event.order.time}
                                            </div>
                                            <p className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{event.clientName}</p>
                                        </div>
                                        {totalDays > 1 && (
                                            <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full font-bold border border-indigo-100">
                                                День {currentDayNumber}/{totalDays}
                                            </span>
                                        )}
                                    </div>
                                    <div className="pl-[4.5rem]">
                                        <p className="text-sm font-medium text-slate-600 mb-1">{event.carName}</p>
                                        <p className="text-sm text-slate-500 bg-slate-50 p-2 rounded-lg inline-block border border-slate-100">{event.order.reason}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <p className="text-slate-400 font-medium">На обрану дату записів немає.</p>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="mt-4 text-blue-500 hover:text-blue-700 font-semibold text-sm"
                        >
                            Створити перший запис
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <AddAppointmentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                initialDateTime={selectedDate}
            />
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Календар</h1>
                    <p className="text-slate-500 mt-1">Розклад роботи СТО</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 xl:col-span-4">
                        {renderMiniCalendar()}
                    </div>

                    <div className="lg:col-span-8 xl:col-span-8">
                        {renderAppointmentsList()}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CalendarPage;