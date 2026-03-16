import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ordersApi } from "../api/services";

const STATUS_OPTIONS = [
  "all",
  "pending",
  "assigned",
  "picking_up",
  "delivering",
  "completed",
  "cancelled",
];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  assigned: "bg-blue-500/20 text-blue-400",
  picking_up: "bg-indigo-500/20 text-indigo-400",
  delivering: "bg-orange-500/20 text-orange-400",
  completed: "bg-emerald-500/20 text-emerald-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["orders", page, status, search],
    queryFn: () =>
      ordersApi.list({
        page,
        limit: 15,
        ...(status !== "all" && { status }),
        ...(search && { search }),
      }),
  });

  const orders = data?.data?.orders || [];
  const pagination = data?.data?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination.total} total orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by order code, customer..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-100 text-sm focus:outline-none focus:border-blue-500 w-72"
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-3 py-2 text-xs rounded-lg capitalize transition-all ${
                status === s
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-gray-400 bg-gray-800/50 border border-gray-700 hover:text-gray-200"
              }`}
            >
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900/80 backdrop-blur border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {[
                  "Order Code",
                  "Customer",
                  "Driver",
                  "Status",
                  "Service",
                  "Total",
                  "Date",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-4"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr
                    key={order._id}
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono text-blue-400">
                      {order.orderCode}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm">{order.customer?.name}</p>
                      <p className="text-xs text-gray-500">
                        {order.customer?.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {order.driver?.name || order.driverName || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${STATUS_COLORS[order.status] || ""}`}
                      >
                        {order.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm capitalize text-gray-300">
                      {order.serviceType}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {order.pricingBreakdown?.total?.toLocaleString()}đ
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-30 hover:bg-gray-700 transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page >= pagination.pages}
              className="px-3 py-1.5 text-sm bg-gray-800 border border-gray-700 rounded-lg disabled:opacity-30 hover:bg-gray-700 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
