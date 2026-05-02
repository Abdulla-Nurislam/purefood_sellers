import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowDownToLine, ArrowUpRight, TrendingUp, Calendar, CreditCard, ArrowLeft } from "lucide-react";
import { Button, Card, CardContent, Badge } from "../components/ui";
import { toast } from "sonner";

const ALL_PAYMENTS = [
  { id: "TRX-1029", date: "Сегодня, 10:00", amount: "+ ₽45,000", status: "Completed", type: "payout" },
  { id: "TRX-1028", date: "12 Октября", amount: "+ ₽12,500", status: "Completed", type: "payout" },
  { id: "TRX-1027", date: "10 Октября", amount: "- ₽1,250", status: "Completed", type: "fee" },
  { id: "TRX-1026", date: "8 Октября", amount: "+ ₽8,200", status: "Completed", type: "payout" },
  { id: "TRX-1025", date: "5 Октября", amount: "- ₽950", status: "Completed", type: "fee" },
  { id: "TRX-1024", date: "1 Октября", amount: "+ ₽22,000", status: "Completed", type: "payout" },
];

export function Payments() {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(3);

  const handleWithdraw = () => {
    toast.success("Заявка на вывод ₽124,500 отправлена. Средства поступят в течение 1-3 рабочих дней.");
  };

  const handleLoadMore = () => {
    if (visibleCount >= ALL_PAYMENTS.length) {
      toast.info("Все операции загружены");
    } else {
      setVisibleCount((prev) => Math.min(prev + 3, ALL_PAYMENTS.length));
      toast.success("Загружено больше операций");
    }
  };

  const payments = ALL_PAYMENTS.slice(0, visibleCount);

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
                <h2 className="text-3xl font-bold tracking-tight">₽124,500<span className="text-gray-400 text-lg">.00</span></h2>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20"
                onClick={handleWithdraw}
              >
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Вывести средства
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-gray-900 text-base">История операций</h3>
            <Button variant="link" className="text-xs text-gray-500 hover:text-gray-900 p-0 h-auto" onClick={() => toast.info("Фильтры в разработке")}>Фильтр</Button>
          </div>

          <Card className="border-gray-100 shadow-sm">
            <div className="divide-y divide-gray-50">
              {payments.map((payment) => (
                <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      payment.type === "payout" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                    }`}>
                      {payment.type === "payout" ? <TrendingUp className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{payment.type === "payout" ? "Выплата на счет" : "Комиссия платформы"}</p>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {payment.date}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-sm ${payment.type === "payout" ? "text-emerald-600" : "text-gray-900"}`}>
                      {payment.amount}
                    </p>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600 font-medium text-[10px] px-1.5 py-0 mt-1 border-0">
                      Успешно
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full text-xs text-emerald-600 font-medium hover:bg-emerald-50 hover:text-emerald-700 py-3 rounded-t-none"
              onClick={handleLoadMore}
            >
              {visibleCount >= ALL_PAYMENTS.length ? "Все операции загружены" : "Загрузить больше операций"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
