import { useNavigate } from "react-router";
import { ArrowLeft, ShoppingCart, CheckCircle, TrendingUp, Package, Star } from "lucide-react";
import { Button, Card } from "../components/ui";

const ACTIVITIES = [
  { id: 1, title: 'Новый заказ #4021', time: '10 мин назад', icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 2, title: 'Товар "Органическая Гречка" одобрен', time: '2 часа назад', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 3, title: 'Выплата ₸45,000 обработана', time: 'Вчера', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 4, title: 'Новый заказ #4020', time: 'Вчера', icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-50' },
  { id: 5, title: 'Товар "Сырой мёд" на модерации', time: '2 дня назад', icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 6, title: 'Новый отзыв на "Киноа премиум"', time: '3 дня назад', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 7, title: 'Заказ #4018 доставлен', time: '4 дня назад', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
];

export function ActivityList() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-4 pt-10 border-b border-gray-100 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 -ml-2 text-gray-600 hover:bg-gray-100/50 rounded-full w-10 h-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Все действия</h1>
      </div>

      <div className="p-4 pb-24">
        <Card className="border-gray-100 shadow-sm">
          <div className="divide-y divide-gray-50">
            {ACTIVITIES.map((activity) => (
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
