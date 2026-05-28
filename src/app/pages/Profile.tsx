import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, Button, Input, Label, Badge } from "../components/ui";
import {
  ShieldCheck, Building, MapPin, Mail, Phone, UploadCloud, LogOut, Award,
  User, Pencil, Check, X, BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";

export function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useUser();

  const [editing, setEditing] = useState(false);

  // Local editable fields
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [contactName, setContactName] = useState(user?.contactName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");

  const handleSave = async () => {
    // 1. Update local state
    updateUser({ companyName, contactName, email, phone, address });
    setEditing(false);
    
    // 2. Sync to Supabase so buyers see updated company name
    if (user?.id && !user.id.startsWith('local-')) {
      try {
        const { updateSellerProfile } = await import('../../lib/api');
        await updateSellerProfile(user.id, {
          company_name: companyName,
          location: address || 'Казахстан',
        });
        toast.success("Данные профиля сохранены и обновлены для покупателей");
      } catch (err) {
        console.error('Failed to sync profile to Supabase:', err);
        toast.success("Данные сохранены локально. Синхронизация с сервером не удалась.");
      }
    } else {
      toast.success("Данные профиля сохранены");
    }
  };

  const handleCancel = () => {
    // Reset to saved values
    setCompanyName(user?.companyName || "");
    setContactName(user?.contactName || "");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
    setAddress(user?.address || "");
    setEditing(false);
  };

  const handleUploadDeclarations = () => {
    toast.loading("Загрузка документов...", { id: "upload" });
    setTimeout(() => {
      toast.success("Документы успешно загружены и отправлены на проверку", { id: "upload" });
    }, 2000);
  };

  const handleLogout = () => {
    logout();
    toast.success("Вы вышли из аккаунта");
    navigate("/auth");
  };

  const displayName = user?.companyName || "Не указано";

  const inputClass = (editable: boolean) =>
    `border-0 border-b rounded-none px-0 h-8 focus-visible:ring-0 bg-transparent font-medium ${
      editable
        ? "border-gray-300 text-gray-900 focus-visible:border-emerald-600"
        : "border-gray-100 text-gray-400 cursor-not-allowed"
    }`;

  return (
    <div className="flex flex-col min-h-full bg-gray-50/50">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-4 pt-10 border-b border-gray-100 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Профиль продавца</h1>
          {editing ? (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white hover:bg-emerald-700 transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* User info banner */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 overflow-hidden">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : user?.authMethod === "google" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{displayName}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {user?.authMethod === "google" ? "Вход через Google" : user?.phone || "Телефон не указан"}
            </p>
          </div>
          {editing && (
            <span className="ml-auto text-xs text-emerald-600 font-medium shrink-0">Режим редактирования</span>
          )}
        </div>

        {/* Verification badge */}
        <Card className="border-emerald-200 bg-emerald-50 shadow-sm overflow-hidden relative">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-100 rounded-bl-full opacity-50 z-0"></div>
          <CardContent className="p-5 flex items-start justify-between relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-900 leading-tight text-base">Честный поставщик</h3>
                  <p className="text-[10px] text-emerald-700 font-medium tracking-wide uppercase">Статус активен</p>
                </div>
              </div>
              <p className="text-xs text-emerald-800/80 leading-snug pr-4">
                Ваш профиль проверен модераторами PureFood. Значок отображается для покупателей.
              </p>
              <Button
                variant="link"
                className="h-auto p-0 text-emerald-700 text-xs font-semibold"
                onClick={() => navigate("/verification-info")}
              >
                Подробнее о преимуществах
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Retention analytics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              Аналитика удержания
            </h3>
            <Badge variant="outline" className="text-[10px] border-gray-200 bg-white">6 месяцев</Badge>
          </div>
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-5 space-y-4">
              {(() => {
                const retentionData = [
                  { month: "Дек", views: 124, repeats: 18, conversion: 14.5 },
                  { month: "Янв", views: 156, repeats: 27, conversion: 17.3 },
                  { month: "Фев", views: 189, repeats: 34, conversion: 18.0 },
                  { month: "Мар", views: 210, repeats: 45, conversion: 21.4 },
                  { month: "Апр", views: 243, repeats: 58, conversion: 23.9 },
                  { month: "Май", views: 278, repeats: 72, conversion: 25.9 },
                ];

                const maxViews = Math.max(...retentionData.map(d => d.views));
                const chartW = 300;
                const chartH = 120;
                const padL = 0;
                const padB = 20;
                const plotW = chartW - padL;
                const plotH = chartH - padB;

                const xStep = plotW / (retentionData.length - 1);

                const viewPoints = retentionData.map((d, i) => ({
                  x: padL + i * xStep,
                  y: plotH - (d.views / maxViews) * plotH,
                }));
                const repeatPoints = retentionData.map((d, i) => ({
                  x: padL + i * xStep,
                  y: plotH - (d.repeats / maxViews) * plotH,
                }));

                const viewLine = viewPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
                const repeatLine = repeatPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

                const viewArea = `${viewLine} L${viewPoints[viewPoints.length - 1].x},${plotH} L${viewPoints[0].x},${plotH} Z`;
                const repeatArea = `${repeatLine} L${repeatPoints[repeatPoints.length - 1].x},${plotH} L${repeatPoints[0].x},${plotH} Z`;

                const lastData = retentionData[retentionData.length - 1];
                const prevData = retentionData[retentionData.length - 2];
                const viewsGrowth = Math.round(((lastData.views - prevData.views) / prevData.views) * 100);
                const repeatsGrowth = Math.round(((lastData.repeats - prevData.repeats) / prevData.repeats) * 100);

                return (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-emerald-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-emerald-700">{lastData.views}</p>
                        <p className="text-[10px] text-emerald-600 font-medium">Просмотры</p>
                        <p className="text-[10px] text-emerald-500">+{viewsGrowth}%</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-amber-700">{lastData.repeats}</p>
                        <p className="text-[10px] text-amber-600 font-medium">Повторные</p>
                        <p className="text-[10px] text-amber-500">+{repeatsGrowth}%</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold text-blue-700">{lastData.conversion}%</p>
                        <p className="text-[10px] text-blue-600 font-medium">Конверсия</p>
                        <p className="text-[10px] text-blue-500">удержания</p>
                      </div>
                    </div>

                    <div className="w-full overflow-hidden">
                      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
                          </linearGradient>
                          <linearGradient id="repeatGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#d97706" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#d97706" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>

                        {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
                          <line
                            key={frac}
                            x1={padL}
                            y1={plotH - frac * plotH}
                            x2={chartW}
                            y2={plotH - frac * plotH}
                            stroke="#e5e7eb"
                            strokeWidth="0.5"
                            strokeDasharray="3,3"
                          />
                        ))}

                        <path d={viewArea} fill="url(#viewGrad)" />
                        <path d={repeatArea} fill="url(#repeatGrad)" />

                        <path d={viewLine} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={repeatLine} fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

                        {viewPoints.map((p, i) => (
                          <circle key={`v${i}`} cx={p.x} cy={p.y} r={i === viewPoints.length - 1 ? 4 : 2.5} fill="#059669" stroke="white" strokeWidth="1.5" />
                        ))}
                        {repeatPoints.map((p, i) => (
                          <circle key={`r${i}`} cx={p.x} cy={p.y} r={i === repeatPoints.length - 1 ? 4 : 2.5} fill="#d97706" stroke="white" strokeWidth="1.5" />
                        ))}

                        {retentionData.map((d, i) => (
                          <text key={`label${i}`} x={padL + i * xStep} y={chartH - 2} textAnchor="middle" className="text-[9px] fill-gray-400">
                            {d.month}
                          </text>
                        ))}
                      </svg>
                    </div>

                    <div className="flex items-center justify-center gap-6">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-[10px] text-gray-500 font-medium">Просмотры</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-[10px] text-gray-500 font-medium">Повторные покупки</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Company data */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 px-1 text-sm">Данные компании</h3>
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-5 space-y-4">

              <div className="space-y-2">
                <Label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Название организации</Label>
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-gray-400 shrink-0" />
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={!editing}
                    placeholder="Название компании"
                    className={inputClass(editing)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-500 text-xs font-medium uppercase tracking-wider">ИНН / ОГРН</Label>
                <div className="flex items-center gap-3">
                  <Award className="w-4 h-4 text-gray-400 shrink-0" />
                  <Input
                    defaultValue="7712345678 / 1234567890123"
                    disabled
                    className={inputClass(false)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Контактное лицо</Label>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400 shrink-0" />
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    disabled={!editing}
                    placeholder="Имя Фамилия"
                    className={inputClass(editing)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Email</Label>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!editing}
                    type="email"
                    placeholder="example@mail.kz"
                    className={inputClass(editing)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Телефон</Label>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!editing}
                    type="tel"
                    placeholder="+7 (___) ___-__-__"
                    className={inputClass(editing)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Адрес склада / производства</Label>
                <div className="flex items-start gap-3 pt-1">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!editing}
                    placeholder="г. Алматы, пр. Абая, д. 1"
                    className={`w-full resize-none border-0 border-b focus:ring-0 focus:outline-none bg-transparent text-sm font-medium p-0 ${
                      editing
                        ? "border-gray-300 text-gray-900 focus:border-emerald-600"
                        : "border-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                    rows={2}
                  />
                </div>
              </div>

              {user?.categories && user.categories.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-gray-500 text-xs font-medium uppercase tracking-wider">Категории товаров</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {user.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-100"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Documents */}
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-semibold text-gray-900 text-sm">Документы проверки</h3>
            <Badge variant="outline" className="text-[10px] border-gray-200 bg-white">Обязательно</Badge>
          </div>
          <Card className="border-gray-100 shadow-sm border-dashed">
            <CardContent
              className="p-5 flex flex-col items-center justify-center space-y-3 text-center cursor-pointer hover:bg-gray-50/50 transition-colors rounded-xl min-h-[140px]"
              onClick={handleUploadDeclarations}
            >
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Загрузить декларации</p>
                <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto leading-snug">Декларации соответствия, сертификаты био/органик (PDF)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button
          variant="ghost"
          className="w-full h-12 text-red-600 hover:text-red-700 hover:bg-red-50 font-medium flex items-center gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );
}
