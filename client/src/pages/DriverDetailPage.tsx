/**
 * Driver Detail Page
 * Chức năng: Hiển thị hồ sơ chi tiết, giấy tờ pháp lý và lịch sử nộp tiền COD của tài xế.
 * Các thành phần chính: Thông tin cá nhân & phương tiện, Ảnh CCCD/Bằng lái (Base64), Thống kê hiệu suất, Lịch sử đối soát COD.
 */
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { driversApi, codApi } from '../api/services';

export default function DriverDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data } = useQuery({
        queryKey: ['driver', id],
        queryFn: () => driversApi.getById(id!),
        enabled: !!id,
    });

    const { data: settlementsData } = useQuery({
        queryKey: ['driverSettlements', id],
        queryFn: () => codApi.settlements({ driverId: id }),
        enabled: !!id,
    });

    const driver = data?.data;
    const settlements = settlementsData?.data?.settlements || [];

    const STATUS_LABELS: Record<string, string> = {
        pending: 'Chờ duyệt',
        approved: 'Đã duyệt',
        rejected: 'Từ chối',
    };

    if (!driver) return <div className="text-gray-500">Đang tải...</div>;

    const STATUS_COLORS: Record<string, string> = {
        pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };

    return (
        <div>
            <button onClick={() => navigate('/drivers')} className="text-gray-400 hover:text-gray-200 text-sm mb-6 flex items-center gap-1">
                ← Quay lại danh sách tài xế
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile */}
                <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-bold mx-auto mb-3">
                            {driver.name?.charAt(0)}
                        </div>
                        <h2 className="text-xl font-bold">{driver.name}</h2>
                        <p className="text-gray-400 text-sm">{driver.phone}</p>
                        <div className="flex justify-center gap-2 mt-3">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${STATUS_COLORS[driver.status]}`}>
                                {STATUS_LABELS[driver.status] || driver.status}
                            </span>
                            {driver.locked && <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">🔒 Đã khóa</span>}
                            {driver.online && <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">🟢 Trực tuyến</span>}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Biển số xe</span>
                            <span className="font-mono">{driver.vehiclePlate}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Đánh giá</span>
                            <span>⭐ {driver.ratingAvg?.toFixed(1)} ({driver.totalRatings})</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tổng thu nhập</span>
                            <span className="text-emerald-400 font-medium">{driver.totalIncome?.toLocaleString()}đ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Đơn hoàn thành</span>
                            <span className="text-blue-400 font-medium">{driver.completedOrders || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Tiền COD đang giữ</span>
                            <span className="text-yellow-400 font-medium">{driver.codHolding?.toLocaleString()}đ</span>
                        </div>
                    </div>
                </div>

                {/* Documents & COD */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Documents */}
                    <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Giấy tờ</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-2">CCCD / CMND</p>
                                {driver.documents?.idCardUrl ? (
                                    <img src={`data:image/jpeg;base64,${driver.documents.idCardUrl}`} alt="ID Card" className="w-full h-40 object-cover rounded-xl border border-gray-700" />
                                ) : (
                                    <div className="w-full h-40 rounded-xl border border-gray-700 bg-gray-800 flex items-center justify-center text-gray-500">Chưa có ảnh</div>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase mb-2">Bằng lái xe</p>
                                {driver.documents?.licenseUrl ? (
                                    <img src={`data:image/jpeg;base64,${driver.documents.licenseUrl}`} alt="License" className="w-full h-40 object-cover rounded-xl border border-gray-700" />
                                ) : (
                                    <div className="w-full h-40 rounded-xl border border-gray-700 bg-gray-800 flex items-center justify-center text-gray-500">Chưa có ảnh</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* COD History */}
                    <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Lịch sử đối soát COD</h3>
                        {settlements.length === 0 ? (
                            <p className="text-gray-500 text-sm">Chưa có dữ liệu đối soát</p>
                        ) : (
                            <div className="space-y-3">
                                {settlements.map((s: any) => (
                                    <div key={s._id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl">
                                        <div>
                                            <p className="text-sm font-medium">{s.amount?.toLocaleString()}đ</p>
                                            <p className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleString()} • {s.method === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
                                        </div>
                                        {s.note && <p className="text-xs text-gray-400">{s.note}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
