import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { pricingApi } from '../api/services';

export default function PricingPage() {
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [simInput, setSimInput] = useState({
        distanceKm: 10,
        serviceType: 'economy' as 'express' | 'economy',
        isBulky: false,
        codAmount: 500000,
        timestamp: new Date().toISOString(),
    });
    const [simResult, setSimResult] = useState<any>(null);

    const { data: configs } = useQuery({ queryKey: ['pricing'], queryFn: pricingApi.list });
    const { data: activeConfig } = useQuery({ queryKey: ['pricingActive'], queryFn: pricingApi.getActive });

    const activateMutation = useMutation({
        mutationFn: (id: string) => pricingApi.activate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricing'] });
            queryClient.invalidateQueries({ queryKey: ['pricingActive'] });
        },
    });

    const simulateMutation = useMutation({
        mutationFn: (data: any) => pricingApi.simulate(data),
        onSuccess: (res) => setSimResult(res.data),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => pricingApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pricing'] });
            setShowCreate(false);
        },
    });

    const [form, setForm] = useState({
        baseFare: 18000, baseDistanceKm: 3, pricePerKm: 4500,
        peakHourSurcharge: { startHour: 17, endHour: 19, fee: 15000 },
        bulkyItemSurcharge: 25000,
        codFee: { type: 'percentage' as 'fixed' | 'percentage', value: 1.5 },
        services: { express: { enabled: true, multiplier: 1.8 }, economy: { enabled: true, multiplier: 1.0 } },
    });

    const active = activeConfig?.data;
    const allConfigs = configs?.data || [];

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Cấu hình giá</h1>
                    <p className="text-gray-500 text-sm mt-1">Thiết lập giá cước giao hàng</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all"
                >
                    {showCreate ? 'Hủy' : '+ Cấu hình mới'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Config / Create Form */}
                <div className="lg:col-span-2 space-y-6">
                    {showCreate ? (
                        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold mb-4">Cấu hình giá mới</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Giá cước cơ bản (đ)</label>
                                    <input type="number" value={form.baseFare} onChange={(e) => setForm({ ...form, baseFare: +e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Khoảng cách cơ bản (km)</label>
                                    <input type="number" value={form.baseDistanceKm} onChange={(e) => setForm({ ...form, baseDistanceKm: +e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Giá mỗi km tiếp theo (đ)</label>
                                    <input type="number" value={form.pricePerKm} onChange={(e) => setForm({ ...form, pricePerKm: +e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Phí hàng cồng kềnh (đ)</label>
                                    <input type="number" value={form.bulkyItemSurcharge} onChange={(e) => setForm({ ...form, bulkyItemSurcharge: +e.target.value })}
                                        className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Bắt đầu giờ cao điểm</label>
                                    <input type="number" value={form.peakHourSurcharge.startHour} onChange={(e) => setForm({ ...form, peakHourSurcharge: { ...form.peakHourSurcharge, startHour: +e.target.value } })}
                                        className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Kết thúc giờ cao điểm</label>
                                    <input type="number" value={form.peakHourSurcharge.endHour} onChange={(e) => setForm({ ...form, peakHourSurcharge: { ...form.peakHourSurcharge, endHour: +e.target.value } })}
                                        className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Phí cao điểm (đ)</label>
                                    <input type="number" value={form.peakHourSurcharge.fee} onChange={(e) => setForm({ ...form, peakHourSurcharge: { ...form.peakHourSurcharge, fee: +e.target.value } })}
                                        className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Loại phí thu hộ</label>
                                    <select value={form.codFee.type} onChange={(e) => setForm({ ...form, codFee: { ...form.codFee, type: e.target.value as any } })}
                                        className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500">
                                        <option value="fixed">Cố định</option>
                                        <option value="percentage">Phần trăm</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Giá trị phí thu hộ</label>
                                    <input type="number" step="0.1" value={form.codFee.value} onChange={(e) => setForm({ ...form, codFee: { ...form.codFee, value: +e.target.value } })}
                                        className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase">Hệ số hỏa tốc</label>
                                    <input type="number" step="0.1" value={form.services.express.multiplier} onChange={(e) => setForm({ ...form, services: { ...form.services, express: { ...form.services.express, multiplier: +e.target.value } } })}
                                        className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                                </div>
                            </div>
                            <button
                                onClick={() => createMutation.mutate(form)}
                                className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all"
                            >
                                Tạo cấu hình
                            </button>
                        </div>
                    ) : active ? (
                        <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Cấu hình đang sử dụng (v{active.version})</h3>
                                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium">Đang dùng</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {[
                                    ['Giá cước cơ bản', `${active.baseFare?.toLocaleString()}đ`],
                                    ['Khoảng cách cơ bản', `${active.baseDistanceKm} km`],
                                    ['Giá/km', `${active.pricePerKm?.toLocaleString()}đ`],
                                    ['Giờ cao điểm', `${active.peakHourSurcharge?.startHour}:00 - ${active.peakHourSurcharge?.endHour}:00`],
                                    ['Phí cao điểm', `${active.peakHourSurcharge?.fee?.toLocaleString()}đ`],
                                    ['Phí cồng kềnh', `${active.bulkyItemSurcharge?.toLocaleString()}đ`],
                                    ['Phí thu hộ', `${active.codFee?.value}${active.codFee?.type === 'percentage' ? '%' : 'đ'}`],
                                    ['Hỏa tốc', `${active.services?.express?.enabled ? '✅' : '❌'} ×${active.services?.express?.multiplier}`],
                                    ['Tiết kiệm', `${active.services?.economy?.enabled ? '✅' : '❌'} ×${active.services?.economy?.multiplier}`],
                                ].map(([label, value]) => (
                                    <div key={label as string} className="p-3 bg-gray-800/50 rounded-xl">
                                        <p className="text-xs text-gray-500 uppercase">{label}</p>
                                        <p className="text-sm font-medium mt-1">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {/* All configs */}
                    <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Tất cả phiên bản</h3>
                        <div className="space-y-3">
                            {allConfigs.map((cfg: any) => (
                                <div key={cfg._id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                                    <div>
                                        <p className="text-sm font-medium">Phiên bản {cfg.version}</p>
                                        <p className="text-xs text-gray-500"><span className="text-gray-400">Giá cước cơ bản</span>: {cfg.baseFare?.toLocaleString()}đ | Theo km: {cfg.pricePerKm?.toLocaleString()}đ</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {cfg.active ? (
                                            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs">Đang dùng</span>
                                        ) : (
                                            <button
                                                onClick={() => activateMutation.mutate(cfg._id)}
                                                className="px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs hover:bg-blue-600/30 transition-all"
                                            >
                                                Kích hoạt
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Simulation */}
                <div className="space-y-6">
                    <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Giả lập tính giá</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Khoảng cách (km)</label>
                                <input type="number" value={simInput.distanceKm} onChange={(e) => setSimInput({ ...simInput, distanceKm: +e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Dịch vụ</label>
                                <select value={simInput.serviceType} onChange={(e) => setSimInput({ ...simInput, serviceType: e.target.value as any })}
                                    className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500">
                                    <option value="economy">Tiết kiệm</option>
                                    <option value="express">Hỏa tốc</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={simInput.isBulky} onChange={(e) => setSimInput({ ...simInput, isBulky: e.target.checked })}
                                    className="rounded border-gray-700" />
                                <label className="text-sm text-gray-400">Hàng cồng kềnh</label>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Tiền thu hộ (đ)</label>
                                <input type="number" value={simInput.codAmount} onChange={(e) => setSimInput({ ...simInput, codAmount: +e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase">Thời gian</label>
                                <input type="datetime-local" value={simInput.timestamp.slice(0, 16)} onChange={(e) => setSimInput({ ...simInput, timestamp: new Date(e.target.value).toISOString() })}
                                    className="w-full mt-1 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                            </div>
                            <button
                                onClick={() => simulateMutation.mutate(simInput)}
                                className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-medium rounded-xl transition-all"
                            >
                                Tính toán
                            </button>
                        </div>

                        {simResult && (
                            <div className="mt-4 p-4 bg-gray-800/50 rounded-xl">
                                <p className="text-xs text-gray-500 uppercase mb-2">Chi tiết (v{simResult.configVersion})</p>
                                <div className="space-y-1.5">
                                    {Object.entries(simResult.breakdown).map(([key, value]) => {
                                        const labels: Record<string, string> = {
                                            baseFare: 'Giá cước cơ bản',
                                            distanceCharge: 'Cước phí quãng đường',
                                            peakHourSurcharge: 'Phí giờ cao điểm',
                                            bulkyItemSurcharge: 'Phí hàng cồng kềnh',
                                            codFee: 'Phí thu hộ (COD)',
                                            serviceMultiplier: 'Hệ số dịch vụ',
                                            total: 'Tổng cộng ước tính'
                                        };
                                        return (
                                            <div key={key} className={`flex justify-between text-sm ${key === 'total' ? 'font-bold text-blue-400 border-t border-gray-800 pt-2' : 'text-gray-300'}`}>
                                                <span>{labels[key] || key}</span>
                                                <span>{typeof value === 'number' ? value.toLocaleString() : String(value)}{key !== 'serviceMultiplier' ? 'đ' : '×'}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
