"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  MessageSquare,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";

interface SalesCS {
  id: string;
  name: string;
  phone: string;
  email: string;
  division: string;
  divisionColor: string;
  status: "connected" | "disconnected";
  createdAt: string;
}

const mockData: SalesCS[] = [
  { id: "1", name: "Faiz", phone: "81392493171", email: "faiz@ayres.id", division: "Marketing", divisionColor: "bg-blue-100 text-blue-700", status: "connected", createdAt: "01 Apr 2026, 15:43" },
  { id: "2", name: "Devina", phone: "85783467223", email: "devina@ayres.id", division: "Produk", divisionColor: "bg-green-100 text-green-700", status: "connected", createdAt: "27 Mar 2026, 15:45" },
  { id: "3", name: "Pimel", phone: "08573829395", email: "pimel@ayres.id", division: "Marketing", divisionColor: "bg-blue-100 text-blue-700", status: "disconnected", createdAt: "25 Mar 2026, 09:44" },
  { id: "4", name: "Anis", phone: "082436364713", email: "anis@ayres.id", division: "Marketing", divisionColor: "bg-blue-100 text-blue-700", status: "connected", createdAt: "19 Feb 2026, 13:24" },
  { id: "5", name: "Reza", phone: "628231533622", email: "reza@ayres.id", division: "Produk", divisionColor: "bg-green-100 text-green-700", status: "disconnected", createdAt: "19 Feb 2026, 13:20" },
];

export default function SalesPage() {
  const [search, setSearch] = useState("");
  const [filterDivision, setFilterDivision] = useState("All Division");

  const filtered = mockData.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.phone.includes(search) ||
      item.email.toLowerCase().includes(search.toLowerCase());
    const matchDivision =
      filterDivision === "All Division" || item.division === filterDivision;
    return matchSearch && matchDivision;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">List Sales / CS</h1>
        <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600">
          <Plus className="w-4 h-4" />
          Tambah Sales/CS
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari Sales/CS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
        <select
          value={filterDivision}
          onChange={(e) => setFilterDivision(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option>All Division</option>
          <option>Marketing</option>
          <option>Produk</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-12">No</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                <span className="flex items-center gap-1 cursor-pointer">Sales/CS Profile <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                <span className="flex items-center gap-1 cursor-pointer">Telepon <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                <span className="flex items-center gap-1 cursor-pointer">Email <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Division</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">
                <span className="flex items-center gap-1 cursor-pointer">Created At <ArrowUpDown className="w-3 h-3" /></span>
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                      {item.name[0]}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{item.phone}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{item.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${item.divisionColor}`}>{item.division}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${item.status === "connected" ? "bg-emerald-500" : "bg-gray-300"}`} />
                    <span className={`text-xs font-medium ${item.status === "connected" ? "text-emerald-600" : "text-gray-400"}`}>
                      {item.status === "connected" ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{item.createdAt}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Link
                      href={`/dashboard/sales/${item.id}/chat`}
                      className="p-1.5 hover:bg-blue-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Link>
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
          <p className="text-sm text-gray-500">{filtered.length} Sales/CS</p>
          <div className="flex items-center gap-2">
            <button className="p-1 rounded border border-gray-200 text-gray-400 hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
            <span className="w-7 h-7 flex items-center justify-center rounded bg-blue-500 text-white text-sm font-medium">1</span>
            <button className="p-1 rounded border border-gray-200 text-gray-400 hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
            <span className="text-sm text-gray-500 ml-2">Halaman 1 dari 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
