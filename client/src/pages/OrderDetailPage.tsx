import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ordersApi } from "../api/services";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  assigned: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  picking_up: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  delivering: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const EVENT_ICONS: Record<string, string> = {
  order_created: "📝",
  driver_assigned: "🚗",
  driver_picking_up: "📍",
  picked_up: "📦",
  delivered: "✅",
  cancelled: "❌",
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [complaintNote, setComplaintNote] = useState("");
  const [complaintStatus, setComplaintStatus] = useState("open");

  // Helper to determine if ID is MongoDB ObjectId (24 hex chars) or order code
  const isMongoId = (str: string) => /^[0-9a-fA-F]{24}$/.test(str);

  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => {
      if (!id) return Promise.reject("No ID provided");
      // If it's a MongoDB ID, fetch by ID; otherwise fetch by order code
      return isMongoId(id)
        ? ordersApi.getById(id)
        : ordersApi.getByOrderCode(id);
    },
    enabled: !!id,
  });

  const { data: auditData } = useQuery({
    queryKey: ["orderAudit", id],
    queryFn: () => {
      if (!id) return Promise.reject("No ID provided");
      // For audit logs, we need the MongoDB ID, not the order code
      // If it's not a MongoDB ID, we can't fetch audit logs
      return isMongoId(id)
        ? ordersApi.getAudit(id)
        : Promise.reject("Audit logs require MongoDB ID");
    },
    enabled: !!id && isMongoId(id),
  });

  // IMPORTANT: Declare all hooks BEFORE any early returns
  // useMutation must always be called in the same order
  const complaintMutation = useMutation({
    mutationFn: (complaintData: any) => {
      // Access order from the useQuery data
      const currentOrder = data?.data;
      if (!currentOrder || !currentOrder._id) {
        return Promise.reject("Order not loaded");
      }
      return ordersApi.updateComplaint(currentOrder._id, complaintData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      setComplaintNote("");
      setComplaintStatus("open");
    },
  });

  // NOW we can do early returns
  const STATUS_LABELS: Record<string, string> = {
    pending: "Chờ xử lý",
    assigned: "Đã phân công",
    picking_up: "Đang lấy hàng",
    delivering: "Đang giao",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };

  const COMPLAINT_LABELS: Record<string, string> = {
    open: "Mới",
    in_progress: "Đang xử lý",
    resolved: "Đã giải quyết",
    rejected: "Từ chối",
  };

  // NOW we can do early returns
  if (isLoading) return <div className="text-gray-500">Đang tải...</div>;
  const order = data?.data;
  if (!order) return <div className="text-gray-500">Không tìm thấy đơn hàng</div>;
  const auditLogs = auditData?.data || [];

  return (
    <div>
      <button
        onClick={() => navigate("/orders")}
        className="text-gray-400 hover:text-gray-200 text-sm mb-6 flex items-center gap-1"
      >
        ← Quay lại danh sách đơn hàng
      </button>

      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold font-mono">{order.orderCode}</h1>
        <span
          className={`px-3 py-1 rounded-lg text-sm font-medium border ${STATUS_COLORS[order.status]}`}
        >
          {STATUS_LABELS[order.status] || order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Delivery */}
          <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Thông tin giao hàng</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Khách hàng</p>
                <p className="text-sm font-medium">{order.customer?.name}</p>
                <p className="text-sm text-gray-400">{order.customer?.phone}</p>
                <p className="text-sm text-gray-500">
                  {order.customer?.address}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Tài xế</p>
                <p className="text-sm font-medium">
                  {order.driver?.name || order.driverName || "Chưa phân công"}
                </p>
                <p className="text-sm text-gray-400">
                  {order.driver?.phone || order.driverPhone || ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Điểm lấy hàng</p>
                <p className="text-sm text-gray-300">{order.pickupAddress}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Điểm giao hàng</p>
                <p className="text-sm text-gray-300">{order.deliveryAddress}</p>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Chi tiết giá</h3>
            <div className="space-y-2">
              {[
                ["Giá cước cơ bản", order.pricingBreakdown?.baseFare],
                ["Cước phí quãng đường", order.pricingBreakdown?.distanceCharge],
                [
                  "Phí giờ cao điểm",
                  order.pricingBreakdown?.peakHourSurcharge,
                ],
                [
                  "Phí hàng cồng kềnh",
                  order.pricingBreakdown?.bulkyItemSurcharge,
                ],
                ["Phí thu hộ", order.pricingBreakdown?.codFee],
              ].map(([label, value]) => (
                <div
                  key={label as string}
                  className="flex justify-between text-sm"
                >
                  <span className="text-gray-400">{label}</span>
                  <span>{(value as number)?.toLocaleString()}đ</span>
                </div>
              ))}
              <div className="border-t border-gray-700 pt-2 flex justify-between text-sm font-semibold">
                <span>Tổng cộng</span>
                <span className="text-blue-400">
                  {order.pricingBreakdown?.total?.toLocaleString()}đ
                </span>
              </div>
              {order.codAmount > 0 && (
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-400">Tiền thu hộ (COD)</span>
                  <span className="text-yellow-400">
                    {order.codAmount?.toLocaleString()}đ
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Proof */}
          {order.deliveryProofImages?.length > 0 && (
            <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Hình ảnh xác nhận</h3>
              <div className="flex gap-3 flex-wrap">
                {order.deliveryProofImages.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img}
                    alt="Delivery proof"
                    className="w-40 h-30 object-cover rounded-xl border border-gray-700"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Lịch trình</h3>
            <div className="space-y-4">
              {order.events?.map((event: any, i: number) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="text-lg">
                      {EVENT_ICONS[event.type] || "📌"}
                    </span>
                    {i < order.events.length - 1 && (
                      <div className="w-px h-full bg-gray-700 mt-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium">
                      {(STATUS_LABELS[event.type] || event.type?.replace(/_/g, " "))}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    {event.note && (
                      <p className="text-xs text-gray-400 mt-1">{event.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Complaint */}
          <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-4">Khiếu nại</h3>
            {order.complaint && (
              <div className="mb-4">
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[order.complaint.status] || "bg-gray-700 text-gray-300"}`}
                >
                  {COMPLAINT_LABELS[order.complaint.status] || order.complaint.status}
                </span>
                {order.complaint.notes?.map((note: string, i: number) => (
                  <p key={i} className="text-sm text-gray-400 mt-2">
                    • {note}
                  </p>
                ))}
              </div>
            )}
            <div className="space-y-3">
              <select
                value={complaintStatus}
                onChange={(e) => setComplaintStatus(e.target.value)}
                aria-label="Complaint status"
                title="Select complaint status"
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-gray-100"
              >
                {Object.entries(COMPLAINT_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <textarea
                value={complaintNote}
                onChange={(e) => setComplaintNote(e.target.value)}
                placeholder="Thêm ghi chú..."
                className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-gray-100 resize-none"
                rows={3}
              />
              <button
                onClick={() =>
                  complaintMutation.mutate({
                    status: complaintStatus,
                    note: complaintNote,
                  })
                }
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-all"
              >
                Cập nhật khiếu nại
              </button>
            </div>
          </div>

          {/* Audit Log */}
          {auditLogs.length > 0 && (
            <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Nhật ký hệ thống</h3>
              <div className="space-y-3">
                {auditLogs.map((log: any, i: number) => (
                  <div
                    key={i}
                    className="text-sm border-b border-gray-800 pb-3 last:border-0"
                  >
                    <p className="text-gray-300 font-medium">{log.action}</p>
                    {log.field && (
                      <p className="text-xs text-gray-500">
                        {log.field}: {String(log.oldValue)} →{" "}
                        {String(log.newValue)}
                      </p>
                    )}
                    <p className="text-xs text-gray-600">
                      {new Date(log.performedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
