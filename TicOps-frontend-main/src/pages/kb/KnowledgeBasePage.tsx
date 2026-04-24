import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronRight, Plus, Search, X } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { ticketService } from '../../services/ticketService';
import { categoryService } from '../../services/categoryService';
import { useAuth } from '../../context/AuthContext';
import type { Category, KbArticle } from '../../types';

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', body: '', categoryId: '', tags: '' });
  const [saving, setSaving] = useState(false);

  const canCreate = user && ['ADMIN', 'AGENT'].includes(user.role);

  useEffect(() => {
    Promise.all([ticketService.getKbArticles(), categoryService.getCategories()]).then(([a, c]) => {
      setArticles(a);
      setCategories(c);
    });
  }, []);

  const handleCreateArticle = async () => {
    if (!formData.title.trim() || !formData.body.trim() || !formData.categoryId) return;
    setSaving(true);
    try {
      const newArticle = await ticketService.createKbArticle({
        categoryId: Number(formData.categoryId),
        title: formData.title.trim(),
        body: formData.body.trim(),
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      setArticles((prev) => [...prev, newArticle]);
      setFormData({ title: '', body: '', categoryId: '', tags: '' });
      setShowForm(false);
    } catch {
      // error handled by apiClient interceptor
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return articles;
    const q = search.toLowerCase();
    return articles.filter(
      (a) => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q) || a.tags.some((t) => t.includes(q)),
    );
  }, [articles, search]);

  const grouped = useMemo(() => {
    const map = new Map<number, { category: Category; items: KbArticle[] }>();
    for (const cat of categories) {
      const items = filtered.filter((a) => a.categoryId === cat.id);
      if (items.length > 0) map.set(cat.id, { category: cat, items });
    }
    return Array.from(map.values());
  }, [filtered, categories]);

  const actions = (
    <div className="flex gap-2">
      {canCreate && (
        <button type="button" className="btn-primary flex items-center gap-1.5" onClick={() => setShowForm(true)}>
          <Plus size={16} /> New Article
        </button>
      )}
      <Link to="/tickets/new" className="btn-primary">
        Still need help? Create Ticket
      </Link>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Browse common solutions before creating a ticket. You might find your answer here!"
        actions={actions}
      />

      {/* Create Article Form */}
      {showForm && (
        <div className="card mb-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-ey-gray-900">New Knowledge Base Article</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-ey-gray-400 hover:text-ey-gray-600">
              <X size={20} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Title</label>
              <input className="input" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} placeholder="Article title" />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={formData.categoryId} onChange={(e) => setFormData((p) => ({ ...p, categoryId: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Body</label>
              <textarea className="input min-h-[120px]" value={formData.body} onChange={(e) => setFormData((p) => ({ ...p, body: e.target.value }))} placeholder="Article content..." />
            </div>
            <div>
              <label className="label">Tags (comma-separated)</label>
              <input className="input" value={formData.tags} onChange={(e) => setFormData((p) => ({ ...p, tags: e.target.value }))} placeholder="e.g. vpn, network, troubleshoot" />
            </div>
            <button type="button" className="btn-primary" onClick={handleCreateArticle} disabled={saving || !formData.title.trim() || !formData.body.trim() || !formData.categoryId}>
              {saving ? 'Saving...' : 'Publish Article'}
            </button>
          </div>
        </div>
      )}

      <div className="card mb-6 p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ey-gray-400" size={18} />
          <input
            className="input pl-10"
            placeholder="Search articles by keyword, topic, or tag…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto mb-3 text-ey-gray-300" size={40} />
          <p className="text-sm text-ey-gray-500">{search ? 'No articles match your search.' : 'No articles available.'}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ category, items }) => (
            <div key={category.id}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ey-gray-900">
                <span className="inline-block h-5 w-1 rounded-full bg-ey-yellow" />
                {category.name}
                <span className="ml-1 text-sm font-normal text-ey-gray-400">({items.length})</span>
              </h2>
              <div className="space-y-2">
                {items.map((article) => {
                  const open = expandedId === article.id;
                  return (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => setExpandedId(open ? null : article.id)}
                      className="card w-full text-left transition hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 px-5 py-4">
                        {open ? <ChevronDown size={16} className="shrink-0 text-ey-yellow" /> : <ChevronRight size={16} className="shrink-0 text-ey-gray-400" />}
                        <span className="font-medium text-ey-gray-900">{article.title}</span>
                        <div className="ml-auto flex gap-1.5">
                          {article.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-ey-gray-100 px-2 py-0.5 text-xs text-ey-gray-500">{tag}</span>
                          ))}
                        </div>
                      </div>
                      {open && (
                        <div className="border-t border-ey-gray-100 px-5 py-4 text-sm leading-relaxed text-ey-gray-700 whitespace-pre-line">
                          {article.body}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
