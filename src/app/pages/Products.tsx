import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Search, Filter, MoreVertical, PackageOpen, Edit, Trash2, Eye,
  X, ShieldCheck, Tag, Hash
} from "lucide-react";
import { Button, Input, Badge } from "../components/ui";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: string;
  image: string;
  description?: string;
}

const CATEGORIES = ["Все", "Злаки", "Сладости", "Крупы", "Напитки"];

export function Products() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);

  // Load products from Supabase
  useEffect(() => {
    if (!user?.id) return;
    import('../../lib/api').then(({ fetchSellerProducts }) => {
      fetchSellerProducts(user.id).then(data => {
        setProducts(data);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    });
  }, [user?.id]);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "Все" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const handleDelete = (product: Product) => {
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    setDeleteConfirm(null);
    toast.success(`Товар «${product.name}» удалён`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Verified": return <Badge variant="success">Проверен</Badge>;
      case "Pending": return <Badge variant="warning">В проверке</Badge>;
      case "Action Needed": return <Badge variant="destructive">Требуется действие</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Verified": return { label: "Проверен", color: "text-emerald-700", bg: "bg-emerald-50" };
      case "Pending": return { label: "На проверке", color: "text-amber-700", bg: "bg-amber-50" };
      case "Action Needed": return { label: "Требуется действие", color: "text-red-700", bg: "bg-red-50" };
      default: return { label: status, color: "text-gray-700", bg: "bg-gray-50" };
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50 relative">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-4 border-b border-gray-100 space-y-4 pt-10">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Мои товары</h1>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск товаров..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 border-gray-200 bg-white shadow-sm"
            />
          </div>
          <Button
            variant={showFilter ? "default" : "outline"}
            size="icon"
            className={`shrink-0 h-10 w-10 ${showFilter ? "bg-emerald-600 text-white" : "border-gray-200 bg-white shadow-sm"}`}
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {showFilter && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3 pb-24">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <PackageOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium text-gray-500">{search || selectedCategory !== 'Все' ? 'Товары не найдены' : 'Добавьте свой первый товар'}</p>
            <p className="text-xs text-gray-400 mt-1">{search || selectedCategory !== 'Все' ? 'Попробуйте изменить параметры поиска' : 'Нажмите + чтобы начать'}</p>
          </div>
        )}
        {filtered.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex gap-4 cursor-pointer hover:border-emerald-200 transition-colors relative"
            onClick={() => navigate(`/products/${product.id}/edit`)}
          >
            <div className="h-20 w-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden relative border border-gray-50">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="text-[10px] font-bold text-white tracking-wider">НЕТ В НАЛИЧИИ</span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-900 truncate text-sm">{product.name}</h3>
                  <button
                    className="text-gray-400 hover:text-gray-600 ml-2 shrink-0 relative z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === product.id ? null : product.id);
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-1.5">{product.category}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">{product.price}</span>
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(product.status)}
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <PackageOpen className="w-3 h-3" /> {product.stock} шт.
                  </span>
                </div>
              </div>
            </div>

            {/* Dropdown menu */}
            {menuOpen === product.id && (
              <div className="absolute right-4 top-10 bg-white rounded-xl shadow-lg border border-gray-100 z-30 overflow-hidden w-48">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(null);
                    navigate(`/products/${product.id}/edit`);
                  }}
                >
                  <Edit className="w-4 h-4" /> Редактировать
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(null);
                    setPreviewProduct(product);
                  }}
                >
                  <Eye className="w-4 h-4" /> Просмотр
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(null);
                    setDeleteConfirm(product);
                  }}
                >
                  <Trash2 className="w-4 h-4" /> Удалить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Close menu on background click */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}

      {/* FAB — centered for mobile reachability */}
      <div className="fixed bottom-24 left-0 right-0 z-20 flex justify-center pointer-events-none">
        <button
          onClick={() => navigate("/products/new")}
          className="pointer-events-auto flex items-center gap-2 h-12 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 text-white transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          <span className="text-sm font-semibold">Добавить товар</span>
        </button>
      </div>

      {/* Product Preview Modal */}
      {previewProduct && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setPreviewProduct(null)}
        >
          <div
            className="w-full max-w-[400px] bg-white rounded-t-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="relative h-52 w-full bg-gray-100">
              <img src={previewProduct.image} alt={previewProduct.name} className="w-full h-full object-cover" />
              {previewProduct.stock === 0 && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-sm font-bold text-white tracking-wider">НЕТ В НАЛИЧИИ</span>
                </div>
              )}
              <button
                onClick={() => setPreviewProduct(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute top-3 left-3">
                {(() => {
                  const s = getStatusLabel(previewProduct.status);
                  return (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.color}`}>
                      {previewProduct.status === "Verified" && <ShieldCheck className="inline w-3 h-3 mr-1" />}
                      {s.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">{previewProduct.name}</h2>
                <p className="text-gray-500 text-sm mt-1">{previewProduct.description}</p>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-1">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Цена</p>
                    <p className="font-bold text-gray-900 text-sm">{previewProduct.price}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-1">
                  <Hash className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Остаток</p>
                    <p className="font-bold text-gray-900 text-sm">{previewProduct.stock} шт.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 flex-1">
                  <PackageOpen className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Категория</p>
                    <p className="font-bold text-gray-900 text-sm">{previewProduct.category}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setPreviewProduct(null);
                    navigate(`/products/${previewProduct.id}/edit`);
                  }}
                  className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4" /> Редактировать
                </button>
                <button
                  onClick={() => {
                    const p = previewProduct;
                    setPreviewProduct(null);
                    setDeleteConfirm(p);
                  }}
                  className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 hover:bg-red-100 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="w-full max-w-[340px] bg-white rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-center text-lg mb-2">Удалить товар?</h3>
            <p className="text-gray-500 text-sm text-center mb-6 leading-snug">
              «{deleteConfirm.name}» будет удалён. Это действие нельзя отменить.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-2xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
