import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { categoryService } from '../../services/categoryService';
import { userService } from '../../services/userService';
import { ticketService } from '../../services/ticketService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { AutoAssignRule, Category, CreateUserPayload, NotificationPreferences, UpdateUserPayload, User, UserRole } from '../../types';

const defaultPrefs: NotificationPreferences = { emailOnAssign: true, emailOnStatusChange: true, emailOnComment: true, emailOnResolved: true };

const emptyNewUser: CreateUserPayload = { name: '', email: '', password: '', role: 'AGENT', team: '' };

export default function SettingsPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(defaultPrefs);
  const [autoRule, setAutoRule] = useState<AutoAssignRule>({ enabled: false, strategy: 'ROUND_ROBIN', categoryAgentMap: {} });
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserPayload>(emptyNewUser);
  const [addingUser, setAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserPayload & { password: string }>({ name: '', email: '', password: '', role: 'AGENT', team: '', isActive: true });
  const [savingEdit, setSavingEdit] = useState(false);

  // Category CRUD state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editCategoryForm, setEditCategoryForm] = useState({ name: '', description: '' });
  const [savingCategoryEdit, setSavingCategoryEdit] = useState(false);

  useEffect(() => {
    Promise.all([
      categoryService.getCategories(),
      userService.getUsers(),
      user ? ticketService.getNotificationPrefs(user.id) : Promise.resolve(defaultPrefs),
      ticketService.getAutoAssignRule(),
    ]).then(([categoryData, userData, prefs, rule]) => {
      setCategories(categoryData);
      setUsers(userData);
      setNotifPrefs(prefs);
      setAutoRule(rule);
    });
  }, [user]);

  const saveNotifPrefs = async () => {
    if (!user) return;
    await ticketService.saveNotificationPrefs(user.id, notifPrefs);
    addToast('Notification preferences saved');
  };

  const agents = users.filter((u) => ['AGENT', 'MANAGER', 'ADMIN'].includes(u.role));

  const toggleAgentForCategory = (catId: number, agentId: number) => {
    setAutoRule((prev) => {
      const map = { ...prev.categoryAgentMap };
      const list = map[catId] ? [...map[catId]] : [];
      const idx = list.indexOf(agentId);
      if (idx >= 0) list.splice(idx, 1); else list.push(agentId);
      map[catId] = list;
      return { ...prev, categoryAgentMap: map };
    });
  };

  const saveAutoRule = async () => {
    await ticketService.saveAutoAssignRule(autoRule);
    addToast('Auto-assignment rules saved');
  };

  const handleAddUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password || newUser.password.length < 6) return;
    setAddingUser(true);
    try {
      const created = await userService.createUser({ ...newUser, name: newUser.name.trim(), email: newUser.email.trim() });
      setUsers((prev) => [...prev, created]);
      setNewUser(emptyNewUser);
      setShowAddUser(false);
      addToast(`User "${created.name}" created successfully`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      addToast(msg);
    } finally {
      setAddingUser(false);
    }
  };

  const startEdit = (u: User) => {
    setEditingUserId(u.id);
    setEditForm({ name: u.name, email: u.email, password: '', role: u.role, team: u.team || '', isActive: u.isActive ?? true });
    setShowAddUser(false);
  };

  const cancelEdit = () => {
    setEditingUserId(null);
  };

  const handleSaveEdit = async () => {
    if (editingUserId == null) return;
    setSavingEdit(true);
    try {
      const payload: UpdateUserPayload = {
        name: editForm.name?.trim() || undefined,
        email: editForm.email?.trim() || undefined,
        role: editForm.role || undefined,
        team: editForm.team,
        isActive: editForm.isActive,
      };
      if (editForm.password && editForm.password.length >= 6) {
        payload.password = editForm.password;
      }
      const updated = await userService.updateUser(editingUserId, payload);
      setUsers((prev) => prev.map((u) => (u.id === editingUserId ? updated : u)));
      setEditingUserId(null);
      addToast(`User "${updated.name}" updated successfully`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      addToast(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Category handlers ────────────────────────────────────────────────
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;
    setAddingCategory(true);
    try {
      const created = await categoryService.createCategory({ name: newCategory.name.trim(), description: newCategory.description.trim() || undefined });
      setCategories((prev) => [...prev, created]);
      setNewCategory({ name: '', description: '' });
      setShowAddCategory(false);
      addToast(`Category "${created.name}" created`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create category';
      addToast(msg);
    } finally {
      setAddingCategory(false);
    }
  };

  const startEditCategory = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setEditCategoryForm({ name: cat.name, description: cat.description || '' });
    setShowAddCategory(false);
  };

  const cancelEditCategory = () => setEditingCategoryId(null);

  const handleSaveCategoryEdit = async () => {
    if (editingCategoryId == null) return;
    setSavingCategoryEdit(true);
    try {
      const updated = await categoryService.updateCategory(editingCategoryId, {
        name: editCategoryForm.name.trim() || undefined,
        description: editCategoryForm.description,
      });
      setCategories((prev) => prev.map((c) => (c.id === editingCategoryId ? updated : c)));
      setEditingCategoryId(null);
      addToast(`Category "${updated.name}" updated`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update category';
      addToast(msg);
    } finally {
      setSavingCategoryEdit(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.name}"? Tickets in this category won't be deleted but will lose their category.`)) return;
    try {
      await categoryService.deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      addToast(`Category "${cat.name}" deleted`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete category';
      addToast(msg);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage categories, team members, and product configuration." />

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-2">
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ey-gray-900">Categories</h3>
            {!showAddCategory && (
              <button type="button" className="btn-primary flex items-center gap-1.5 text-sm" onClick={() => { setShowAddCategory(true); setEditingCategoryId(null); }}>
                <Plus size={16} /> Add Category
              </button>
            )}
          </div>

          {showAddCategory && (
            <div className="mt-4 rounded-xl border border-ey-yellow/40 bg-ey-yellow/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-ey-gray-900">New Category</h4>
                <button type="button" onClick={() => { setShowAddCategory(false); setNewCategory({ name: '', description: '' }); }} className="text-ey-gray-400 hover:text-ey-gray-600"><X size={18} /></button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Name</label>
                  <input className="input" value={newCategory.name} onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Hardware" />
                </div>
                <div>
                  <label className="label">Description (optional)</label>
                  <input className="input" value={newCategory.description} onChange={(e) => setNewCategory((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description" />
                </div>
              </div>
              <button type="button" className="btn-primary mt-4" onClick={handleAddCategory} disabled={addingCategory || !newCategory.name.trim()}>
                {addingCategory ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="rounded-xl border border-ey-gray-200 p-4">
                {editingCategoryId === category.id ? (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-semibold text-ey-gray-900">Edit Category</h4>
                      <button type="button" onClick={cancelEditCategory} className="text-ey-gray-400 hover:text-ey-gray-600"><X size={18} /></button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Name</label>
                        <input className="input" value={editCategoryForm.name} onChange={(e) => setEditCategoryForm((p) => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Description</label>
                        <input className="input" value={editCategoryForm.description} onChange={(e) => setEditCategoryForm((p) => ({ ...p, description: e.target.value }))} />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button type="button" className="btn-primary" onClick={handleSaveCategoryEdit} disabled={savingCategoryEdit}>
                        {savingCategoryEdit ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button type="button" className="rounded-xl border border-ey-gray-200 px-4 py-2 text-sm font-medium text-ey-gray-700 hover:bg-ey-gray-50" onClick={cancelEditCategory}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-ey-gray-900">{category.name}</div>
                      <div className="mt-1 text-sm text-ey-gray-500">{category.description || 'No description'}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => startEditCategory(category)} className="rounded-lg p-1.5 text-ey-gray-400 hover:bg-ey-gray-100 hover:text-ey-gray-700" title="Edit category">
                        <Pencil size={15} />
                      </button>
                      <button type="button" onClick={() => handleDeleteCategory(category)} className="rounded-lg p-1.5 text-ey-gray-400 hover:bg-rose-50 hover:text-rose-600" title="Delete category">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ey-gray-900">Team Members</h3>
            {!showAddUser && (
              <button type="button" className="btn-primary flex items-center gap-1.5 text-sm" onClick={() => setShowAddUser(true)}>
                <Plus size={16} /> Add User
              </button>
            )}
          </div>

          {showAddUser && (
            <div className="mt-4 rounded-xl border border-ey-yellow/40 bg-ey-yellow/5 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold text-ey-gray-900">New User</h4>
                <button type="button" onClick={() => { setShowAddUser(false); setNewUser(emptyNewUser); }} className="text-ey-gray-400 hover:text-ey-gray-600">
                  <X size={18} />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Full Name</label>
                  <input className="input" value={newUser.name} onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} placeholder="john@ticops.com" />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input className="input" type="password" value={newUser.password} onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select className="input" value={newUser.role} onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as UserRole }))}>
                    <option value="REQUESTOR">Requestor</option>
                    <option value="AGENT">Agent</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Team (optional)</label>
                  <input className="input" value={newUser.team} onChange={(e) => setNewUser((p) => ({ ...p, team: e.target.value }))} placeholder="e.g. Support, Engineering" />
                </div>
              </div>
              <button
                type="button"
                className="btn-primary mt-4"
                onClick={handleAddUser}
                disabled={addingUser || !newUser.name.trim() || !newUser.email.trim() || newUser.password.length < 6}
              >
                {addingUser ? 'Creating...' : 'Create User'}
              </button>
            </div>
          )}

          <div className="mt-4 space-y-3">
            {users.map((u) => (
              <div key={u.id} className="rounded-xl border border-ey-gray-200 p-4">
                {editingUserId === u.id ? (
                  <>
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="font-semibold text-ey-gray-900">Edit User</h4>
                      <button type="button" onClick={cancelEdit} className="text-ey-gray-400 hover:text-ey-gray-600"><X size={18} /></button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="label">Full Name</label>
                        <input className="input" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">Email</label>
                        <input className="input" type="email" value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label">New Password (leave blank to keep)</label>
                        <input className="input" type="password" value={editForm.password} onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))} placeholder="Min 6 characters" />
                      </div>
                      <div>
                        <label className="label">Role</label>
                        <select className="input" value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value as UserRole }))}>
                          <option value="REQUESTOR">Requestor</option>
                          <option value="AGENT">Agent</option>
                          <option value="MANAGER">Manager</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Team</label>
                        <input className="input" value={editForm.team} onChange={(e) => setEditForm((p) => ({ ...p, team: e.target.value }))} />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" checked={editForm.isActive ?? true} onChange={(e) => setEditForm((p) => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded border-ey-gray-300 accent-ey-yellow" />
                          <span className="text-sm font-medium text-ey-gray-700">Active</span>
                        </label>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button type="button" className="btn-primary" onClick={handleSaveEdit} disabled={savingEdit}>
                        {savingEdit ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button type="button" className="rounded-xl border border-ey-gray-200 px-4 py-2 text-sm font-medium text-ey-gray-700 hover:bg-ey-gray-50" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-ey-gray-900">{u.name}</div>
                      <div className="mt-1 text-sm text-ey-gray-500">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {u.team && <span className="rounded-full bg-ey-gray-50 px-2.5 py-1 text-xs text-ey-gray-500">{u.team}</span>}
                      <span className="rounded-full bg-ey-gray-100 px-2.5 py-1 text-xs font-semibold text-ey-gray-700">{u.role}</span>
                      {u.isActive === false && <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">Inactive</span>}
                      <button type="button" onClick={() => startEdit(u)} className="rounded-lg p-1.5 text-ey-gray-400 hover:bg-ey-gray-100 hover:text-ey-gray-700" title="Edit user">
                        <Pencil size={15} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="card mt-6 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-ey-gray-900">Email Notification Preferences</h3>
        <p className="mt-1 text-sm text-ey-gray-500">Configure which events trigger email notifications. (UI preview — a real backend is required to send emails.)</p>
        <div className="mt-4 space-y-3">
          {([
            ['emailOnAssign', 'When a ticket is assigned to me'],
            ['emailOnStatusChange', 'When ticket status changes'],
            ['emailOnComment', 'When a new comment is added'],
            ['emailOnResolved', 'When my ticket is resolved'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={notifPrefs[key]}
                onChange={(e) => setNotifPrefs((p) => ({ ...p, [key]: e.target.checked }))}
                className="h-4 w-4 rounded border-ey-gray-300 accent-ey-yellow"
              />
              <span className="text-sm text-ey-gray-700">{label}</span>
            </label>
          ))}
        </div>
        <button type="button" className="btn-primary mt-4" onClick={saveNotifPrefs}>Save Preferences</button>
      </div>

      {/* Auto-Assignment Rules */}
      <div className="card mt-6 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-ey-gray-900">Auto-Assignment Rules</h3>
        <p className="mt-1 text-sm text-ey-gray-500">Automatically assign tickets to agents when created, based on category.</p>

        <div className="mt-4 flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRule.enabled}
              onChange={(e) => setAutoRule((p) => ({ ...p, enabled: e.target.checked }))}
              className="h-4 w-4 rounded border-ey-gray-300 accent-ey-yellow"
            />
            <span className="text-sm font-medium text-ey-gray-700">Enable auto-assignment</span>
          </label>

          <select
            value={autoRule.strategy}
            onChange={(e) => setAutoRule((p) => ({ ...p, strategy: e.target.value as AutoAssignRule['strategy'] }))}
            className="input w-auto py-1.5 text-sm"
            disabled={!autoRule.enabled}
          >
            <option value="ROUND_ROBIN">Round Robin</option>
            <option value="LOAD_BALANCED">Load Balanced</option>
          </select>
        </div>

        {autoRule.enabled && (
          <div className="mt-5 space-y-4">
            <p className="text-sm font-medium text-ey-gray-600">Select eligible agents for each category:</p>
            {categories.map((cat) => (
              <div key={cat.id} className="rounded-xl border border-ey-gray-200 p-4">
                <div className="mb-2 font-semibold text-ey-gray-900">{cat.name}</div>
                <div className="flex flex-wrap gap-3">
                  {agents.map((agent) => {
                    const selected = (autoRule.categoryAgentMap[cat.id] || []).includes(agent.id);
                    return (
                      <label key={agent.id} className="flex items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleAgentForCategory(cat.id, agent.id)}
                          className="h-3.5 w-3.5 rounded border-ey-gray-300 accent-ey-yellow"
                        />
                        {agent.name}
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="button" className="btn-primary mt-4" onClick={saveAutoRule}>Save Auto-Assignment Rules</button>
      </div>
    </div>
  );
}
