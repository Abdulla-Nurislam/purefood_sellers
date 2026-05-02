import { useState, useRef } from "react";
import { useNavigate, Navigate } from "react-router";
import { Phone, ArrowRight, ChevronLeft, Building, User, ShieldCheck } from "lucide-react";
import { useUser } from "../context/UserContext";

type AuthStep = "main" | "phone" | "sms" | "profile";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const CATEGORIES = [
  "Злаки и крупы",
  "Напитки",
  "Суперфуды",
  "Сладости и снеки",
  "Молочная продукция",
  "Масла и соусы",
];

export function Auth() {
  const navigate = useNavigate();
  const { setUser, isAuthenticated } = useUser();

  const [step, setStep] = useState<AuthStep>("main");
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState(["", "", "", ""]);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isNewUser, setIsNewUser] = useState(true);
  const [smsError, setSmsError] = useState(false);
  const [loginError, setLoginError] = useState("");

  const smsRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 1) return digits.startsWith("7") ? "+7" : digits ? "+7" : "";
    const local = digits.startsWith("7") ? digits.slice(1) : digits;
    let formatted = "+7";
    if (local.length > 0) formatted += " (" + local.slice(0, 3);
    if (local.length >= 3) formatted += ") " + local.slice(3, 6);
    if (local.length >= 6) formatted += "-" + local.slice(6, 8);
    if (local.length >= 8) formatted += "-" + local.slice(8, 10);
    return formatted;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setPhone(formatPhone(raw));
  };

  const handleSmsInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...smsCode];
    newCode[index] = value.slice(-1);
    setSmsCode(newCode);
    setSmsError(false);
    if (value && index < 3) {
      smsRefs[index + 1].current?.focus();
    }
  };

  const handleSmsKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !smsCode[index] && index > 0) {
      smsRefs[index - 1].current?.focus();
    }
  };

  const handleSendSms = () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 11) return;
    setStep("sms");
  };

  const handleVerifySms = async () => {
    const code = smsCode.join("");
    if (code === "1234") {
      if (isNewUser) {
        // Registration flow — always show profile form
        setStep("profile");
      } else {
        // Login flow — look up existing account by phone
        try {
          const { getSellerByPhone } = await import('../../lib/api');
          const seller = await getSellerByPhone(phone);
          if (seller && seller.company_name) {
            // Found existing seller with profile data — log in
            setUser({
              id: seller.id,
              authMethod: "phone",
              phone: seller.phone || phone,
              companyName: seller.company_name,
              contactName: seller.contact_name,
              categories: seller.categories || [],
            });
            navigate("/");
          } else if (seller && seller.id) {
            // Auth user exists but no profile in sellers table — go to profile step
            setUser({
              id: seller.id,
              authMethod: "phone",
              phone: phone,
              companyName: "",
              contactName: "",
              categories: [],
            });
            setStep("profile");
          } else {
            // No account found — show error, don't create new account
            setSmsError(true);
            setSmsCode(["", "", "", ""]);
            smsRefs[0].current?.focus();
            setLoginError("Аккаунт с этим номером не найден. Зарегистрируйтесь.");
          }
        } catch (err) {
          console.error('Login error:', err);
          setSmsError(true);
          setSmsCode(["", "", "", ""]);
          smsRefs[0].current?.focus();
          setLoginError("Ошибка при входе. Попробуйте снова.");
        }
      }
    } else {
      setSmsError(true);
      setSmsCode(["", "", "", ""]);
      smsRefs[0].current?.focus();
      setLoginError("");
    }
  };

  const handleGoogleLogin = () => {
    setUser({
      authMethod: "google",
      companyName: "Пользователь Google",
      contactName: "Пользователь Google",
      categories: [],
    });
    navigate("/");
  };

  const handleFinishProfile = async () => {
    const { registerSeller, getSellerByPhone } = await import('../../lib/api');
    
    // If user already has an ID (from login flow detecting missing profile), 
    // just update the sellers table instead of re-registering
    let sellerId = (user as any)?.id;
    
    if (sellerId) {
      // User exists in Auth but needs profile — upsert into sellers table
      const { supabase } = await import('../../lib/supabase');
      const { data: upsertData, error: upsertError } = await supabase
        .from('sellers')
        .upsert({
          id: sellerId,
          phone,
          company_name: companyName,
          contact_name: contactName,
          categories: selectedCategories,
        })
        .select()
        .single();
      
      if (upsertError) {
        console.warn('Could not upsert seller profile:', upsertError);
      }
      
      setUser({
        id: sellerId,
        authMethod: "phone",
        phone,
        companyName,
        contactName,
        categories: selectedCategories,
      });
    } else {
      // Fresh registration
      const newSeller = await registerSeller({
        phone,
        company_name: companyName,
        contact_name: contactName,
        categories: selectedCategories,
      });

      setUser({
        id: newSeller?.id,
        authMethod: "phone",
        phone,
        companyName,
        contactName,
        categories: selectedCategories,
      });
    }
    
    navigate("/");
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  if (step === "main") {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen">
        <div className="w-full max-w-[430px] bg-white min-h-screen flex flex-col shadow-xl">
          <div className="flex flex-col items-center pt-16 pb-8 px-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-center mb-2 text-2xl font-bold text-gray-900">PureFood Sellers</h1>
            <p className="text-gray-500 text-sm text-center">Платформа для проверенных поставщиков здорового питания</p>
          </div>

          <div className="flex-1 px-6 space-y-4">
            <button
              onClick={() => { setIsNewUser(true); setStep("phone"); }}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-700 transition-colors"
            >
              <Phone className="w-5 h-5" />
              <span>Зарегистрировать магазин</span>
            </button>

            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-gray-200 py-4 rounded-2xl flex items-center justify-center gap-3 text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <GoogleIcon />
              <span>Войти через Google</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-gray-400 text-sm">или</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              onClick={() => { setIsNewUser(false); setStep("phone"); }}
              className="w-full border border-emerald-600 text-emerald-600 py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors"
            >
              <span>Уже есть аккаунт? Войти</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 px-8 pb-10 mt-6">
            Регистрируясь, вы соглашаетесь с{" "}
            <span className="text-emerald-600">Условиями использования</span>{" "}
            и{" "}
            <span className="text-emerald-600">Политикой конфиденциальности</span>
          </p>
        </div>
      </div>
    );
  }

  if (step === "phone") {
    const digits = phone.replace(/\D/g, "");
    const isValid = digits.length >= 11;
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen">
        <div className="w-full max-w-[430px] bg-white min-h-screen flex flex-col shadow-xl">
          <div className="px-4 pt-6">
            <button onClick={() => setStep("main")} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center px-6 gap-6">
            <div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">{isNewUser ? "Регистрация магазина" : "Вход"}</h2>
              <p className="text-gray-500 text-sm">Введите номер телефона. Мы отправим вам СМС-код для подтверждения.</p>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-gray-500">Номер телефона</label>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (___) ___-__-__"
                  type="tel"
                  className="flex-1 bg-transparent outline-none"
                  autoFocus
                />
              </div>
            </div>
          </div>

          <div className="px-6 pb-10">
            <button
              onClick={handleSendSms}
              disabled={!isValid}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-opacity ${isValid ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-400"}`}
            >
              Получить СМС-код
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "sms") {
    const isFilled = smsCode.every((d) => d !== "");
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen">
        <div className="w-full max-w-[430px] bg-white min-h-screen flex flex-col shadow-xl">
          <div className="px-4 pt-6">
            <button onClick={() => setStep("phone")} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center px-6 gap-6">
            <div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">Введите код</h2>
              <p className="text-gray-500 text-sm">СМС-код отправлен на номер</p>
              <p className="text-gray-900 text-sm mt-1">{phone}</p>
            </div>

            <div className="flex gap-3 justify-center">
              {smsCode.map((digit, i) => (
                <input
                  key={i}
                  ref={smsRefs[i]}
                  value={digit}
                  onChange={(e) => handleSmsInput(i, e.target.value)}
                  onKeyDown={(e) => handleSmsKeyDown(i, e)}
                  maxLength={1}
                  type="tel"
                  className={`w-14 h-14 text-center rounded-2xl border-2 bg-gray-50 outline-none transition-colors ${
                    smsError ? "border-red-500" : digit ? "border-emerald-600" : "border-gray-200"
                  }`}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {smsError && !loginError && (
              <p className="text-red-500 text-sm text-center">
                Неверный код. Попробуйте снова. (Подсказка: 1234)
              </p>
            )}

            {loginError && (
              <div className="text-center space-y-2">
                <p className="text-red-500 text-sm">{loginError}</p>
                <button
                  onClick={() => { setLoginError(""); setIsNewUser(true); setStep("phone"); }}
                  className="text-emerald-600 text-sm underline"
                >
                  Зарегистрироваться
                </button>
              </div>
            )}

            <button className="text-emerald-600 text-sm text-center">
              Отправить код повторно
            </button>
          </div>

          <div className="px-6 pb-10">
            <button
              onClick={handleVerifySms}
              disabled={!isFilled}
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 transition-opacity ${isFilled ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-gray-200 text-gray-400"}`}
            >
              Подтвердить
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "profile") {
    return (
      <div className="flex justify-center bg-gray-100 min-h-screen">
        <div className="w-full max-w-[430px] bg-white min-h-screen flex flex-col shadow-xl">
          <div className="px-4 pt-6">
            <button onClick={() => setStep("sms")} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col px-6 gap-5 pt-6 overflow-y-auto">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                <Building className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="mb-1 text-xl font-bold text-gray-900">О вашем магазине</h2>
              <p className="text-gray-500 text-sm">Заполните данные, чтобы начать продавать на PureFood</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-500">Название компании</label>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <Building className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder='ООО "ЭкоВкус"'
                  className="flex-1 bg-transparent outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-500">Контактное лицо</label>
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Иван Петров"
                  className="flex-1 bg-transparent outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-500">Категории товаров</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      selectedCategories.includes(cat)
                        ? "bg-emerald-600 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="px-6 pb-10 pt-4">
            <button
              onClick={handleFinishProfile}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors"
            >
              Начать продавать
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
