import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { codApi } from '../api/services';

export default function CODPage() {
    const queryClient = useQueryClient();
    const [settleForm, setSettleForm] = useState({ driverId: '', amount: 0, method: 'cash' as 'cash' | 'bank', note: '' });
    const [page, setPage] = useState(1);

    const { data: summaryData } = useQuery({ queryKey: ['codSummary'], queryFn: codApi.summary });
    const { data: settlementsData } = useQuery({
        queryKey: ['codSettlements', page],
        queryFn: () => codApi.settlements({ page, limit: 15 }),
    });

    const settleMutation = useMutation({
        mutationFn: (data: any) => codApi.settle(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['codSummary'] });
            queryClient.invalidateQueries({ queryKey: ['codSettlements'] });
            setSettleForm({ driverId: '', amount: 0, method: 'cash', note: '' });
        },
    });

    const handleExport = async () => {
        const res = await codApi.exportCsv();
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cod-settlements.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const summary = summaryData?.data || { drivers: [], totalHolding: 0 };
    const settlements = settlementsData?.data?.settlements || [];
    const pagination = settlementsData?.data?.pagination || { page: 1, pages: 1 };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Đối soát COD</h1>
                    <p className="text-gray-500 text-sm mt-1">Tổng tiền đang giữ: <span className="text-yellow-400 font-medium">{summary.totalHolding?.toLocaleString()}đ</span></p>
                </div>
                <button onClick={handleExport}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2">
                    📥 Xuất CSV
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Driver COD Holdings */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Tiền COD tài xế đang giữ</h3>
                        {summary.drivers.length === 0 ? (
                            <p className="text-gray-500 text-sm">Không có tài xế nào đang giữ tiền COD</p>
                        ) : (
                            <div className="space-y-3">
                                {summary.drivers.map((driver: any) => (
                                    <div key={driver._id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-sm font-bold">
                                                {driver.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{driver.name}</p>
                                                <p className="text-xs text-gray-500">{driver.phone} • {driver.vehiclePlate}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-yellow-400">{driver.codHolding?.toLocaleString()}đ</p>
                                            <button
                                                onClick={() => setSettleForm({ ...settleForm, driverId: driver._id, amount: driver.codHolding })}
                                                className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                                            >
                                                Đối soát →
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Settlement History */}
                    <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Lịch sử đối soát</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-800">
                                        {['Ngày', 'Tài xế', 'Số tiền', 'Phương thức', 'Ghi chú', 'Người duyệt'].map((h) => (
                                            <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {settlements.map((s: any) => (
                                        <tr key={s._id} className="border-b border-gray-800/50">
                                            <td className="px-4 py-3 text-sm text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 text-sm">{s.driver?.name}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-emerald-400">{s.amount?.toLocaleString()}đ</td>
                                            <td className="px-4 py-3 text-sm text-gray-300 capitalize">{s.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-400">{s.note || '—'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-400">{s.createdBy?.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-gray-500">Trang {pagination.page} / {pagination.pages}</p>
                            <div className="flex gap-2">
                                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                                    className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-30">Trước</button>
                                <button onClick={() => setPage(Math.min(pagination.pages, page + 1))} disabled={page >= pagination.pages}
                                    className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-30">Sau</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settle Form */}
                <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6 h-fit">
                    <h3 className="text-lg font-semibold mb-4">Đối soát COD</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Mã tài xế</label>
                            <input type="text" value={settleForm.driverId} onChange={(e) => setSettleForm({ ...settleForm, driverId: e.target.value })}
                                placeholder="Chọn từ danh sách hoặc dán ID"
                                className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Số tiền (đ)</label>
                            <input type="number" value={settleForm.amount} onChange={(e) => setSettleForm({ ...settleForm, amount: +e.target.value })}
                                className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Phương thức</label>
                            <select value={settleForm.method} onChange={(e) => setSettleForm({ ...settleForm, method: e.target.value as any })}
                                className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500">
                                <option value="cash">Tiền mặt</option>
                                <option value="bank">Chuyển khoản</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase">Ghi chú</label>
                            <textarea value={settleForm.note} onChange={(e) => setSettleForm({ ...settleForm, note: e.target.value })}
                                placeholder="Ghi chú thêm..."
                                className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500 resize-none" rows={3} />
                        </div>
                        <button
                            onClick={() => settleMutation.mutate(settleForm)}
                            disabled={!settleForm.driverId || settleForm.amount <= 0}
                            className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                        >
                            Xác nhận đối soát
                        </button>
                        {settleMutation.isError && (
                            <p className="text-red-400 text-xs">{(settleMutation.error as any)?.response?.data?.error || 'Thất bại'}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
