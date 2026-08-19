import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { Building, Users, Package, FileText, ArrowRightLeft, Plus, Layers, Search, RefreshCw, Edit2, Trash2 } from 'lucide-react';

export default function AdminDashboard({ showToast }) {
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('stock');

  // Datasets & Totals for Pagination
  const [branches, setBranches] = useState([]);
  const [branchCount, setBranchCount] = useState(0);
  const [branchPage, setBranchPage] = useState(1);

  const [users, setUsers] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [userPage, setUserPage] = useState(1);

  const [products, setProducts] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [productPage, setProductPage] = useState(1);

  const [stockList, setStockList] = useState([]);
  const [stockCount, setStockCount] = useState(0);
  const [stockPage, setStockPage] = useState(1);

  const [ledger, setLedger] = useState([]);
  const [ledgerCount, setLedgerCount] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(1);

  const [transfers, setTransfers] = useState([]);
  const [transferCount, setTransferCount] = useState(0);
  const [transferPage, setTransferPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Create Modals state
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Edit Modals state
  const [editingBranch, setEditingBranch] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form states
  const [newBranch, setNewBranch] = useState({ name: '', code: '', is_warehouse: false });
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'BRANCH_MANAGER', branch: '' });
  const [newProduct, setNewProduct] = useState({ title: '', sku: '', price: '' });

  const loadStats = async () => {
    try {
      const sData = await api.getAdminStats();
      setStats(sData);
    } catch (err) {}
  };

  const loadStock = async (page = 1) => {
    try {
      const res = await api.getAdminStock(page, 10);
      setStockList(res.results || res);
      setStockCount(res.count || (res.results ? res.results.length : res.length));
      setStockPage(page);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadLedger = async (page = 1) => {
    try {
      const res = await api.getAdminLedger(page, 10);
      setLedger(res.results || res);
      setLedgerCount(res.count || (res.results ? res.results.length : res.length));
      setLedgerPage(page);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadBranches = async (page = 1) => {
    try {
      const res = await api.getAdminBranches(page, 10);
      setBranches(res.results || res);
      setBranchCount(res.count || (res.results ? res.results.length : res.length));
      setBranchPage(page);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadUsers = async (page = 1) => {
    try {
      const res = await api.getAdminUsers(page, 10);
      setUsers(res.results || res);
      setUserCount(res.count || (res.results ? res.results.length : res.length));
      setUserPage(page);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadProducts = async (page = 1) => {
    try {
      const res = await api.getAdminProducts(page, 10);
      setProducts(res.results || res);
      setProductCount(res.count || (res.results ? res.results.length : res.length));
      setProductPage(page);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadTransfers = async (page = 1) => {
    try {
      const res = await api.getAdminTransfers(page, 10);
      setTransfers(res.results || res);
      setTransferCount(res.count || (res.results ? res.results.length : res.length));
      setTransferPage(page);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadStock(1),
      loadLedger(1),
      loadBranches(1),
      loadUsers(1),
      loadProducts(1),
      loadTransfers(1)
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // --- Branch CRUD Handlers ---
  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await api.createBranch(newBranch);
      showToast('Branch created successfully!', 'success');
      setIsBranchModalOpen(false);
      setNewBranch({ name: '', code: '', is_warehouse: false });
      loadBranches(branchPage);
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateBranch = async (e) => {
    e.preventDefault();
    if (!editingBranch) return;
    try {
      await api.updateBranch(editingBranch.id, {
        name: editingBranch.name,
        code: editingBranch.code,
        is_warehouse: editingBranch.is_warehouse
      });
      showToast('Branch updated successfully!', 'success');
      setEditingBranch(null);
      loadBranches(branchPage);
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteBranch = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete branch "${name}"?`)) return;
    try {
      await api.deleteBranch(id);
      showToast(`Branch "${name}" deleted successfully!`, 'success');
      loadBranches(branchPage);
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- User CRUD Handlers ---
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newUser };
      if (!payload.branch) delete payload.branch;
      await api.createUser(payload);
      showToast('User account created successfully!', 'success');
      setIsUserModalOpen(false);
      setNewUser({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'BRANCH_MANAGER', branch: '' });
      loadUsers(userPage);
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload = {
        username: editingUser.username,
        email: editingUser.email,
        first_name: editingUser.first_name,
        last_name: editingUser.last_name,
        role: editingUser.role,
        branch: editingUser.branch || null
      };
      if (editingUser.password) {
        payload.password = editingUser.password;
      }
      await api.updateUser(editingUser.id, payload);
      showToast('User account updated successfully!', 'success');
      setEditingUser(null);
      loadUsers(userPage);
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user account "${username}"?`)) return;
    try {
      await api.deleteUser(id);
      showToast(`User account "${username}" deleted successfully!`, 'success');
      loadUsers(userPage);
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // --- Product CRUD Handlers ---
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await api.createProduct(newProduct);
      showToast('Product added to master catalog!', 'success');
      setIsProductModalOpen(false);
      setNewProduct({ title: '', sku: '', price: '' });
      loadProducts(productPage);
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await api.updateProduct(editingProduct.id, {
        title: editingProduct.title,
        sku: editingProduct.sku,
        price: editingProduct.price
      });
      showToast('Product updated successfully!', 'success');
      setEditingProduct(null);
      loadProducts(productPage);
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete product "${title}" from master catalog?`)) return;
    try {
      await api.deleteProduct(id);
      showToast(`Product "${title}" deleted successfully!`, 'success');
      loadProducts(productPage);
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading && !stats) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Super Admin Dashboard...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Super Admin Dashboard</h1>
          <p>Global multi-branch system administration, inventory matrix & immutable audit ledger</p>
        </div>
        <button className="btn btn-secondary" onClick={loadAllData}>
          <RefreshCw size={16} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue"><Building size={24} /></div>
            <div>
              <div className="stat-val">{stats.total_branches}</div>
              <div className="stat-lbl">{stats.warehouses_count} Warehouses / {stats.retail_branches_count} Retail</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green"><Package size={24} /></div>
            <div>
              <div className="stat-val">{stats.total_stock_units}</div>
              <div className="stat-lbl">System Total Stock Units</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple"><Users size={24} /></div>
            <div>
              <div className="stat-val">{stats.total_users}</div>
              <div className="stat-lbl">Registered User Accounts</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon amber"><ArrowRightLeft size={24} /></div>
            <div>
              <div className="stat-val">{stats.pending_transfers} Pending</div>
              <div className="stat-lbl">{stats.completed_transfers} Transfers Completed</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="nav-tabs">
        <button className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
          <Layers size={16} /> System Stock Matrix
        </button>
        <button className={`tab-btn ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>
          <FileText size={16} /> Global Audit Ledger
        </button>
        <button className={`tab-btn ${activeTab === 'branches' ? 'active' : ''}`} onClick={() => setActiveTab('branches')}>
          <Building size={16} /> Branches ({branchCount})
        </button>
        <button className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          <Users size={16} /> User Accounts ({userCount})
        </button>
        <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
          <Package size={16} /> Products Catalog ({productCount})
        </button>
        <button className={`tab-btn ${activeTab === 'transfers' ? 'active' : ''}`} onClick={() => setActiveTab('transfers')}>
          <ArrowRightLeft size={16} /> All Transfers ({transferCount})
        </button>
      </div>

      {/* TAB 1: System Stock Matrix */}
      {activeTab === 'stock' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Layers size={20} /> Multi-Branch Stock Overview</h3>
            <div style={{ position: 'relative', width: '260px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search stock..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Branch Location</th>
                  <th>Type</th>
                  <th>On-Hand Quantity</th>
                </tr>
              </thead>
              <tbody>
                {stockList
                  .filter(s =>
                    s.product_detail?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.product_detail?.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    s.branch_detail?.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.product_detail?.title}</strong></td>
                      <td><code>{item.product_detail?.sku}</code></td>
                      <td>{item.branch_detail?.name} ({item.branch_detail?.code})</td>
                      <td>
                        <span className={`status-badge ${item.branch_detail?.is_warehouse ? 'status-DISPATCHED' : 'status-COMPLETED'}`}>
                          {item.branch_detail?.is_warehouse ? 'Warehouse' : 'Retail Branch'}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: '1.05rem', color: item.quantity === 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
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

      {/* TAB 2: Global Audit Ledger */}
      {activeTab === 'ledger' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><FileText size={20} /> Immutable Stock Audit Ledger</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Append-only log record history</span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Branch</th>
                  <th>Product SKU</th>
                  <th>Action Event</th>
                  <th>Quantity Change</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td><code>{new Date(entry.timestamp).toLocaleString()}</code></td>
                    <td>{entry.branch_detail?.name} ({entry.branch_detail?.code})</td>
                    <td>{entry.product_detail?.title} (<code>{entry.product_detail?.sku}</code>)</td>
                    <td><span className="status-badge status-PENDING">{entry.action}</span></td>
                    <td>
                      <span style={{
                        color: entry.quantity_change > 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}>
                        {entry.quantity_change > 0 ? `+${entry.quantity_change}` : entry.quantity_change}
                      </span>
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

      {/* TAB 3: Branch Management */}
      {activeTab === 'branches' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Building size={20} /> Branch Locations</h3>
            <button className="btn btn-primary" onClick={() => setIsBranchModalOpen(true)}>
              <Plus size={16} /> Add New Branch
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Branch Code</th>
                  <th>Name</th>
                  <th>Classification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td><code>{b.code}</code></td>
                    <td><strong>{b.name}</strong></td>
                    <td>
                      <span className={`status-badge ${b.is_warehouse ? 'status-DISPATCHED' : 'status-COMPLETED'}`}>
                        {b.is_warehouse ? 'Central Warehouse Hub' : 'Retail Store Branch'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingBranch({ ...b })}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteBranch(b.id, b.name)}>
                          <Trash2 size={14} color="var(--accent-danger)" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={branchPage}
            totalCount={branchCount}
            pageSize={10}
            onPageChange={(p) => loadBranches(p)}
          />
        </div>
      )}

      {/* TAB 4: User Accounts */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Users size={20} /> System User Accounts</h3>
            <button className="btn btn-primary" onClick={() => setIsUserModalOpen(true)}>
              <Plus size={16} /> Create User Account
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>System Role</th>
                  <th>Assigned Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.username}</strong></td>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>{u.email}</td>
                    <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                    <td>{u.branch_detail ? `${u.branch_detail.name} (${u.branch_detail.code})` : 'Global / None'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingUser({ ...u, password: '' })}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteUser(u.id, u.username)}>
                          <Trash2 size={14} color="var(--accent-danger)" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={userPage}
            totalCount={userCount}
            pageSize={10}
            onPageChange={(p) => loadUsers(p)}
          />
        </div>
      )}

      {/* TAB 5: Products Catalog */}
      {activeTab === 'products' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><Package size={20} /> Master Products Catalog</h3>
            <button className="btn btn-primary" onClick={() => setIsProductModalOpen(true)}>
              <Plus size={16} /> Add Product
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Title / Name</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.sku}</code></td>
                    <td><strong>{p.title}</strong></td>
                    <td>${parseFloat(p.price).toFixed(2)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingProduct({ ...p })}>
                          <Edit2 size={14} /> Edit
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteProduct(p.id, p.title)}>
                          <Trash2 size={14} color="var(--accent-danger)" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={productPage}
            totalCount={productCount}
            pageSize={10}
            onPageChange={(p) => loadProducts(p)}
          />
        </div>
      )}

      {/* TAB 6: All Transfers */}
      {activeTab === 'transfers' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><ArrowRightLeft size={20} /> Inter-Branch Stock Transfers</h3>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transfer #</th>
                  <th>From (Warehouse)</th>
                  <th>To (Branch)</th>
                  <th>Requested By</th>
                  <th>Created At</th>
                  <th>Status</th>
                  <th>Line Items</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr key={t.id}>
                    <td><code>#{t.id}</code></td>
                    <td>{t.from_branch_detail?.name} ({t.from_branch_detail?.code})</td>
                    <td>{t.to_branch_detail?.name} ({t.to_branch_detail?.code})</td>
                    <td>{t.created_by_username}</td>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                    <td><span className={`status-badge status-${t.status}`}>{t.status}</span></td>
                    <td>
                      {t.items.map(item => (
                        <div key={item.id} style={{ fontSize: '0.8rem' }}>
                          • {item.product_detail?.title}: <strong>{item.quantity} units</strong>
                        </div>
                      ))}
                    </td>
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

      {/* Modal 1: Add Branch */}
      <Modal isOpen={isBranchModalOpen} onClose={() => setIsBranchModalOpen(false)} title="Create New Branch / Warehouse">
        <form onSubmit={handleCreateBranch}>
          <div className="form-group">
            <label className="form-label">Branch Name</label>
            <input type="text" className="form-control" required value={newBranch.name} onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })} placeholder="e.g. Eastside Retail Hub" />
          </div>
          <div className="form-group">
            <label className="form-label">Branch Unique Code</label>
            <input type="text" className="form-control" required value={newBranch.code} onChange={(e) => setNewBranch({ ...newBranch, code: e.target.value.toUpperCase() })} placeholder="e.g. BR-03" />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
            <input type="checkbox" id="is_wh" checked={newBranch.is_warehouse} onChange={(e) => setNewBranch({ ...newBranch, is_warehouse: e.target.checked })} />
            <label htmlFor="is_wh" className="form-label" style={{ margin: 0 }}>Is Central Distribution Warehouse?</label>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsBranchModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Branch</button>
          </div>
        </form>
      </Modal>

      {/* Modal 1B: Edit Branch */}
      <Modal isOpen={!!editingBranch} onClose={() => setEditingBranch(null)} title={`Edit Branch: ${editingBranch?.name}`}>
        {editingBranch && (
          <form onSubmit={handleUpdateBranch}>
            <div className="form-group">
              <label className="form-label">Branch Name</label>
              <input type="text" className="form-control" required value={editingBranch.name} onChange={(e) => setEditingBranch({ ...editingBranch, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Branch Code</label>
              <input type="text" className="form-control" required value={editingBranch.code} onChange={(e) => setEditingBranch({ ...editingBranch, code: e.target.value.toUpperCase() })} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
              <input type="checkbox" id="edit_is_wh" checked={editingBranch.is_warehouse} onChange={(e) => setEditingBranch({ ...editingBranch, is_warehouse: e.target.checked })} />
              <label htmlFor="edit_is_wh" className="form-label" style={{ margin: 0 }}>Is Central Distribution Warehouse?</label>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingBranch(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 2: Add User */}
      <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} title="Create System User Account">
        <form onSubmit={handleCreateUser}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" className="form-control" required value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" required value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" className="form-control" value={newUser.first_name} onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-control" value={newUser.last_name} onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">System Role</label>
            <select className="form-control" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
              <option value="BRANCH_MANAGER">Branch Manager</option>
            </select>
          </div>
          {newUser.role !== 'SUPER_ADMIN' && (
            <div className="form-group">
              <label className="form-label">Assigned Branch / Location</label>
              <select className="form-control" required value={newUser.branch} onChange={(e) => setNewUser({ ...newUser, branch: e.target.value })}>
                <option value="">-- Select Location --</option>
                {branches
                  .filter(b => newUser.role === 'WAREHOUSE_MANAGER' ? b.is_warehouse : !b.is_warehouse)
                  .map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
              </select>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsUserModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create User</button>
          </div>
        </form>
      </Modal>

      {/* Modal 2B: Edit User */}
      <Modal isOpen={!!editingUser} onClose={() => setEditingUser(null)} title={`Edit User: ${editingUser?.username}`}>
        {editingUser && (
          <form onSubmit={handleUpdateUser}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="form-control" required value={editingUser.username} onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password (leave blank to keep current)</label>
              <input type="password" className="form-control" placeholder="••••••••" value={editingUser.password || ''} onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input type="text" className="form-control" value={editingUser.first_name || ''} onChange={(e) => setEditingUser({ ...editingUser, first_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input type="text" className="form-control" value={editingUser.last_name || ''} onChange={(e) => setEditingUser({ ...editingUser, last_name: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">System Role</label>
              <select className="form-control" value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
                <option value="BRANCH_MANAGER">Branch Manager</option>
              </select>
            </div>
            {editingUser.role !== 'SUPER_ADMIN' && (
              <div className="form-group">
                <label className="form-label">Assigned Branch / Location</label>
                <select className="form-control" value={editingUser.branch || ''} onChange={(e) => setEditingUser({ ...editingUser, branch: e.target.value })}>
                  <option value="">-- Select Location --</option>
                  {branches
                    .filter(b => editingUser.role === 'WAREHOUSE_MANAGER' ? b.is_warehouse : !b.is_warehouse)
                    .map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                </select>
              </div>
            )}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 3: Add Product */}
      <Modal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} title="Add New Product to Catalog">
        <form onSubmit={handleCreateProduct}>
          <div className="form-group">
            <label className="form-label">Product Title</label>
            <input type="text" className="form-control" required value={newProduct.title} onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })} placeholder="e.g. Wireless Mouse" />
          </div>
          <div className="form-group">
            <label className="form-label">SKU</label>
            <input type="text" className="form-control" required value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} placeholder="e.g. TECH-MSE-006" />
          </div>
          <div className="form-group">
            <label className="form-label">Price ($)</label>
            <input type="number" step="0.01" className="form-control" required value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="49.99" />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Product</button>
          </div>
        </form>
      </Modal>

      {/* Modal 3B: Edit Product */}
      <Modal isOpen={!!editingProduct} onClose={() => setEditingProduct(null)} title={`Edit Product: ${editingProduct?.title}`}>
        {editingProduct && (
          <form onSubmit={handleUpdateProduct}>
            <div className="form-group">
              <label className="form-label">Product Title</label>
              <input type="text" className="form-control" required value={editingProduct.title} onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">SKU</label>
              <input type="text" className="form-control" required value={editingProduct.sku} onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Price ($)</label>
              <input type="number" step="0.01" className="form-control" required value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingProduct(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
