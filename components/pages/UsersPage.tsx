
import React, { useState, useEffect } from 'react';
import { db, secondaryAuth } from '../../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '../../types';
import { PlusIcon, TrashIcon, UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import ConfirmActionModal from './ConfirmDeleteModal';
import { useAuth } from '../../context/AuthContext';

const UsersPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Delete state
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

    // Form state
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState<UserRole>(UserRole.Manager);
    const [creating, setCreating] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const fetchedUsers: UserProfile[] = [];
            querySnapshot.forEach((doc) => {
                fetchedUsers.push(doc.data() as UserProfile);
            });
            setUsers(fetchedUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            // 1. Create user in Firebase Auth using secondary app (to avoid logging out admin)
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
            const user = userCredential.user;

            if (user) {
                // 2. Create user document in Firestore 'users' collection
                const newUser: UserProfile = {
                    uid: user.uid,
                    email: newEmail,
                    displayName: newName,
                    role: newRole,
                    createdAt: new Date().toISOString()
                };

                await setDoc(doc(db, 'users', user.uid), newUser);
                
                alert(`Користувача ${newName} успішно створено.`);
                setIsModalOpen(false);
                setNewEmail('');
                setNewPassword('');
                setNewName('');
                fetchUsers();
            }

        } catch (error: any) {
            console.error("Error creating user:", error);
            alert(`Помилка створення користувача: ${error.message}`);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteClick = (user: UserProfile) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            try {
                await deleteDoc(doc(db, 'users', userToDelete.uid));
                setUsers(prev => prev.filter(u => u.uid !== userToDelete.uid));
            } catch (error) {
                console.error("Error deleting user:", error);
                alert("Не вдалося видалити користувача.");
            }
        }
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    return (
        <div className="animate-fade-in">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Додати користувача">
                <form onSubmit={handleCreateUser} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                        <input 
                            type="email" 
                            required 
                            value={newEmail} 
                            onChange={e => setNewEmail(e.target.value)} 
                            className="input w-full"
                            placeholder="user@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Пароль (мін. 6 символів)</label>
                        <input 
                            type="password" 
                            required 
                            minLength={6}
                            value={newPassword} 
                            onChange={e => setNewPassword(e.target.value)} 
                            className="input w-full"
                            placeholder="******"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Ім'я</label>
                        <input 
                            type="text" 
                            required 
                            value={newName} 
                            onChange={e => setNewName(e.target.value)} 
                            className="input w-full"
                            placeholder="Іван Іванов"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Роль</label>
                        <select 
                            value={newRole} 
                            onChange={e => setNewRole(e.target.value as UserRole)}
                            className="input w-full"
                        >
                            <option value={UserRole.Manager}>Менеджер</option>
                            <option value={UserRole.Administrator}>Адміністратор</option>
                        </select>
                    </div>
                    <div className="flex justify-end pt-5">
                        <button 
                            type="submit" 
                            disabled={creating}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 font-bold transition-all"
                        >
                            {creating ? 'Створення...' : 'Створити'}
                        </button>
                    </div>
                </form>
                <style>{`
                    .input {
                        display: block; width: 100%; padding: 0.625rem 0.875rem; background-color: #ffffff;
                        border: 1px solid #e2e8f0; border-radius: 0.75rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                        color: #1e293b; transition: all 0.2s;
                    }
                    .input::placeholder { color: #94a3b8; }
                    .input:focus {
                        outline: none; --tw-ring-color: #3b82f6;
                        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); border-color: #3b82f6;
                    }
                `}</style>
            </Modal>

            <ConfirmActionModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Видалити користувача"
                message={`Ви впевнені, що хочете видалити користувача ${userToDelete?.displayName}? Він втратить доступ до системи.`}
                variant="danger"
                confirmButtonText="Видалити"
            />

            <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold text-slate-800">Список користувачів</h2>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 flex items-center text-sm font-bold transition-transform hover:-translate-y-0.5"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Додати користувача
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="min-w-full leading-normal">
                    <thead>
                        <tr className="bg-slate-50 text-left text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-200">
                            <th className="px-6 py-4">Ім'я</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Роль</th>
                            <th className="px-6 py-4">Дата створення</th>
                            <th className="px-6 py-4 text-center">Дії</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700 text-sm divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={5} className="text-center py-6 text-slate-400">Завантаження...</td></tr>
                        ) : users.length > 0 ? (
                            users.map(user => (
                                <tr key={user.uid} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4 flex items-center font-medium">
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg mr-3">
                                            <UserIcon className="w-4 h-4" />
                                        </div>
                                        {user.displayName}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${user.role === UserRole.Administrator ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        {new Date(user.createdAt).toLocaleDateString('uk-UA')}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user.uid !== currentUser?.uid ? (
                                            <button 
                                                onClick={() => handleDeleteClick(user)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Видалити користувача"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        ) : (
                                            <span className="text-xs text-slate-300 italic">Це ви</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={5} className="text-center py-6 text-slate-500">Користувачів не знайдено (крім головного адміністратора).</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
             <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="flex items-start">
                     <ShieldCheckIcon className="w-6 h-6 text-blue-600 mr-3 mt-0.5" />
                     <div>
                         <h4 className="font-bold text-slate-800 text-sm">Примітка адміністратора</h4>
                         <p className="text-sm text-slate-500 mt-1">Видалення користувача забирає у нього доступ до системи, але не видаляє обліковий запис Google Authentication. Для повного видалення зверніться до консолі Firebase.</p>
                     </div>
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default UsersPage;
