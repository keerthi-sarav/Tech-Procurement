import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  ShoppingCart, FileText, Users, Package, Truck, Receipt,
  Cylinder, Hash, Wrench, RotateCcw, ChevronLeft, ChevronRight,
  Bell, User, Building2, Menu
} from 'lucide-react';

const navItems = [
  {
    group: 'Purchase',
    items: [
      { path: '/purchase-requisition', label: 'Purchase Requisition', icon: FileText, short: 'PR' },
      { path: '/rfq', label: 'Request for Quotation', icon: ShoppingCart, short: 'RFQ' },
      { path: '/vendor-quotation', label: 'Vendor Quotation', icon: Users, short: 'VQ' },
      { path: '/purchase-order', label: 'Purchase Order', icon: Package, short: 'PO' },
      { path: '/goods-receipt', label: 'Goods Receipt Note', icon: Truck, short: 'GRN' },
      { path: '/purchase-invoice', label: 'Purchase Invoice', icon: Receipt, short: 'INV' },
    ]
  },
  {
    group: 'Cylinders',
    items: [
      { path: '/cylinder-purchase', label: 'Cylinder Purchase', icon: ShoppingCart, short: 'CP' },
      { path: '/cylinder-serial', label: 'Serial Number Entry', icon: Hash, short: 'SN' },
      { path: '/cylinder-testing', label: 'Send for Testing', icon: Wrench, short: 'CT' },
      { path: '/cylinder-return', label: 'Return from Vendor', icon: RotateCcw, short: 'CR' },
    ]
  }
];

const pageLabels = {
  '/purchase-requisition': 'Purchase Requisition (PR)',
  '/rfq': 'Request for Quotation (RFQ)',
  '/vendor-quotation': 'Vendor Quotation & Comparison',
  '/purchase-order': 'Purchase Order (PO)',
  '/goods-receipt': 'Goods Receipt Note (GRN)',
  '/purchase-invoice': 'Purchase Invoice Entry',
  '/cylinder-purchase': 'Cylinder Purchase Entry',
  '/cylinder-serial': 'Cylinder Serial Number Entry',
  '/cylinder-testing': 'Cylinder Sent for Testing / Repair',
  '/cylinder-return': 'Cylinder Return from Vendor',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const pageTitle = pageLabels[location.pathname] || 'Procurement';

  return (
    <div className="flex h-screen overflow-hidden bg-[#f9fafb]">
      {/* Sidebar */}
      <aside
        className={`flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'}`}
        style={{ background: '#1e2a3a', flexShrink: 0 }}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-[#1a56db] flex items-center justify-center flex-shrink-0">
                <Building2 size={16} color="white" />
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-tight">SOGFusion</div>
                <div className="text-white/50 text-xs">Procurement</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-[#1a56db] flex items-center justify-center mx-auto">
              <Building2 size={16} color="white" />
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-16 z-50 w-6 h-6 bg-[#1a56db] rounded-r-full flex items-center justify-center cursor-pointer hover:bg-[#1e429f] transition-colors"
          style={{ left: collapsed ? '52px' : '252px', transition: 'left 0.3s' }}
        >
          {collapsed ? <ChevronRight size={12} color="white" /> : <ChevronLeft size={12} color="white" />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <div className="text-white/40 text-[10px] font-semibold uppercase tracking-widest px-2 py-2">
                  {group.group}
                </div>
              )}
              {collapsed && <div className="my-2 border-t border-white/10" />}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={item.label}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group
                      ${isActive
                        ? 'bg-[#1a56db] text-white shadow-sm'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon size={17} className="flex-shrink-0" />
                    {!collapsed && (
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                    {collapsed && (
                      <span className="text-[10px] font-bold">{item.short}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom user area */}
        {!collapsed && (
          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1a56db] flex items-center justify-center">
                <User size={14} color="white" />
              </div>
              <div>
                <div className="text-white text-xs font-semibold">Admin</div>
                <div className="text-white/40 text-[10px]">Procurement Officer</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header */}
        <header className="bg-white border-b border-[#e5e7eb] px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-base font-semibold text-[#111827] leading-tight">{pageTitle}</h1>
            <p className="text-xs text-[#6b7280] mt-0.5">SOGFusion — Gas ERP Procurement Module</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-[#f3f4f6] transition-colors relative">
              <Bell size={18} className="text-[#6b7280]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#dc2626] rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-[#e5e7eb]">
              <div className="w-8 h-8 rounded-full bg-[#1a56db] flex items-center justify-center">
                <User size={14} color="white" />
              </div>
              <span className="text-sm font-medium text-[#374151]">Admin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
