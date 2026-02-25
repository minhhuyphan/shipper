import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { statsApi } from '../api/services';

const RANGE_OPTIONS = [
    { label: '7 Days', days: 7 },
    { label: '30 Days', days: 30 },
    { label: '90 Days', days: 90 },
];

export default function DashboardPage() {
    const [range, setRange] = useState(30);
    const from = new Date(Date.now() - range * 24 * 60 * 60 * 1000).toISOString();
    const to = new Date().toISOString();

    const { data: revenueData } = useQuery({
        queryKey: ['revenue', range],
        queryFn: () => statsApi.revenue({ from, to, groupBy: 'day' }),
        refetchInterval: 30000,
    });

    const { data: summaryData } = useQuery({
        queryKey: ['ordersSummary'],
        queryFn: () => statsApi.ordersSummary(),
        refetchInterval: 30000,
    });

    const { data: onlineDrivers } = useQuery({
        queryKey: ['driversOnline'],
        queryFn: () => statsApi.driversOnline(),
        refetchInterval: 30000,
    });

    const summary = summaryData?.data || { running: 0, completed: 0, cancelled: 0, total: 0 };
    const revenue = revenueData?.data || [];
    const drivers = onlineDrivers?.data || [];

    const cards = [
        { label: 'Running Orders', value: summary.running, color: 'from-blue-600 to-blue-400', icon: '🔄' },
        { label: 'Completed', value: summary.completed, color: 'from-emerald-600 to-emerald-400', icon: '✅' },
        { label: 'Cancelled', value: summary.cancelled, color: 'from-red-600 to-red-400', icon: '❌' },
        { label: 'Online Drivers', value: drivers.length, color: 'from-purple-600 to-purple-400', icon: '🚗' },
    ];

    const revenueChartOption = {
        tooltip: { trigger: 'axis' as const, backgroundColor: '#1f2937', borderColor: '#374151', textStyle: { color: '#e5e7eb' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category' as const, data: revenue.map((r: any) => r.date), axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#9ca3af' } },
        yAxis: { type: 'value' as const, axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#9ca3af', formatter: (v: number) => `${(v / 1000).toFixed(0)}K` }, splitLine: { lineStyle: { color: '#1f2937' } } },
        series: [{
            name: 'Revenue',
            type: 'bar',
            data: revenue.map((r: any) => r.revenue),
            itemStyle: { borderRadius: [6, 6, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#1d4ed8' }] } },
        }],
    };

    const ordersChartOption = {
        tooltip: { trigger: 'axis' as const, backgroundColor: '#1f2937', borderColor: '#374151', textStyle: { color: '#e5e7eb' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: { type: 'category' as const, data: revenue.map((r: any) => r.date), axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#9ca3af' } },
        yAxis: { type: 'value' as const, axisLine: { lineStyle: { color: '#374151' } }, axisLabel: { color: '#9ca3af' }, splitLine: { lineStyle: { color: '#1f2937' } } },
        series: [{
            name: 'Orders',
            type: 'line',
            smooth: true,
            data: revenue.map((r: any) => r.count),
            lineStyle: { width: 3, color: '#a855f7' },
            areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(168,85,247,0.3)' }, { offset: 1, color: 'rgba(168,85,247,0.02)' }] } },
            itemStyle: { color: '#a855f7' },
        }],
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">Overview of your delivery platform</p>
                </div>
                <div className="flex gap-2">
                    {RANGE_OPTIONS.map((opt) => (
                        <button
                            key={opt.days}
                            onClick={() => setRange(opt.days)}
                            className={`px-4 py-2 text-sm rounded-xl transition-all ${range === opt.days
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                    : 'text-gray-400 hover:text-gray-200 bg-gray-800/50 border border-gray-700'
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                {cards.map((card) => (
                    <div key={card.label} className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-2xl">{card.icon}</span>
                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${card.color}`} />
                        </div>
                        <p className="text-3xl font-bold">{card.value}</p>
                        <p className="text-gray-500 text-sm mt-1">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Revenue by Day</h3>
                    <ReactECharts option={revenueChartOption} style={{ height: 320 }} />
                </div>
                <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Orders by Day</h3>
                    <ReactECharts option={ordersChartOption} style={{ height: 320 }} />
                </div>
            </div>

            {/* Online Drivers */}
            <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">Online Drivers ({drivers.length})</h3>
                {drivers.length === 0 ? (
                    <p className="text-gray-500 text-sm">No drivers currently online</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {drivers.map((driver: any) => (
                            <div key={driver._id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-sm font-bold">
                                    {driver.name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{driver.name}</p>
                                    <p className="text-xs text-gray-500">{driver.phone} • {driver.vehiclePlate}</p>
                                </div>
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
