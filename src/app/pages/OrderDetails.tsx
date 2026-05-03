import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, MapPin, Phone, Package, CheckCircle2, Truck, Copy } from "lucide-react";
import { Button, Card, CardContent, Badge } from "../components/ui";
import { toast } from "sonner";

export function OrderDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentStep, setCurrentStep] = useState(1);

  const order = {
    id: id || "1234",
    client: "Айгерим Оспанова",
    phone: "+7 (777) 123-45-67",
    address: "г. Алматы, пр. Абая, д. 45, кв. 12",
    date: "14 Октября 2023, 14:30",
    total: "₸1,250",
    status: "new",
    items: [
      { id: "1", name: "Органические овсяные хлопья", qty: 2, price: "₸350" },
      { id: "2", name: "Киноа премиум (белая)", qty: 1, price: "₸550" },
    ],
  };

  const stepLabels = ["Новый", "В сборке", "В пути", "Доставлен"];

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(order.address).then(() => {
      toast.success("Адрес скопирован в буфер обмена");
    }).catch(() => {
      toast.success("Адрес скопирован");
    });
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      toast.success(`Статус заказа обновлён: ${stepLabels[currentStep]}`);
    }
  };

  const getButtonLabel = () => {
    switch (currentStep) {
      case 1: return "Начать сборку заказа";
      case 2: return "Отправить заказ";
      case 3: return "Подтвердить доставку";
      default: return "Заказ завершён";
    }
  };

  const getStatusLabel = () => stepLabels[currentStep - 1];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-4 pt-10 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 -ml-2 text-gray-600 hover:bg-gray-100/50 rounded-full w-10 h-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Заказ #{order.id}</h1>
        </div>
        <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold px-2.5 py-1">{getStatusLabel()}</Badge>
      </div>

      <div className="p-4 space-y-5 pb-24">
        <Card className="border-gray-100 shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-[10%] top-4 w-[80%] h-0.5 bg-gray-100 -z-10"></div>
              <div
                className="absolute left-[10%] top-4 h-0.5 bg-emerald-500 -z-10 transition-all duration-500"
                style={{ width: `${Math.min((currentStep - 1) * 26.6, 80)}%` }}
              ></div>

              {[
                { icon: Package, label: "Новый" },
                { icon: Truck, label: "В сборке" },
                { icon: Truck, label: "В пути" },
                { icon: CheckCircle2, label: "Доставлен" },
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${idx + 1 <= currentStep ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"} ring-4 ring-white`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[10px] font-medium ${idx + 1 <= currentStep ? "text-emerald-700" : "text-gray-500"}`}>{step.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <h3 className="font-semibold text-gray-900 text-sm">Покупатель</h3>
            <span className="text-xs text-gray-500">{order.date}</span>
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold text-lg">А</div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{order.client}</p>
                <div className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Phone className="w-3 h-3 text-emerald-600" /> {order.phone}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-50 flex gap-2 items-start">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 leading-snug">{order.address}</p>
                <p className="text-xs text-gray-500 mt-1">Доставка курьером</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-emerald-600" onClick={handleCopyAddress}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <h3 className="font-semibold text-gray-900 text-sm">Состав заказа</h3>
            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{order.items.length} поз.</span>
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-md shrink-0 flex items-center justify-center border border-gray-200">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{item.qty} шт x {item.price}</span>
                      <span className="font-semibold text-gray-900 text-sm">{item.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-emerald-50/30 border-t border-emerald-100/50 rounded-b-xl flex justify-between items-center">
              <span className="font-medium text-emerald-900 text-sm">Итого к оплате</span>
              <span className="font-bold text-emerald-700 text-lg">{order.total}</span>
            </div>
          </CardContent>
        </Card>

        {currentStep < 4 ? (
          <Button
            className="w-full h-12 text-base font-semibold shadow-md shadow-emerald-600/20 rounded-xl mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleNextStep}
          >
            <Truck className="w-5 h-5 mr-2" />
            {getButtonLabel()}
          </Button>
        ) : (
          <div className="text-center py-4 text-emerald-600 font-semibold text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Заказ успешно завершён
          </div>
        )}
      </div>
    </div>
  );
}
