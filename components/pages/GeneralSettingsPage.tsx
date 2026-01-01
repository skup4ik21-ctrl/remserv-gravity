
import React, { useState, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useCompanySettings } from '../../hooks/useCompanySettings';

const GeneralSettingsPage: React.FC = () => {
    const { settings: companySettings, updateCompanySettings, loading: settingsLoading } = useCompanySettings();

    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [fopData, setFopData] = useState('');
    const [paymentInfo, setPaymentInfo] = useState('');
    const [telegramBotToken, setTelegramBotToken] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (companySettings) {
            setName(companySettings.name || '');
            setAddress(companySettings.address || '');
            setPhone(companySettings.phone || '');
            setFopData(companySettings.fopData || '');
            setPaymentInfo(companySettings.paymentInfo || '');
            setTelegramBotToken(companySettings.telegramBotToken || '');
        }
    }, [companySettings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await updateCompanySettings({ name, address, phone, fopData, paymentInfo, telegramBotToken });
            alert('Налаштування збережено.');
        } catch (error) {
            alert('Помилка збереження.');
        } finally {
            setLoading(false);
        }
    };

    if (settingsLoading) return <div className="p-10 text-center text-slate-500 font-bold">Завантаження налаштувань...</div>;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-8 pb-20">
            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Налаштування компанії</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Назва СТО</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Телефон</label>
                            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>

                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <h3 className="text-md font-bold text-indigo-900 mb-3 flex items-center">
                            <PaperAirplaneIcon className="w-5 h-5 mr-2 text-indigo-600" /> Telegram Інтеграція
                        </h3>
                        <label className="block text-sm font-bold text-indigo-700 mb-2">Bot Token (від @BotFather)</label>
                        <input type="text" value={telegramBotToken} onChange={e => setTelegramBotToken(e.target.value)} className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="123456:ABCDE..." />
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50">
                            {loading ? 'Збереження...' : 'Зберегти основне'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default GeneralSettingsPage;
