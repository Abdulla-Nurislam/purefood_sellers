import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ShoppingCart, CheckCircle, TrendingUp, Package, Star, Inbox } from "lucide-react";
import { Button, Card } from "../components/ui";
import { useUser } from "../context/UserContext";
import type { SellerActivity } from "../../lib/api";

function getActivityIcon(type: string) {
  switch (type) {
    case 'order': return { icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-50' };
    case 'product': return { icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' };
    case 'payout': return { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' };
    case 'review': return { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' };
    case 'delivery': return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' };
    default: return { icon: Package, color: 'text-gray-500', bg: 'bg-gray-50' };
  }
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч назад`;
  if (diffDays === 1) return 'Вчера';
  if (diffDays < 7) return `${diffDays} дня назад`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function ActivityList() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [activities, setActivities] = useState<SellerActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    import('../../lib/api').then(({ fetchSellerActivities }) => {
      fetchSellerActivities(user.id!).then(data => {
        setActivities(data);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    });
  }, [user?.id]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-4 pt-10 border-b border-gray-100 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 -ml-2 text-gray-600 hover:bg-gray-100/50 rounded-full w-10 h-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Все действия</h1>
      </div>

      <div className="p-4 pb-24">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-400 mt-3">Загрузка...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Inbox className="w-14 h-14 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-gray-500">Здесь пока пусто</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[240px] mx-auto">
              Ваши действия и новые заказы будут отображаться тут в реальном времени
            </p>
          </div>
        ) : (
          <Card className="border-gray-100 shadow-sm">
            <div className="divide-y divide-gray-50">
              {activities.map((activity) => {
                const { icon: Icon, color, bg } = getActivityIcon(activity.type);
                return (
                  <div key={activity.id} className="flex items-start gap-4 p-4 hover:bg-gray-50/50 transition-colors">
                    <div className={`p-2 rounded-full ${bg}`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-gray-900 leading-none">{activity.title}</p>
                      <p className="text-xs text-gray-500">{formatRelativeTime(activity.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
