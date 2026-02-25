import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { driversApi } from '../api/services';

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
};

export default function DriversPage() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['drivers', page, status, search],
        queryFn: () => driversApi.list({
            page, limit: 15,
            ...(status !== 'all' && { status }),
            ...(search && { search }),
        }),
    });

    const approveMutation = useMutation({
        mutationFn: ({ id, action }: { id: string; action: string }) => driversApi.approve(id, action),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
    });

    const lockMutation = useMutation({
        mutationFn: (id: string) => driversApi.toggleLock(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
    });

    const drivers = data?.data?.drivers || [];
    const pagination = data?.data?.pagination || { page: 1, pages: 1, total: 0 };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Driver Management</h1>
                    <p className="text-gray-500 text-sm mt-1">{pagination.total} total drivers</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <input
                    type="text" placeholder="Search by name, phone, plate..."
                    value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 text-sm focus:outline-none focus:border-blue-500 w-72"
                />
                {['all', 'pending', 'approved', 'rejected'].map((s) => (
                    <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                        className={`px-3 py-2 text-xs rounded-lg capitalize transition-all ${status === s ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 bg-gray-800/50 border border-gray-700 hover:text-gray-200'}`}>
                        {s}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800">
                                {['Driver', 'Phone', 'Plate', 'Status', 'Rating', 'Online', 'COD Holding', 'Actions'].map((h) => (
                                    <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
                            ) : drivers.map((driver: any) => (
                                <tr key={driver._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/drivers/${driver._id}`)}>
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold">
                                                {driver.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium hover:text-blue-400 transition-colors">{driver.name}</p>
                                                {driver.locked && <span className="text-xs text-red-400">🔒 Locked</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-300">{driver.phone}</td>
                                    <td className="px-6 py-4 text-sm font-mono text-gray-300">{driver.vehiclePlate}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${STATUS_COLORS[driver.status]}`}>{driver.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        ⭐ {driver.ratingAvg?.toFixed(1)} <span className="text-gray-500">({driver.totalRatings})</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {driver.online ? <span className="flex items-center gap-1 text-xs text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />Online</span> : <span className="text-xs text-gray-500">Offline</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-yellow-400">{driver.codHolding?.toLocaleString()}đ</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            {driver.status === 'pending' && (
                                                <>
                                                    <button onClick={(e) => { e.stopPropagation(); approveMutation.mutate({ id: driver._id, action: 'approved' }); }}
                                                        className="px-2.5 py-1 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs hover:bg-emerald-600/30 transition-all">
                                                        Approve
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); approveMutation.mutate({ id: driver._id, action: 'rejected' }); }}
                                                        className="px-2.5 py-1 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs hover:bg-red-600/30 transition-all">
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={(e) => { e.stopPropagation(); lockMutation.mutate(driver._id); }}
                                                className="px-2.5 py-1 bg-gray-700/50 text-gray-300 border border-gray-600 rounded-lg text-xs hover:bg-gray-700 transition-all">
                                                {driver.locked ? '🔓 Unlock' : '🔒 Lock'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
                    <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.pages}</p>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-30 hover:bg-gray-700 transition-all">Previous</button>
                        <button onClick={() => setPage(Math.min(pagination.pages, page + 1))} disabled={page >= pagination.pages}
                            className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-30 hover:bg-gray-700 transition-all">Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
