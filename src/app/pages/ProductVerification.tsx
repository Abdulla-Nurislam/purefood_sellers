import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ShieldCheck, FileSearch, FlaskConical, CheckCircle2, Package, Sparkles } from "lucide-react";
import { Button, Card, CardContent, Badge } from "../components/ui";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";
import { updateProduct, createSellerActivity } from "../../lib/api";
import { supabase } from "../../lib/supabase";

const VERIFICATION_STEPS = [
  {
    id: 0,
    title: "Товар отправлен на проверку",
    description: "Модерация PureFood получила ваш товар",
    icon: Package,
    duration: "~1 мин",
  },
  {
    id: 1,
    title: "Проверка состава",
    description: "Анализ ингредиентов и соответствие стандартам безопасности",
    icon: FlaskConical,
    duration: "~2 мин",
  },
  {
    id: 2,
    title: "Проверка документов",
    description: "Верификация сертификатов, лабораторных заключений и маркировки",
    icon: FileSearch,
    duration: "~1 мин",
  },
  {
    id: 3,
    title: "Проверка пройдена",
    description: "Товар полностью соответствует стандартам PureFood",
    icon: ShieldCheck,
    duration: "",
  },
  {
    id: 4,
    title: "Доступен для клиентов",
    description: "Товар опубликован и виден покупателям в приложении PureFood",
    icon: Sparkles,
    duration: "",
  },
];

export function ProductVerification() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const [currentStep, setCurrentStep] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [productName, setProductName] = useState("Товар");
  const [sliderValue, setSliderValue] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [stepLocked, setStepLocked] = useState(false);

  // Load product info
  useEffect(() => {
    if (!id) return;
    
    supabase.from('products').select('name, is_active').eq('id', id).single().then(({ data }) => {
      if (data) {
        setProductName(data.name || 'Товар');
        // If already published
        if (data.is_active === true) {
          setCurrentStep(4);
          setSliderValue(4);
          setMaxReached(4);
          setIsPublished(true);
        }
      }
    });
  }, [id]);

  // Auto-advance simulation with slider
  useEffect(() => {
    if (sliderValue > maxReached && sliderValue > 0 && !stepLocked) {
      setStepLocked(true);
      // Simulate verification step taking time
      const timer = setTimeout(() => {
        setMaxReached(sliderValue);
        setCurrentStep(sliderValue);
        setStepLocked(false);

        // Log activity for each step
        if (user?.id && id) {
          const step = VERIFICATION_STEPS[sliderValue];
          createSellerActivity(user.id, `${step.title}: «${productName}»`, 'product');
        }
      }, 800);
      return () => clearTimeout(timer);
    } else if (sliderValue <= maxReached) {
      setCurrentStep(sliderValue);
    }
  }, [sliderValue]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    // Can only go forward one step at a time, or backward to any visited step
    if (val <= maxReached + 1 && !stepLocked) {
      setSliderValue(val);
    }
  };

  const handlePublish = async () => {
    if (!id || !user?.id) return;

    setIsPublishing(true);

    try {
      await updateProduct(id, { is_active: true });
      await createSellerActivity(user.id, `Товар «${productName}» опубликован и доступен клиентам`, 'product');

      setIsPublished(true);
      toast.success("Товар опубликован! Теперь его видят клиенты в приложении PureFood 🎉", {
        duration: 5000,
      });
    } catch (err) {
      console.error('Error publishing product:', err);
      toast.error("Не удалось опубликовать товар");
    }

    setIsPublishing(false);
  };

  const progressPercent = (currentStep / (VERIFICATION_STEPS.length - 1)) * 100;
  const canPublish = currentStep === VERIFICATION_STEPS.length - 1 && !isPublished;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-4 pt-10 border-b border-gray-100 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-gray-900">Путь товара</h1>
          <p className="text-xs text-gray-500 mt-0.5">{productName}</p>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-32">
        {/* Progress header */}
        <Card className={`shadow-sm overflow-hidden border-0 ${isPublished ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white'}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium opacity-70">Статус верификации</p>
              <Badge className={`border-0 ${isPublished ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {isPublished ? '✓ Опубликован' : `Шаг ${currentStep + 1} из ${VERIFICATION_STEPS.length}`}
              </Badge>
            </div>
            <h2 className="text-xl font-bold mb-2">{VERIFICATION_STEPS[currentStep].title}</h2>
            <p className="text-sm opacity-70">{VERIFICATION_STEPS[currentStep].description}</p>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Verification Steps */}
        <div className="space-y-0">
          {VERIFICATION_STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === currentStep;
            const isDone = index < currentStep || isPublished;
            const isFuture = index > currentStep && !isPublished;

            return (
              <div key={step.id} className="flex gap-4">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isDone ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' :
                    isActive ? 'bg-emerald-100 text-emerald-600 ring-4 ring-emerald-100' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  {index < VERIFICATION_STEPS.length - 1 && (
                    <div className={`w-0.5 flex-1 min-h-[40px] transition-colors duration-300 ${
                      isDone ? 'bg-emerald-400' : 'bg-gray-200'
                    }`} />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-6 pt-1.5 transition-opacity duration-300 ${isFuture ? 'opacity-40' : ''}`}>
                  <p className={`font-semibold text-sm ${
                    isActive ? 'text-emerald-700' : isDone ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  {step.duration && isFuture && (
                    <p className="text-xs text-gray-400 mt-1">⏱ {step.duration}</p>
                  )}
                  {isActive && stepLocked && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-emerald-600 font-medium">Проверяется...</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Slider */}
        {!isPublished && (
          <Card className="border-emerald-200 bg-emerald-50/30 shadow-sm overflow-hidden">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-emerald-900">Интерактивная демонстрация</p>
                <p className="text-xs text-emerald-600 font-medium">Потяните ползунок →</p>
              </div>

              <input
                type="range"
                min="0"
                max={VERIFICATION_STEPS.length - 1}
                value={sliderValue}
                onChange={handleSliderChange}
                disabled={stepLocked}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-600 disabled:opacity-50 disabled:cursor-wait"
                style={{
                  background: `linear-gradient(to right, #059669 0%, #059669 ${(sliderValue / (VERIFICATION_STEPS.length - 1)) * 100}%, #e5e7eb ${(sliderValue / (VERIFICATION_STEPS.length - 1)) * 100}%, #e5e7eb 100%)`
                }}
              />

              <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1">
                <span>Начало</span>
                <span>Состав</span>
                <span>Документы</span>
                <span>Проверен</span>
                <span>Доступен</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md border-t border-gray-100 p-4 pb-8">
        {isPublished ? (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold text-sm">Товар доступен клиентам!</span>
            </div>
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-gray-200 text-gray-700"
              onClick={() => navigate('/products')}
            >
              Вернуться к товарам
            </Button>
          </div>
        ) : canPublish ? (
          <Button
            className="w-full h-12 text-base font-semibold shadow-md shadow-emerald-600/20 rounded-xl"
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Публикуется...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Подтвердить и опубликовать
              </>
            )}
          </Button>
        ) : (
          <div className="text-center">
            <p className="text-xs text-gray-400">Переместите ползунок до конца, чтобы опубликовать товар</p>
          </div>
        )}
      </div>
    </div>
  );
}
