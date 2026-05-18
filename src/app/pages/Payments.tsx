import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowDownToLine, ArrowUpRight, TrendingUp, Calendar, CreditCard, ArrowLeft, Inbox, Filter, X, AlertCircle } from "lucide-react";
import { Button, Card, CardContent, Badge } from "../components/ui";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";

const FILTER_OPTIONS = [
  { id: "all", label: "Все" },
  { id: "payout", label: "Выплаты" },
  { id: "fee", label: "Комиссии" },
];

export function Payments() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [balance, setBalance] = useState(0);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    import('../../lib/api').then(({ fetchTotalSales, fetchSellerOrders }) => {
      Promise.all([
        fetchTotalSales(user.id),
        fetchSellerOrders(user.id),
      ]).then(([total, orders]) => {
        setBalance(total);
        // Convert orders into payment-like entries
        const paymentEntries = orders
          .filter((o: any) => ['delivered', 'shipped', 'processing'].includes(o.status))
          .map((o: any, idx: number) => ({
            id: `TRX-${idx + 1}`,
            date: o.date,
            amount: o.total,
            status: 'Completed',
            type: 'payout',
            orderId: o.id,
          }));
        setPayments(paymentEntries);
        setIsLoading(false);
      }).catch(() => setIsLoading(false));
    });
  }, [user?.id]);

  const handleWithdraw = () => {
    if (balance <= 0) {
      toast.error("Нет доступных средств для вывода. Сумма продаж составляет ₸0.", {
        duration: 4000,
        icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      });
      return;
    }
    setShowWithdrawConfirm(true);
  };

  const confirmWithdraw = () => {
    setShowWithdrawConfirm(false);
    toast.success(`Заявка на вывод ₸${balance.toLocaleString()} отправлена. Средства поступят в течение 1-3 рабочих дней.`);
  };

  const handleLoadMore = () => {
    if (visibleCount >= filteredPayments.length) {
      toast.info("Все операции загружены");
    } else {
      setVisibleCount((prev) => Math.min(prev + 5, filteredPayments.length));
      toast.success("Загружено больше операций");
    }
  };

  const filteredPayments = activeFilter === "all" 
    ? payments 
    : payments.filter(p => p.type === activeFilter);

  const visiblePayments = filteredPayments.slice(0, visibleCount);

  return (
    <div className="flex flex-col min-h-full bg-gray-50/50">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-4 pt-10 border-b border-gray-100 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 -ml-2 text-gray-600 hover:bg-gray-100/50 rounded-full w-10 h-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Выплаты</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        <Card className="bg-gray-900 text-white shadow-lg overflow-hidden relative border-0">
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500 rounded-bl-full opacity-20 z-0"></div>
          <div className="absolute left-10 bottom-0 w-24 h-24 bg-blue-500 rounded-t-full opacity-20 z-0 blur-2xl"></div>

          <CardContent className="p-6 relative z-10 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-400">Доступно к выводу</p>
                <h2 className="text-3xl font-bold tracking-tight">₸{balance.toLocaleString()}<span className="text-gray-400 text-lg">.00</span></h2>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                className={`flex-1 border-0 shadow-lg transition-all ${
                  balance > 0 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed shadow-none'
                }`}
                onClick={handleWithdraw}
              >
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                {balance > 0 ? 'Вывести средства' : 'Нет средств для вывода'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-gray-900 text-base">История операций</h3>
            <Button 
              variant="link" 
              className={`text-xs p-0 h-auto ${activeFilter !== 'all' ? 'text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
              onClick={() => setShowFilterSheet(true)}
            >
              <Filter className="w-3 h-3 mr-1" />
              {activeFilter === 'all' ? 'Фильтр' : FILTER_OPTIONS.find(f => f.id === activeFilter)?.label}
            </Button>
          </div>

          {/* Active filter pill */}
          {activeFilter !== 'all' && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                {FILTER_OPTIONS.find(f => f.id === activeFilter)?.label}
                <button onClick={() => setActiveFilter('all')} className="hover:text-emerald-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
              <span className="text-xs text-gray-400">{filteredPayments.length} записей</span>
            </div>
          )}

          <Card className="border-gray-100 shadow-sm">
            {visiblePayments.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium text-gray-500">
                  {activeFilter !== 'all' ? 'Нет записей по данному фильтру' : 'Пока нет операций'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {activeFilter !== 'all' ? 'Попробуйте другой фильтр' : 'История появится после первого заказа'}
                </p>
              </div>
            ) : (
              <>
              <div className="divide-y divide-gray-50">
                {visiblePayments.map((payment) => (
                  <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        payment.type === "payout" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                      }`}>
                        {payment.type === "payout" ? <TrendingUp className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Заказ #{payment.orderId}</p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {payment.date}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-emerald-600">
                        {payment.amount}
                      </p>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-medium text-[10px] px-1.5 py-0 mt-1 border-0">
                        Успешно
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
              {filteredPayments.length > visibleCount && (
                <Button
                  variant="ghost"
                  className="w-full text-xs text-emerald-600 font-medium hover:bg-emerald-50 hover:text-emerald-700 py-3 rounded-t-none"
                  onClick={handleLoadMore}
                >
                  Загрузить больше операций
                </Button>
              )}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Filter Bottom Sheet */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowFilterSheet(false)}>
          <div className="w-full max-w-[430px] bg-white rounded-t-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 pb-2 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg">Фильтр операций</h3>
              <button onClick={() => setShowFilterSheet(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2 pb-10">
              {FILTER_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setActiveFilter(opt.id); setShowFilterSheet(false); setVisibleCount(5); }}
                  className={`w-full p-4 rounded-2xl text-left text-sm font-medium transition-colors ${
                    activeFilter === opt.id
                      ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200'
                      : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Confirmation Modal */}
      {showWithdrawConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6" onClick={() => setShowWithdrawConfirm(false)}>
          <div className="w-full max-w-[340px] bg-white rounded-3xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowDownToLine className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-center text-lg mb-2">Вывод средств</h3>
            <p className="text-gray-500 text-sm text-center mb-1">Вы хотите вывести</p>
            <p className="text-2xl font-bold text-emerald-600 text-center mb-4">₸{balance.toLocaleString()}</p>
            <p className="text-xs text-gray-400 text-center mb-6">Средства поступят в течение 1-3 рабочих дней на привязанный счёт</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWithdrawConfirm(false)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={confirmWithdraw}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                Вывести
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
