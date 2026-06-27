import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "../components/ui";
import {
  Star, ArrowLeft, BarChart3, MessageSquare, Filter,
  ThumbsUp, ThumbsDown, Send, Flag, CheckCircle, Image, Loader2, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "../context/UserContext";
import {
  fetchSellerReviews,
  fetchSellerReviewAnalytics,
  replyToReview,
  flagReview,
  type SellerReview,
  type ReviewAnalyticsDashboard,
} from "../../lib/api";

type Period = '7d' | '30d' | '6m';
type SortKey = 'newest' | 'oldest' | 'lowest' | 'highest';

const PERIOD_LABELS: Record<Period, string> = { '7d': '7 дней', '30d': '30 дней', '6m': '6 месяцев' };

export function ReviewsAnalytics() {
  const navigate = useNavigate();
  const { user } = useUser();

  const [period, setPeriod] = useState<Period>('30d');
  const [analytics, setAnalytics] = useState<ReviewAnalyticsDashboard | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [filterRating, setFilterRating] = useState<number | undefined>(undefined);
  const [filterPhoto, setFilterPhoto] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('newest');

  // Reply state per review
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [replyLoading, setReplyLoading] = useState<Record<string, boolean>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  const sellerId = user?.id || '';

  // Load analytics
  useEffect(() => {
    if (!sellerId) return;
    setAnalyticsLoading(true);
    fetchSellerReviewAnalytics(sellerId, period)
      .then(setAnalytics)
      .catch(err => console.error(err))
      .finally(() => setAnalyticsLoading(false));
  }, [sellerId, period]);

  // Load reviews list
  useEffect(() => {
    if (!sellerId) return;
    setReviewsLoading(true);
    fetchSellerReviews(sellerId, {
      rating: filterRating,
      hasPhoto: filterPhoto || undefined,
      sortBy,
    })
      .then(setReviews)
      .catch(err => console.error(err))
      .finally(() => setReviewsLoading(false));
  }, [sellerId, filterRating, filterPhoto, sortBy]);

  const handleReply = async (reviewId: string) => {
    const text = replyInputs[reviewId]?.trim();
    if (!text) { toast.error('Введите текст ответа'); return; }
    setReplyLoading(prev => ({ ...prev, [reviewId]: true }));
    const ok = await replyToReview(reviewId, text);
    setReplyLoading(prev => ({ ...prev, [reviewId]: false }));
    if (ok) {
      toast.success('Ответ опубликован!');
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, seller_reply: text, seller_reply_at: new Date().toISOString() } : r
      ));
      setReplyOpen(prev => ({ ...prev, [reviewId]: false }));
    } else {
      toast.error('Не удалось отправить ответ');
    }
  };

  const handleFlag = async (reviewId: string) => {
    const ok = await flagReview(reviewId);
    if (ok) {
      setFlaggedIds(prev => new Set([...prev, reviewId]));
      toast.success('Жалоба отправлена на модерацию');
    } else {
      toast.error('Не удалось отправить жалобу');
    }
  };

  // SVG trend chart
  const renderChart = () => {
    if (!analytics || analytics.ratingTrend.length === 0) return null;
    const data = analytics.ratingTrend;
    const chartW = 320, chartH = 100, padB = 18, padL = 4;
    const plotW = chartW - padL;
    const plotH = chartH - padB;
    const maxAvg = 5;
    const xStep = data.length > 1 ? plotW / (data.length - 1) : plotW;

    const pts = data.map((d, i) => ({
      x: padL + i * xStep,
      y: plotH - (d.avg / maxAvg) * plotH,
    }));

    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const area = `${line} L${pts[pts.length - 1].x},${plotH} L${pts[0].x},${plotH} Z`;

    return (
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[1, 2, 3, 4, 5].map(v => {
          const y = plotH - (v / maxAvg) * plotH;
          return <line key={v} x1={padL} y1={y} x2={chartW} y2={y} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="3,3" />;
        })}
        <path d={area} fill="url(#ratingGrad)" />
        <path d={line} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2.5} fill="#f59e0b" stroke="white" strokeWidth="1.5" />
        ))}
        {data.map((d, i) => (
          <text key={i} x={padL + i * xStep} y={chartH - 2} textAnchor="middle" fontSize="8" fill="#9ca3af">
            {d.label}
          </text>
        ))}
      </svg>
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50/50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-4 pt-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Аналитика отзывов</h1>
        </div>
      </div>

      <div className="p-4 space-y-5 pb-24">

        {/* ─── DASHBOARD ─── */}
        <Card className="border-gray-100 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* Period filter */}
            <div className="flex border-b border-gray-100">
              {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                    period === p
                      ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {PERIOD_LABELS[p]}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-4">
              {analyticsLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-16 bg-gray-100 rounded-xl" />
                  <div className="h-28 bg-gray-100 rounded-xl" />
                </div>
              ) : !analytics || analytics.reviewCount === 0 ? (
                <div className="flex flex-col items-center py-6 text-center gap-2">
                  <MessageSquare className="w-8 h-8 text-gray-300" />
                  <p className="text-sm text-gray-500">Отзывов пока нет</p>
                  <p className="text-xs text-gray-400">Аналитика появится после первых отзывов покупателей</p>
                </div>
              ) : (
                <>
                  {/* Big rating + count */}
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center bg-amber-50 rounded-2xl px-5 py-3 min-w-[90px]">
                      <span className="text-3xl font-bold text-amber-600">
                        {analytics.averageRating.toFixed(1)}
                      </span>
                      <div className="flex gap-0.5 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3 h-3 ${s <= Math.round(analytics.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{analytics.reviewCount}</p>
                      <p className="text-xs text-gray-500 mt-0.5">всего отзывов</p>
                    </div>
                  </div>

                  {/* Rating trend chart */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Динамика оценок</p>
                    <div className="w-full overflow-hidden">{renderChart()}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="text-[10px] text-gray-500">Средний рейтинг</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── TAG CLOUD ─── */}
        {analytics && analytics.reviewCount > 0 && (
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Облако тегов
              </h3>

              {/* Positive */}
              {analytics.topPositiveTags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5" /> Хвалят
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analytics.topPositiveTags.map(({ tag, count }) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        {tag}
                        <span className="font-semibold bg-emerald-200 text-emerald-800 rounded-full px-1.5 py-0.5 text-[10px]">
                          {count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Negative */}
              {analytics.topNegativeTags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <ThumbsDown className="w-3.5 h-3.5" /> Жалуются
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analytics.topNegativeTags.map(({ tag, count }) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-red-50 text-red-700 border border-red-200"
                      >
                        {tag}
                        <span className="font-semibold bg-red-200 text-red-800 rounded-full px-1.5 py-0.5 text-[10px]">
                          {count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── CRM REVIEWS LIST ─── */}
        <div className="space-y-3">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Фильтр:</span>
            </div>

            {/* Star filter */}
            <div className="flex gap-1">
              {[undefined, 5, 4, 3, 2, 1].map(r => (
                <button
                  key={r ?? 'all'}
                  onClick={() => setFilterRating(r)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    filterRating === r
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {r === undefined ? 'Все' : `${r}★`}
                </button>
              ))}
            </div>

            {/* Photo filter */}
            <button
              onClick={() => setFilterPhoto(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                filterPhoto ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              <Image className="w-3 h-3" /> С фото
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              className="ml-auto text-xs border border-gray-200 rounded-full px-2.5 py-1 bg-white text-gray-600 outline-none"
            >
              <option value="newest">Новые</option>
              <option value="oldest">Старые</option>
              <option value="lowest">Низкий рейтинг</option>
              <option value="highest">Высокий рейтинг</option>
            </select>
          </div>

          {/* List */}
          {reviewsLoading ? (
            <div className="space-y-3 animate-pulse">
              {[0,1,2].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
            </div>
          ) : reviews.length === 0 ? (
            <Card className="border-gray-100 shadow-sm">
              <CardContent className="flex flex-col items-center py-10 text-center gap-2">
                <MessageSquare className="w-8 h-8 text-gray-300" />
                <p className="text-sm text-gray-500">Нет отзывов по фильтру</p>
              </CardContent>
            </Card>
          ) : (
            reviews.map(review => (
              <Card key={review.id} className={`border-gray-100 shadow-sm ${review.is_flagged || flaggedIds.has(review.id) ? 'opacity-60' : ''}`}>
                <CardContent className="p-4 space-y-3">

                  {/* Review header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{review.userName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(review.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {review.productName && (
                        <p className="text-xs text-gray-400 mt-0.5">Товар: {review.productName}</p>
                      )}
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  {review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {review.tags.map(tag => (
                        <span
                          key={tag}
                          className={`text-[10px] px-2 py-0.5 rounded-full ${
                            review.rating >= 4 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Comment */}
                  {review.text_comment && (
                    <p className="text-sm text-gray-700 leading-snug">{review.text_comment}</p>
                  )}

                  {/* Photos */}
                  {review.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {review.images.slice(0, 3).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt="review"
                          className="w-16 h-16 rounded-xl object-cover border border-gray-100"
                        />
                      ))}
                    </div>
                  )}

                  {/* Existing reply */}
                  {review.seller_reply && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-emerald-700 mb-1">Ваш ответ:</p>
                      <p className="text-xs text-emerald-900">{review.seller_reply}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    {!review.seller_reply && (
                      <button
                        onClick={() => setReplyOpen(prev => ({ ...prev, [review.id]: !prev[review.id] }))}
                        className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium hover:text-emerald-800 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Ответить
                        <ChevronDown className={`w-3 h-3 transition-transform ${replyOpen[review.id] ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    <button
                      onClick={() => handleFlag(review.id)}
                      disabled={review.is_flagged || flaggedIds.has(review.id)}
                      className={`flex items-center gap-1.5 text-xs ml-auto transition-colors ${
                        review.is_flagged || flaggedIds.has(review.id)
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-red-500 hover:text-red-700'
                      }`}
                    >
                      {review.is_flagged || flaggedIds.has(review.id)
                        ? <><CheckCircle className="w-3.5 h-3.5" /> Жалоба отправлена</>
                        : <><Flag className="w-3.5 h-3.5" /> Пожаловаться</>
                      }
                    </button>
                  </div>

                  {/* Reply input */}
                  {replyOpen[review.id] && !review.seller_reply && (
                    <div className="space-y-2 animate-[fadeIn_0.2s_ease-out]">
                      <textarea
                        value={replyInputs[review.id] || ''}
                        onChange={e => setReplyInputs(prev => ({ ...prev, [review.id]: e.target.value }))}
                        placeholder="Напишите ответ покупателю..."
                        rows={3}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
                      />
                      <button
                        onClick={() => handleReply(review.id)}
                        disabled={replyLoading[review.id]}
                        className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60"
                      >
                        {replyLoading[review.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {replyLoading[review.id] ? 'Отправка...' : 'Отправить ответ'}
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
