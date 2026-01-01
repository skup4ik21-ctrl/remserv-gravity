
import React, { useState, useEffect, useMemo } from 'react';
import { 
    ChartBarIcon, CurrencyDollarIcon, WrenchScrewdriverIcon, 
    ArrowPathIcon, CalendarDaysIcon, PresentationChartLineIcon,
    ArrowTrendingUpIcon, ArrowTrendingDownIcon, BanknotesIcon,
    BriefcaseIcon, ShieldExclamationIcon
} from '@heroicons/react/24/outline';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { OrderStatus, ServiceOrder, OrderDetail, Part, Master } from '../../types';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend 
} from 'recharts';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, format, parseISO, startOfYear, endOfYear, subYears, eachDayOfInterval, isSameDay } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';

type TimeRange = 'thisMonth' | 'lastMonth' | 'thisYear' | 'allTime';

const COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

const AnalyticsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');
  
  const [allOrders, setAllOrders] = useState<ServiceOrder[]>([]);
  const [allDetails, setAllDetails] = useState<OrderDetail[]>([]);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [allMasters, setAllMasters] = useState<Master[]>([]);

  useEffect(() => {
    if (!isAdmin) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const ordersQuery = query(collection(db, 'serviceOrders'), where('status', '==', OrderStatus.Completed));
        const ordersSnap = await getDocs(ordersQuery);
        const orders = ordersSnap.docs.map(doc => ({ ...doc.data(), orderID: doc.id } as ServiceOrder));
        setAllOrders(orders);

        const mastersSnap = await getDocs(collection(db, 'masters'));
        setAllMasters(mastersSnap.docs.map(doc => ({ ...doc.data(), masterID: doc.id } as Master)));

        if (orders.length > 0) {
            const [detailsSnap, partsSnap] = await Promise.all([
                getDocs(collection(db, 'orderDetails')),
                getDocs(collection(db, 'parts'))
            ]);
            setAllDetails(detailsSnap.docs.map(doc => ({ ...doc.data(), detailID: doc.id } as OrderDetail)));
            setAllParts(partsSnap.docs.map(doc => ({ ...doc.data(), partID: doc.id } as Part)));
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="p-4 bg-rose-100 rounded-full mb-4 text-rose-600">
                <ShieldExclamationIcon className="w-16 h-16" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Доступ обмежено</h1>
            <p className="text-slate-500 mt-2">Фінансова аналітика доступна тільки для адміністраторів.</p>
        </div>
    );
  }

  const calculateTotals = (orders: ServiceOrder[], details: OrderDetail[], parts: Part[], masters: Master[]) => {
      const orderIds = new Set(orders.map(o => o.orderID));
      const relevantDetails = details.filter(d => orderIds.has(d.orderID));
      const relevantParts = parts.filter(p => orderIds.has(p.orderID));

      const servicesRevenue = relevantDetails.reduce((sum, d) => sum + (Number(d.cost) * Number(d.quantity)), 0);
      const partsRevenue = relevantParts.reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0);
      
      let totalSalaries = 0;
      orders.forEach(order => {
          if (order.masterIDs && order.masterIDs.length > 0) {
              const orderLabor = relevantDetails.filter(d => d.orderID === order.orderID)
                  .reduce((sum, d) => sum + (Number(d.cost) * Number(d.quantity)), 0);
              
              const laborPerMaster = orderLabor / order.masterIDs.length;
              order.masterIDs.forEach(mID => {
                  const mInfo = masters.find(m => m.masterID === mID);
                  if (mInfo) {
                      totalSalaries += (laborPerMaster * (mInfo.commissionPercentage || 40)) / 100;
                  }
              });
          }
      });

      return {
          servicesRevenue,
          partsRevenue,
          totalSalaries,
          totalRevenue: servicesRevenue + partsRevenue,
          netProfit: (servicesRevenue + partsRevenue) - totalSalaries,
          count: orders.length
      };
  };

  const metrics = useMemo(() => {
      const now = new Date();
      let start: Date, end: Date;
      let prevStart: Date, prevEnd: Date;

      switch (timeRange) {
          case 'thisMonth':
              start = startOfMonth(now); end = endOfMonth(now);
              prevStart = startOfMonth(subMonths(now, 1)); prevEnd = endOfMonth(subMonths(now, 1));
              break;
          case 'lastMonth':
              start = startOfMonth(subMonths(now, 1)); end = endOfMonth(subMonths(now, 1));
              prevStart = startOfMonth(subMonths(now, 2)); prevEnd = endOfMonth(subMonths(now, 2));
              break;
          case 'thisYear':
              start = startOfYear(now); end = endOfYear(now);
              prevStart = startOfYear(subYears(now, 1)); prevEnd = endOfYear(subYears(now, 1));
              break;
          case 'allTime':
          default:
              start = new Date(0); end = new Date(2100, 0, 1);
              prevStart = new Date(0); prevEnd = new Date(0);
              break;
      }

      const currentOrders = allOrders.filter(o => isWithinInterval(parseISO(o.date), { start, end }));
      const prevOrders = allOrders.filter(o => isWithinInterval(parseISO(o.date), { start: prevStart, end: prevEnd }));

      const currentStats = calculateTotals(currentOrders, allDetails, allParts, allMasters);
      const prevStats = calculateTotals(prevOrders, allDetails, allParts, allMasters);

      const calcTrend = (curr: number, prev: number) => {
          if (prev === 0) return curr > 0 ? 100 : 0;
          return ((curr - prev) / prev) * 100;
      };

      const dailyDataMap = new Map<string, { date: string, rawDate: Date, services: number, parts: number }>();
      if (timeRange === 'thisMonth' || timeRange === 'lastMonth') {
          const daysInterval = eachDayOfInterval({ start, end: timeRange === 'thisMonth' ? now : end });
          daysInterval.forEach(day => {
              const key = format(day, 'dd.MM');
              dailyDataMap.set(key, { date: key, rawDate: day, services: 0, parts: 0 });
          });
      }

      currentOrders.forEach(order => {
          const orderDate = parseISO(order.date);
          const dateKey = format(orderDate, 'dd.MM');
          if (!dailyDataMap.has(dateKey)) dailyDataMap.set(dateKey, { date: dateKey, rawDate: orderDate, services: 0, parts: 0 });
          const entry = dailyDataMap.get(dateKey)!;
          entry.services += allDetails.filter(d => d.orderID === order.orderID).reduce((sum, d) => sum + (Number(d.cost) * Number(d.quantity)), 0);
          entry.parts += allParts.filter(p => p.orderID === order.orderID).reduce((sum, p) => sum + (Number(p.price) * Number(p.quantity)), 0);
      });

      return {
          ...currentStats,
          revenueTrend: calcTrend(currentStats.totalRevenue, prevStats.totalRevenue),
          profitTrend: calcTrend(currentStats.netProfit, prevStats.netProfit),
          chartData: Array.from(dailyDataMap.values()).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime()),
          start, end
      };
  }, [timeRange, allOrders, allDetails, allParts, allMasters]);

  if (loading) return <div className="flex flex-col items-center justify-center h-96"><ArrowPathIcon className="w-10 h-10 text-blue-500 animate-spin mb-4" /><p className="text-slate-500 font-medium">Аналізуємо фінансові потоки...</p></div>;

  const pieData = [
      { name: 'Прибуток', value: metrics.netProfit },
      { name: 'Зарплати', value: metrics.totalSalaries },
      { name: 'Запчастини (оборот)', value: metrics.partsRevenue },
  ].filter(d => d.value > 0);

  const TrendIndicator: React.FC<{ value: number }> = ({ value }) => {
      if (timeRange === 'allTime' || isNaN(value)) return null;
      const isPositive = value >= 0;
      return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} ml-2`}><TrendIndicatorIcon isPositive={isPositive} />{Math.abs(value).toFixed(1)}%</span>;
  };
  const TrendIndicatorIcon = ({ isPositive }: { isPositive: boolean }) => isPositive ? <ArrowTrendingUpIcon className="w-3 h-3 mr-1" /> : <ArrowTrendingDownIcon className="w-3 h-3 mr-1" />;

  return (
    <div className="space-y-8 animate-fade-in-up pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Фінансова аналітика</h1>
            <p className="text-slate-500">Доходи, зарплати та прибутковість</p>
          </div>
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm inline-flex overflow-x-auto">
              {(['thisMonth', 'lastMonth', 'thisYear', 'allTime'] as TimeRange[]).map(range => (
                  <button key={range} onClick={() => setTimeRange(range)} className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-all ${timeRange === range ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                      {range === 'thisMonth' ? 'Місяць' : range === 'lastMonth' ? 'Минулий' : range === 'thisYear' ? 'Рік' : 'Ввесь час'}
                  </button>
              ))}
          </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-blue-100 text-blue-600"><CurrencyDollarIcon className="w-6 h-6" /></div>
                <TrendIndicator value={metrics.revenueTrend} />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Загальна виручка</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{metrics.totalRevenue.toLocaleString('uk-UA')} грн</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-600"><BanknotesIcon className="w-6 h-6" /></div>
                <TrendIndicator value={metrics.profitTrend} />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Чистий прибуток</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{metrics.netProfit.toLocaleString('uk-UA')} грн</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-rose-100 text-rose-600"><BriefcaseIcon className="w-6 h-6" /></div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Витрати на ЗП</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{metrics.totalSalaries.toLocaleString('uk-UA')} грн</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20">
            <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-2xl bg-orange-100 text-orange-600"><WrenchScrewdriverIcon className="w-6 h-6" /></div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">Виконано нарядів</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{metrics.count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20 min-h-[400px]">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Динаміка доходів</h2>
            <div className="h-80 w-full">
                {metrics.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                            <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Bar dataKey="services" name="Роботи" stackId="a" fill="#4f46e5" radius={[0, 0, 4, 4]} barSize={32} />
                            <Bar dataKey="parts" name="Запчастини" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-slate-400">Немає даних за період</div>}
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/20 min-h-[400px] flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Розподіл фінансів</h2>
            <div className="flex-1 flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
                <div className="flex justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-sm font-bold text-emerald-700">
                    <span>Рентабельність:</span>
                    <span>{metrics.totalRevenue > 0 ? ((metrics.netProfit / metrics.totalRevenue) * 100).toFixed(1) : 0}%</span>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
