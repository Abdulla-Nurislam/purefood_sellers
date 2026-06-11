import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ImagePlus, UploadCloud, Info, X, Tag } from "lucide-react";
import { Card, CardContent, Button, Input, Label, Textarea, Badge } from "../components/ui";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";
import { addProduct, createSellerActivity, fetchProductTags } from "../../lib/api";

// Format number with thousand separators (1500 -> "1 500")
function formatNumber(val: string): string {
  const num = val.replace(/\D/g, '');
  if (!num) return '';
  return Number(num).toLocaleString('ru-RU');
}

// Extract raw digits from formatted string
function rawDigits(val: string): string {
  return val.replace(/\D/g, '');
}

export function ProductForm() {
  const navigate = useNavigate();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("fruits_vegetables");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  // Список тегов-подсказок загружается из таблицы product_tags в Supabase
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  useEffect(() => {
    const FALLBACK_TAGS = ['Эко', 'Натуральное', 'Без сахара', 'Без ГМО', 'Органик', 'Халяль', 'Фермерское', 'Без лактозы', 'Веган', 'Местный продукт'];

    // Race the Supabase call against a 5-second timeout so the spinner never hangs
    const timeoutId = setTimeout(() => {
      setTagSuggestions(prev => prev.length === 0 ? FALLBACK_TAGS : prev);
      setTagsLoading(false);
    }, 5000);

    fetchProductTags()
      .then(loaded => {
        clearTimeout(timeoutId);
        // If table is empty or missing — use fallback tags
        if (loaded.length === 0) {
          setTagSuggestions(FALLBACK_TAGS);
        } else {
          setTagSuggestions(loaded);
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        setTagSuggestions(FALLBACK_TAGS);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setTagsLoading(false);
      });

    return () => clearTimeout(timeoutId);
  }, []);

  const toggleTag = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleUploadCOA = () => {
    toast.loading("Загрузка сертификата...", { id: "coa" });
    setTimeout(() => {
      toast.success("Сертификат загружен", { id: "coa" });
    }, 1500);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл слишком большой. Максимум 5 МБ");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Пожалуйста, выберите изображение (PNG, JPG)");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    toast.success("Фото загружено");
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!title || !price || !user?.id) {
      toast.error("Пожалуйста, заполните название и цену");
      return;
    }
    toast.loading("Сохранение товара...", { id: "save" });
    
    try {
      // Маппинг новых категорий интерфейса в старые ID категорий, которые реально существуют в таблице categories базы данных Supabase.
      // Это нужно чтобы избежать ошибки: violates foreign key constraint "products_category_id_fkey"
      const categoryMapping: Record<string, string> = {
        'fruits_vegetables': 'fruits',
        'farm_meat': 'meat',
        'organic': 'vegetables', 
        'no_sugar': 'honey', 
        'no_gluten': 'bread',
        'no_lactose': 'dairy',
        'superfoods': 'nuts',
        'snacks': 'tea'
      };
      const dbCategory = categoryMapping[category] || category;

      const newProduct = await addProduct({
        name: title,
        price: parseInt(price) || 0,
        stock: parseInt(stock) || 0,
        composition: ingredients ? [ingredients] : [],
        description: description,
        category_id: dbCategory,
        seller_id: user.id,
        image_url: photoPreview || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1080',
        badges: tags.length > 0 ? tags : ['Проверенный состав'],
        is_active: false, // Not visible to clients until verification is complete
        rating: 0,
        review_count: 0,
      });

      // Log activity for the seller's feed
      await createSellerActivity(user.id, `Товар «${title}» отправлен на проверку`, 'product');

      toast.success("Товар сохранён и отправлен на проверку", { id: "save" });
      
      // Redirect to verification page so seller can see the review pipeline
      navigate(`/products/${newProduct.id}/verify`, { replace: true });
    } catch (e: any) {
      toast.error(`Ошибка сохранения: ${e.message}`, { id: "save" });
    }
  };

  const priceDisplay = formatNumber(price);
  const stockDisplay = formatNumber(stock);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = rawDigits(e.target.value);
    setPrice(digits);
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = rawDigits(e.target.value);
    setStock(digits);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-4 pt-10 border-b border-gray-100 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Добавить товар</h1>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Photo upload with real file picker */}
        <div className="space-y-2">
          <Label className="text-gray-900 font-semibold">Фотографии товара</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
          {photoPreview ? (
            <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-gray-200">
              <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={removePhoto}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handlePhotoClick}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 shadow-sm hover:bg-white transition-colors"
              >
                Заменить
              </button>
            </div>
          ) : (
            <div
              className="h-40 w-full rounded-2xl border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center gap-2 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={handlePhotoClick}
            >
              <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                <ImagePlus className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-emerald-600">Нажмите для загрузки</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, до 5 МБ</p>
              </div>
            </div>
          )}
        </div>

        <Card className="border-gray-100 shadow-sm overflow-hidden">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700">Название товара</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Органический зеленый чай" className="bg-gray-50/50 border-gray-200" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-gray-700">Категория</Label>
              <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="flex h-10 w-full rounded-md border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
                <option value="fruits_vegetables">Фрукты и овощи</option>
                <option value="farm_meat">Фермерское мясо и птица</option>
                <option value="organic">Органика</option>
                <option value="no_sugar">Без сахара</option>
                <option value="no_gluten">Без глютена</option>
                <option value="no_lactose">Без лактозы</option>
                <option value="superfoods">Суперфуды</option>
                <option value="snacks">Здоровые перекусы</option>
              </select>
            </div>

            {/* Formatted number inputs — integers only, with thousand separators */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-gray-700">Цена (₸)</Label>
                <div className="relative">
                  <Input
                    id="price"
                    value={priceDisplay}
                    onChange={handlePriceChange}
                    inputMode="numeric"
                    placeholder="0"
                    className="bg-gray-50/50 border-gray-200 pr-8 text-base font-semibold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">₸</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-gray-700">Остаток (шт)</Label>
                <div className="relative">
                  <Input
                    id="stock"
                    value={stockDisplay}
                    onChange={handleStockChange}
                    inputMode="numeric"
                    placeholder="0"
                    className="bg-gray-50/50 border-gray-200 pr-10 text-base font-semibold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">шт</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700">Описание продукта</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Опишите ваш товар..." className="bg-gray-50/50 border-gray-200 min-h-[100px]" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredients" className="text-gray-700 flex items-center gap-1.5">
                Состав <Info className="w-3.5 h-3.5 text-gray-400" />
              </Label>
              <Textarea id="ingredients" value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="100% органические ингредиенты..." className="bg-gray-50/50 border-gray-200 h-20" />
              <p className="text-[10px] text-gray-500">Платформа PureFood требует полного раскрытия состава.</p>
            </div>

            <div className="space-y-3">
              <Label className="text-gray-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-gray-400" />
                Теги продукта
              </Label>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 border border-emerald-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="w-3.5 h-3.5 rounded-full bg-emerald-200 hover:bg-emerald-300 flex items-center justify-center transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {tagsLoading ? (
                <p className="text-xs text-gray-400 text-center py-2">Загрузка тегов...</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {tagSuggestions.map(tag => {
                    const isSelected = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`h-9 rounded-xl text-xs font-medium border transition-all active:scale-[0.97] ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}{tag}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-[10px] text-gray-500">Выберите подходящие теги для вашего товара. Они помогут покупателям найти его быстрее.</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h3 className="font-bold text-gray-900">Контроль качества</h3>
            <Badge variant="success" className="bg-emerald-100 text-emerald-800 border-none px-2 py-0 h-5">Обязательно</Badge>
          </div>
          <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch" className="text-emerald-900">Номер партии</Label>
                <Input id="batch" placeholder="Например: BT-2023-11A" className="bg-white border-emerald-100 focus-visible:ring-emerald-600" />
              </div>

              <div className="space-y-2">
                <Label className="text-emerald-900">Сертификат анализа (COA)</Label>
                <div
                  className="flex items-center justify-center w-full h-14 px-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/50 transition-colors cursor-pointer"
                  onClick={handleUploadCOA}
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Загрузить PDF или скан</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button
          className="w-full h-12 text-base font-semibold shadow-md shadow-emerald-600/20 rounded-xl mt-2"
          onClick={handleSave}
        >
          Сохранить и отправить на проверку
        </Button>
      </div>

    </div>
  );
}
