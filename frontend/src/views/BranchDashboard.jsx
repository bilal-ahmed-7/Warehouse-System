import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { Store, Package, ArrowRightLeft, FileText, Plus, CheckCircle, Trash2, RefreshCw } from 'lucide-react';

export default function BranchDashboard({ user, showToast }) {
  const [stockList, setStockList] = useState([]);
  const [stockCount, setStockCount] = useState(0);
  const [stockPage, setStockPage] = useState(1);

  const [transfers, setTransfers] = useState([]);
  const [transferCount, setTransferCount] = useState(0);
  const [transferPage, setTransferPage] = useState(1);

  const [ledger, setLedger] = useState([]);
  const [ledgerCount, setLedgerCount] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(1);

  const [warehouses, setWarehouses] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');

  // Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [transferItems, setTransferItems] = useState([{ product: '', quantity: 1 }]);
  const [submitting, setSubmitting] = useState(false);

  // Receiving state
  const [receivingId, setReceivingId] = useState(null);

  const loadStock = async (page = 1) => {
    try {
      const res = await api.getBranchStock(page, 10);
      setStockList(res.results || res);
      setStockCount(res.count || (res.results ? res.results.length : res.length));
      setStockPage(page);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadTransfers = async (page = 1) => {
    try {
      const res = await api.getBranchTransfers(page, 10);
      setTransfers(res.results || res);
      setTransferCount(res.count || (res.results ? res.results.length : res.length));
      setTransferPage(page);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadLedger = async (page = 1) => {
    try {
      const res = await api.getBranchLedger(page, 10);
      setLedger(res.results || res);
      setLedgerCount(res.count || (res.results ? res.results.length : res.length));
      setLedgerPage(page);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadBranchData = async () => {
    setLoading(true);
    await Promise.all([
      loadStock(1),
      loadTransfers(1),
      loadLedger(1),
      api.getWarehouses().then(whList => {
        const parsed = Array.isArray(whList) ? whList : (whList.results || []);
        setWarehouses(parsed);
        if (parsed.length > 0 && !selectedWarehouse) setSelectedWarehouse(parsed[0].id);
      }).catch(() => setWarehouses([])),
      api.getProducts().then(pList => {
        const parsed = Array.isArray(pList) ? pList : (pList.results || []);
        setAllProducts(parsed);
      }).catch(() => setAllProducts([]))
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadBranchData();
  }, []);

  const handleAddItemRow = () => {
    setTransferItems([...transferItems, { product: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...transferItems];
    updated[index][field] = value;
    setTransferItems(updated);
  };

  const handleCreateTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWarehouse) {
      showToast('Please select a warehouse.', 'error');
      return;
    }

    const validItems = transferItems.filter(i => i.product && parseInt(i.quantity) > 0);
    if (validItems.length === 0) {
      showToast('Please select at least one valid product with quantity > 0.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.createTransferRequest(selectedWarehouse, validItems);
      showToast('Stock transfer request initiated successfully (PENDING status)!', 'success');
      setIsRequestModalOpen(false);
      setTransferItems([{ product: '', quantity: 1 }]);
      loadBranchData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveTransfer = async (transferId) => {
    setReceivingId(transferId);
    try {
      await api.receiveTransfer(transferId);
      showToast(`Transfer #${transferId} received! Local branch stock updated & audit logged.`, 'success');
      loadBranchData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setReceivingId(null);
    }
  };

  const dispatchedTransfers = transfers.filter(t => t.status === 'DISPATCHED');
  const completedTransfers = transfers.filter(t => t.status === 'COMPLETED');

  if (loading && stockList.length === 0) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Retail Branch Dashboard...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Retail Store Management</h1>
          <p>
            Assigned Branch: <strong>{user?.branch_detail?.name} ({user?.branch_detail?.code})</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => setIsRequestModalOpen(true)}>
            <Plus size={16} /> Request Stock Transfer
          </button>
          <button className="btn btn-secondary" onClick={loadBranchData}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><Store size={24} /></div>
          <div>
            <div className="stat-val">{stockList.reduce((acc, item) => acc + item.quantity, 0)}</div>
            <div className="stat-lbl">Local Branch On-Hand Units</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue"><ArrowRightLeft size={24} /></div>
          <div>
            <div className="stat-val">{dispatchedTransfers.length} Incoming</div>
            <div className="stat-lbl">Dispatched Transfers Ready to Receive</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple"><CheckCircle size={24} /></div>
          <div>
            <div className="stat-val">{completedTransfers.length}</div>
            <div className="stat-lbl">Total Completed Transfers</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="nav-tabs">
        <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
          <Package size={16} /> Local Inventory ({stockCount})
        </button>
        <button className={`tab-btn ${activeTab === 'dispatched' ? 'active' : ''}`} onClick={() => setActiveTab('dispatched')}>
          <ArrowRightLeft size={16} /> Incoming Dispatched ({dispatchedTransfers.length})
        </button>
        <button className={`tab-btn ${activeTab === 'transfers' ? 'active' : ''}`} onClick={() => setActiveTab('transfers')}>
          <CheckCircle size={16} /> All Transfer Requests ({transferCount})
        </button>
        <button className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
          <FileText size={16} /> Branch Audit Ledger ({ledgerCount})
        </button>
      </div>

      {/* TAB 1: Local Inventory */}
      {activeTab === 'inventory' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Store size={20} /> Retail Store Stock Levels</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Data strictly isolated to {user?.branch_detail?.name}
            </span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product SKU</th>
                  <th>Product Name</th>
                  <th>Local On-Hand Quantity</th>
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
                        color: item.quantity === 0 ? 'var(--accent-danger)' : 'var(--text-primary)'
                      }}>
                        {item.quantity} units
                      </strong>
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

      {/* TAB 2: Incoming Dispatched */}
      {activeTab === 'dispatched' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><ArrowRightLeft size={20} /> Incoming Dispatched Stock Transfers</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Dispatched from Central Warehouse. Click Receive to increment local stock.
            </span>
          </div>

          {dispatchedTransfers.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No incoming dispatched transfers awaiting receipt.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transfer ID</th>
                    <th>From Warehouse</th>
                    <th>Dispatched Items</th>
                    <th>Date Dispatched</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchedTransfers.map((t) => (
                    <tr key={t.id}>
                      <td><code>#{t.id}</code></td>
                      <td>{t.from_branch_detail?.name} ({t.from_branch_detail?.code})</td>
                      <td>
                        {t.items.map(item => (
                          <div key={item.id} style={{ fontSize: '0.85rem' }}>
                            • {item.product_detail?.title}: <strong>{item.quantity} units</strong>
                          </div>
                        ))}
                      </td>
                      <td>{new Date(t.created_at).toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleReceiveTransfer(t.id)}
                          disabled={receivingId === t.id}
                        >
                          <CheckCircle size={14} />
                          {receivingId === t.id ? 'Receiving Stock...' : 'Receive & Add Stock'}
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

      {/* TAB 3: All Requests */}
      {activeTab === 'transfers' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><CheckCircle size={20} /> Transfer Request History</h3>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transfer #</th>
                  <th>Source Warehouse</th>
                  <th>Status</th>
                  <th>Line Items</th>
                  <th>Date Created</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id}>
                    <td><code>#{t.id}</code></td>
                    <td>{t.from_branch_detail?.name} ({t.from_branch_detail?.code})</td>
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
            <h3 className="card-title"><FileText size={20} /> Branch Audit Ledger</h3>
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

      {/* Modal: Request Stock Transfer */}
      <Modal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} title="Initiate Inter-Branch Transfer Request">
        <form onSubmit={handleCreateTransferSubmit}>
          <div className="form-group">
            <label className="form-label">Source Central Warehouse</label>
            <select
              className="form-control"
              required
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
            >
              <option value="">-- Select Source Warehouse --</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
              ))}
            </select>
          </div>

          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>Requested Line Items:</h4>
          {transferItems.map((item, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
              <select
                className="form-control"
                required
                value={item.product}
                onChange={(e) => handleItemChange(index, 'product', e.target.value)}
              >
                <option value="">-- Select Product --</option>
                {allProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.title} ({p.sku})</option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                className="form-control"
                required
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
              />

              {transferItems.length > 1 && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleRemoveItemRow(index)}>
                  <Trash2 size={16} color="var(--accent-danger)" />
                </button>
              )}
            </div>
          ))}

          <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddItemRow} style={{ marginTop: '4px' }}>
            <Plus size={14} /> Add Line Item
          </button>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsRequestModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting Request...' : 'Submit Transfer Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
