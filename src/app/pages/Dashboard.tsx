import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, Badge, Button } from "../components/ui";
import { ShieldCheck, TrendingUp, Package, Clock, ArrowRight, ShoppingCart, CheckCircle } from "lucide-react";
import { useUser } from "../context/UserContext";

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [stats, setStats] = useState({ totalProducts: 48, newOrders: 12, totalSales: 124500, verificationStatus: 100 });

  useEffect(() => {
    if (!user?.id) return;
    import('../../lib/api').then(({ fetchDashboardStats }) => {
      fetchDashboardStats(user.id).then(data => {
        setStats(prev => ({
          ...prev,
          totalProducts: data.totalProducts ?? prev.totalProducts,
          newOrders: data.newOrders ?? prev.newOrders,
        }));
      }).catch(() => {});
    });
  }, []);

  const displayName = user?.companyName
    ? user.companyName
    : user?.authMethod === "google"
    ? "Пользователь Google"
    : "Продавец";

  return (
    <div className="flex flex-col gap-6 p-4 pt-10 pb-8 min-h-full bg-gray-50/50">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Добро пожаловать, {displayName}</h1>
        <p className="text-sm text-gray-500">Ваша сводка на сегодня</p>
      </div>

      <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm overflow-hidden relative">
        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-100 rounded-bl-full opacity-50 z-0"></div>
        <CardContent className="p-5 flex items-start justify-between relative z-10">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <h3 className="font-semibold text-emerald-900">Центр верификации</h3>
            </div>
            <p className="text-sm text-emerald-700/80 leading-snug max-w-[240px]">
              Вы подтверждены как честный поставщик. Значок отображается в профиле.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant="success" className="bg-emerald-100 text-emerald-800">Значок активен</Badge>
              <Button variant="link" className="h-auto p-0 text-emerald-700 text-xs" onClick={() => navigate("/verification-info")}>
                Подробнее <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-sm border-gray-100 cursor-pointer hover:border-emerald-200 transition-colors" onClick={() => navigate("/payments")}>
          <CardContent className="p-4 flex flex-col items-start gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Сумма продаж</p>
              <p className="text-lg font-bold text-gray-900">₸124,500</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-gray-100 cursor-pointer hover:border-emerald-200 transition-colors" onClick={() => navigate("/orders")}>
          <CardContent className="p-4 flex flex-col items-start gap-3">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Новые заказы</p>
              <p className="text-lg font-bold text-gray-900">{stats.newOrders}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 cursor-pointer hover:border-emerald-200 transition-colors" onClick={() => navigate("/products")}>
          <CardContent className="p-4 flex flex-col items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Активные товары</p>
              <p className="text-lg font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100 cursor-pointer hover:border-emerald-200 transition-colors" onClick={() => navigate("/verification-info")}>
          <CardContent className="p-4 flex flex-col items-start gap-3">
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-500">Статус верификации</p>
              <p className="text-lg font-bold text-gray-900">100%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Последние действия</h2>
          <Button variant="ghost" size="sm" className="text-gray-500 text-xs" onClick={() => navigate("/activity")}>Показать все</Button>
        </div>
        
        <Card className="border-gray-100 shadow-sm">
          <div className="divide-y divide-gray-50">
            {[
              { id: 1, title: 'Новый заказ #4021', time: '10 мин назад', icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-50' },
              { id: 2, title: 'Товар "Органическая Гречка" одобрен', time: '2 часа назад', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { id: 3, title: 'Выплата ₸45,000 обработана', time: 'Вчера', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
            ].map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                <div className={`p-2 rounded-full ${activity.bg}`}>
                  <activity.icon className={`w-4 h-4 ${activity.color}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-gray-900 leading-none">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}