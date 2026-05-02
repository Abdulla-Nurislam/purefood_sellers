import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ImagePlus, UploadCloud, Info } from "lucide-react";
import { Card, CardContent, Button, Input, Label, Textarea, Badge } from "../components/ui";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";

export function ProductForm() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("dairy");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");

  const handleUploadCOA = () => {
    toast.loading("Загрузка сертификата...", { id: "coa" });
    setTimeout(() => {
      toast.success("Сертификат загружен", { id: "coa" });
    }, 1500);
  };

  const handleUploadPhoto = () => {
    toast.loading("Загрузка фото...", { id: "photo" });
    setTimeout(() => {
      toast.success("Фото загружено", { id: "photo" });
    }, 1500);
  };

  const handleSave = async () => {
    if (!title || !price || !user?.id) {
      toast.error("Пожалуйста, заполните название и цену");
      return;
    }
    toast.loading("Сохранение товара...", { id: "save" });
    
    const { addProduct } = await import('../../lib/api');
    await addProduct({
      name: title,
      price: parseInt(price) || 0,
      description: description,
      category_id: category,
      seller_id: user.id,
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1080', // generic placeholder
      badges: ['Проверенный состав'],
    });

    toast.success("Товар сохранён и отправлен на проверку", { id: "save" });
    navigate(-1);
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
        <div className="space-y-2">
          <Label className="text-gray-900 font-semibold">Фотографии товара</Label>
          <div
            className="h-40 w-full rounded-2xl border-2 border-dashed border-gray-200 bg-white flex flex-col items-center justify-center gap-2 hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={handleUploadPhoto}
          >
            <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
              <ImagePlus className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-emerald-600">Нажмите для загрузки</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, до 5 МБ</p>
            </div>
          </div>
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
                <option value="dairy">Молочные</option>
                <option value="honey">Мёд</option>
                <option value="bread">Хлеб</option>
                <option value="fruits">Фрукты</option>
                <option value="nuts">Орехи</option>
                <option value="tea">Чай</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-gray-700">Цена (₽)</Label>
                <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} type="number" placeholder="0.00" className="bg-gray-50/50 border-gray-200" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-gray-700">Остаток (шт)</Label>
                <Input id="stock" value={stock} onChange={(e) => setStock(e.target.value)} type="number" placeholder="0" className="bg-gray-50/50 border-gray-200" />
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
