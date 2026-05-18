import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Search, ChevronRight, Package, Truck, CheckCircle2, Clock } from "lucide-react";
import { Badge, Input, Card } from "../components/ui";
import { useUser } from "../context/UserContext";
import { supabase } from "../../lib/supabase";

const TABS = [
  { id: "all", label: "Все" },
  { id: "new", label: "Новые" },
  { id: "processing", label: "В работе" },
  { id: "shipped", label: "Отправлены" },
];

export function Orders() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("all");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrders = async () => {
    if (!user?.id) return;
    const { fetchSellerOrders } = await import('../../lib/api');
    const data = await fetchSellerOrders(user.id);
    setOrders(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [user?.id]);

  // Realtime subscription for new orders
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('seller-orders-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `seller_id=eq.${user.id}`,
      }, () => {
        loadOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const newOrdersCount = orders.filter(o => o.status === 'new').length;
  const filteredOrders = activeTab === "all" 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'new': return { label: 'Новый', color: 'bg-emerald-100 text-emerald-800', icon: Clock };
      case 'processing': return { label: 'Сборка', color: 'bg-amber-100 text-amber-800', icon: Package };
      case 'shipped': return { label: 'Отправлен', color: 'bg-blue-100 text-blue-800', icon: Truck };
      default: return { label: status, color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 };
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-4 pt-10 border-b border-gray-100 space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Заказы</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Поиск по номеру заказа или клиенту..." 
            className="pl-9 bg-gray-50/50 border-gray-200"
          />
        </div>

        {/* Custom Tabs implementation */}
        <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? "bg-gray-900 text-white shadow-sm" 
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              {tab.id === 'new' && newOrdersCount > 0 && <span className="ml-1.5 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{newOrdersCount}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3 pb-24">
        {filteredOrders.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Package className="w-14 h-14 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium text-gray-500">Нет заказов</p>
            <p className="text-xs text-gray-400 mt-1">
              {activeTab === 'all' ? 'Заказы от клиентов появятся здесь' : `Нет заказов со статусом «${TABS.find(t => t.id === activeTab)?.label}»`}
            </p>
          </div>
        )}
        {filteredOrders.map(order => {
          const statusInfo = getStatusDisplay(order.status);
          const StatusIcon = statusInfo.icon;
          
          return (
            <Link key={order.id} to={`/orders/${order.id}`} className="block">
              <Card className="hover:border-emerald-200 transition-colors cursor-pointer border-gray-100 shadow-sm">
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="font-bold text-gray-900">#{order.id}</span>
                      <p className="text-sm text-gray-600 font-medium">{order.client}</p>
                    </div>
                    <Badge variant="default" className={`${statusInfo.color} border-none flex items-center gap-1 px-2 py-0.5`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                  
                  <div className="border-t border-gray-50 pt-3 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-3 text-gray-500">
                      <span>{order.date}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>{order.items} товара</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-gray-900">
                      {order.total}
                      <ChevronRight className="w-4 h-4 text-gray-400 ml-1" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
