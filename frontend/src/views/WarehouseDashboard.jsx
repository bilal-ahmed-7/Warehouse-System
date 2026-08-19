import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { Warehouse, Package, ArrowRightLeft, FileText, CheckCircle, Sliders, RefreshCw } from 'lucide-react';

export default function WarehouseDashboard({ user, showToast }) {
  const [stockList, setStockList] = useState([]);
  const [stockCount, setStockCount] = useState(0);
  const [stockPage, setStockPage] = useState(1);

  const [transfers, setTransfers] = useState([]);
  const [transferCount, setTransferCount] = useState(0);
  const [transferPage, setTransferPage] = useState(1);

  const [ledger, setLedger] = useState([]);
  const [ledgerCount, setLedgerCount] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(1);

  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');

  // Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustData, setAdjustData] = useState({ productId: '', newQuantity: '', reason: 'Manual Count Audit' });

  // Dispatch Verification Modal
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const loadStock = async (page = 1) => {
    try {
      const res = await api.getWarehouseStock(page, 10);
      setStockList(res.results || res);
      setStockCount(res.count || (res.results ? res.results.length : res.length));
      setStockPage(page);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadTransfers = async (page = 1) => {
    try {
      const res = await api.getWarehouseTransfers(page, 10);
      setTransfers(res.results || res);
      setTransferCount(res.count || (res.results ? res.results.length : res.length));
      setTransferPage(page);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadLedger = async (page = 1) => {
    try {
      const res = await api.getWarehouseLedger(page, 10);
      setLedger(res.results || res);
      setLedgerCount(res.count || (res.results ? res.results.length : res.length));
      setLedgerPage(page);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadWarehouseData = async () => {
    setLoading(true);
    await Promise.all([
      loadStock(1),
      loadTransfers(1),
      loadLedger(1),
      api.getProducts().then(pData => setAllProducts(pData.results || pData)).catch(() => setAllProducts([]))
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadWarehouseData();
  }, []);

  const handleOpenAdjustModal = (item = null) => {
    if (item) {
      setAdjustData({ productId: item.product, newQuantity: item.quantity, reason: 'Physical Stock Count' });
    } else {
      setAdjustData({ productId: '', newQuantity: '', reason: 'Manual Inventory Adjustment' });
    }
    setIsAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.adjustWarehouseStock(adjustData.productId, adjustData.newQuantity, adjustData.reason);
      showToast('Warehouse inventory adjusted successfully!', 'success');
      setIsAdjustModalOpen(false);
      loadWarehouseData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenDispatchModal = (transfer) => {
    setSelectedTransfer(transfer);
    setIsDispatchModalOpen(true);
  };

  const handleConfirmDispatch = async () => {
    if (!selectedTransfer) return;
    setDispatching(true);
    try {
      await api.dispatchTransfer(selectedTransfer.id);
      showToast(`Transfer #${selectedTransfer.id} dispatched successfully! Stock deducted & logged.`, 'success');
      setIsDispatchModalOpen(false);
      setSelectedTransfer(null);
      loadWarehouseData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDispatching(false);
    }
  };

  const pendingTransfers = transfers.filter(t => t.status === 'PENDING');
  const historyTransfers = transfers.filter(t => t.status !== 'PENDING');

  if (loading && stockList.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Central Warehouse Inventory...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Warehouse Management Hub</h1>
          <p>
            Assigned Location: <strong>{user?.branch_detail?.name} ({user?.branch_detail?.code})</strong>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadWarehouseData}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Warehouse size={24} /></div>
          <div>
            <div className="stat-val">{stockList.reduce((acc, item) => acc + item.quantity, 0)}</div>
            <div className="stat-lbl">Central On-Hand Units</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber"><ArrowRightLeft size={24} /></div>
          <div>
            <div className="stat-val">{pendingTransfers.length}</div>
            <div className="stat-lbl">Pending Retail Transfer Requests</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle size={24} /></div>
          <div>
            <div className="stat-val">{transfers.filter(t => t.status === 'DISPATCHED' || t.status === 'COMPLETED').length}</div>
            <div className="stat-lbl">Dispatched / Completed Transfers</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="nav-tabs">
        <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          <Package size={16} /> Central Stock Inventory ({stockCount})
        </button>
        <button className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
          <ArrowRightLeft size={16} /> Pending Transfer Requests ({pendingTransfers.length})
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
          <CheckCircle size={16} /> Transfer History ({historyTransfers.length})
        </button>
        <button className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
          <FileText size={16} /> Warehouse Audit Ledger ({ledgerCount})
        </button>
      </div>

      {/* TAB 1: Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Warehouse size={20} /> Warehouse Stock Levels</h3>
            <button className="btn btn-primary" onClick={() => handleOpenAdjustModal()}>
              <Sliders size={16} /> Perform Manual Stock Adjustment
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product SKU</th>
                  <th>Product Title</th>
                  <th>On-Hand Quantity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stockList.map((item) => (
                  <tr key={item.id}>
                    <td><code>{item.product_detail?.sku}</code></td>
                    <td><strong>{item.product_detail?.title}</strong></td>
                    <td>
                      <strong style={{
                        fontSize: '1.1rem',
                        color: item.quantity <= 10 ? 'var(--accent-warning)' : 'var(--text-primary)'
                      }}>
                        {item.quantity} units
                      </strong>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenAdjustModal(item)}>
                        <Sliders size={14} /> Adjust Quantity
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={stockPage}
            totalCount={stockCount}
            pageSize={10}
            onPageChange={(p) => loadStock(p)}
          />
        </div>
      )}

      {/* TAB 2: Pending Requests */}
      {activeTab === 'requests' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><ArrowRightLeft size={20} /> Pending Stock Transfer Requests</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Retail branches requesting stock from this central warehouse
            </span>
          </div>

          {pendingTransfers.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No pending transfer requests from retail branches at present.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transfer ID</th>
                    <th>Destination Branch</th>
                    <th>Requested By</th>
                    <th>Requested Items</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingTransfers.map((t) => (
                    <tr key={t.id}>
                      <td><code>#{t.id}</code></td>
                      <td><strong>{t.to_branch_detail?.name} ({t.to_branch_detail?.code})</strong></td>
                      <td>{t.created_by_username}</td>
                      <td>
                        {t.items.map(item => (
                          <div key={item.id} style={{ fontSize: '0.85rem' }}>
                            • {item.product_detail?.title}: <strong>{item.quantity} units</strong>
                          </div>
                        ))}
                      </td>
                      <td>{new Date(t.created_at).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => handleOpenDispatchModal(t)}>
                          Review & Dispatch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: History */}
      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><CheckCircle size={20} /> Outgoing Transfer History</h3>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transfer #</th>
                  <th>Destination Branch</th>
                  <th>Status</th>
                  <th>Requested Items</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {historyTransfers.map((t) => (
                  <tr key={t.id}>
                    <td><code>#{t.id}</code></td>
                    <td>{t.to_branch_detail?.name} ({t.to_branch_detail?.code})</td>
                    <td><span className={`status-badge status-${t.status}`}>{t.status}</span></td>
                    <td>
                      {t.items.map(item => (
                        <div key={item.id} style={{ fontSize: '0.85rem' }}>
                          • {item.product_detail?.title}: {item.quantity} units
                        </div>
                      ))}
                    </td>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={transferPage}
            totalCount={transferCount}
            pageSize={10}
            onPageChange={(p) => loadTransfers(p)}
          />
        </div>
      )}

      {/* TAB 4: Ledger */}
      {activeTab === 'ledger' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><FileText size={20} /> Warehouse Stock Ledger</h3>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product SKU</th>
                  <th>Action</th>
                  <th>Quantity Change</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td><code>{new Date(entry.timestamp).toLocaleString()}</code></td>
                    <td>{entry.product_detail?.title} (<code>{entry.product_detail?.sku}</code>)</td>
                    <td><span className="status-badge status-PENDING">{entry.action}</span></td>
                    <td style={{
                      color: entry.quantity_change > 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
                      fontWeight: 'bold'
                    }}>
                      {entry.quantity_change > 0 ? `+${entry.quantity_change}` : entry.quantity_change}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={ledgerPage}
            totalCount={ledgerCount}
            pageSize={10}
            onPageChange={(p) => loadLedger(p)}
          />
        </div>
      )}

      {/* Modal: Manual Stock Adjustment */}
      <Modal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} title="Manual Warehouse Stock Adjustment">
        <form onSubmit={handleAdjustSubmit}>
          <div className="form-group">
            <label className="form-label">Select Product</label>
            <select
              className="form-control"
              required
              value={adjustData.productId}
              onChange={(e) => setAdjustData({ ...adjustData, productId: e.target.value })}
            >
              <option value="">-- Choose Product --</option>
              {allProducts.map(p => (
                <option key={p.id} value={p.id}>{p.title} ({p.sku})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">New Total On-Hand Quantity</label>
            <input
              type="number"
              min="0"
              className="form-control"
              required
              value={adjustData.newQuantity}
              onChange={(e) => setAdjustData({ ...adjustData, newQuantity: e.target.value })}
              placeholder="e.g. 150"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Audit Adjustment Reason</label>
            <input
              type="text"
              className="form-control"
              required
              value={adjustData.reason}
              onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
              placeholder="e.g. Annual Inventory Recount"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Adjustment</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Review & Dispatch Verification */}
      <Modal isOpen={isDispatchModalOpen} onClose={() => setIsDispatchModalOpen(false)} title={`Dispatch Transfer Request #${selectedTransfer?.id}`}>
        {selectedTransfer && (
          <div>
            <div style={{ marginBottom: '16px', background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Destination Branch:</strong> {selectedTransfer.to_branch_detail?.name} ({selectedTransfer.to_branch_detail?.code})
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Requested By:</strong> {selectedTransfer.created_by_username}
              </div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>Requested Stock Availability Check:</h4>
            <div style={{ marginBottom: '20px' }}>
              {selectedTransfer.items.map(item => {
                const whStock = stockList.find(s => s.product === item.product);
                const avail = whStock ? whStock.quantity : 0;
                const isSufficient = avail >= item.quantity;
                return (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderBottom: '1px solid var(--border-color)',
                    fontSize: '0.875rem'
                  }}>
                    <div>
                      <strong>{item.product_detail?.title}</strong> ({item.product_detail?.sku})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span>Req: <strong>{item.quantity}</strong> | Avail: <strong>{avail}</strong></span>
                      {isSufficient ? (
                        <span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>✓ Available</span>
                      ) : (
                        <span style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>❌ Stock Deficit</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#60a5fa' }}>
              🔒 <strong>Thread-Safe Execution Notice:</strong> Triggering dispatch executes a database row lock (<code>select_for_update()</code>) in an atomic transaction to deduct warehouse stock and record a negative entry in the Stock Ledger.
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsDispatchModalOpen(false)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmDispatch}
                disabled={dispatching}
              >
                {dispatching ? 'Executing Dispatch...' : 'Confirm Atomic Dispatch'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
