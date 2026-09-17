import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Provider = { id: number; name: string; phone: string; whatsapp: string | null; categoryName: string; city: string; district: string; rating: number; reviewCount: number; yearsExperience: number; isVerified: boolean; isAvailable: boolean; bio?: string; avatarUrl?: string | null; };
type Category = { id: number; name: string; icon: string; providerCount: number };
type User = { id: number; name: string; phone: string; role: string };
type PortfolioItem = { id: number; imageUrl: string; description?: string | null; providerId: number; createdAt?: string };
type Review = { id: number; clientName?: string; rating: number; comment?: string | null; createdAt: string };

const apiUrl = Constants.expoConfig?.extra?.apiUrl as string;
const tokenKey = 'fazaa_auth_token';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await SecureStore.getItemAsync(tokenKey);
  const response = await fetch(`${apiUrl}/api${path}`, { ...init, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'تعذر تنفيذ الطلب');
  return data as T;
}

function toPhoneHref(phone: string) { return `tel:${phone.replace(/[^\d+]/g, '')}`; }
function toWhatsAppHref(phone: string) { const digits = phone.replace(/\D/g, ''); return `https://wa.me/${digits.startsWith('0') ? `967${digits.slice(1)}` : digits}`; }

export default function App() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'otp' | 'forgot' | null>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadProviders = async () => {
    setBusy(true); setError('');
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (query.trim()) params.set('search', query.trim());
      if (city.trim()) params.set('city', city.trim());
      if (selectedCategory) params.set('categoryId', String(selectedCategory));
      const result = await request<{ providers: Provider[] }>(`/providers?${params.toString()}`);
      setProviders(result.providers);
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر تحميل المهنيين'); }
    finally { setBusy(false); }
  };

  useEffect(() => { void Promise.all([request<Category[]>('/categories').then(setCategories), loadProviders()]).catch(() => undefined); void SecureStore.getItemAsync(tokenKey).then((token) => { if (token) void request<User>('/auth/me').then(setUser).catch(() => SecureStore.deleteItemAsync(tokenKey)); }).finally(() => setLoading(false)); }, []);

  const login = async () => {
    setBusy(true); setError('');
    try { const result = await request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }); await SecureStore.setItemAsync(tokenKey, result.token); setUser(result.user); setPhone(''); setPassword(''); }
    catch (err) { setError(err instanceof Error ? err.message : 'تعذر تسجيل الدخول'); }
    finally { setBusy(false); }
  };

  const selectProvider = async (provider: Provider) => { setBusy(true); try { setSelected(await request<Provider>(`/providers/${provider.id}`)); } catch (err) { setError(err instanceof Error ? err.message : 'تعذر تحميل الملف'); } finally { setBusy(false); } };

  if (loading) return <SafeAreaView style={styles.safe}><StatusBar style="light" /><View style={styles.center}><ActivityIndicator color="#FBBF24" size="large" /></View></SafeAreaView>;
  if (authScreen) return <AuthScreen initialScreen={authScreen} onClose={() => setAuthScreen(null)} onAuthenticated={(nextUser) => { setUser(nextUser); setAuthScreen(null); }} />;
  if (selected) return <ProviderDetail provider={selected} onBack={() => setSelected(null)} />;

  return <MainTabs user={user} providers={providers} categories={categories} query={query} city={city} busy={busy} error={error} onQuery={setQuery} onCity={setCity} onSearch={() => void loadProviders()} onSelectProvider={(provider) => void selectProvider(provider)} onCategory={(id) => { setSelectedCategory(id); setTimeout(() => void loadProviders(), 0); }} onAuth={() => setAuthScreen('login')} onLogout={async () => { await SecureStore.deleteItemAsync(tokenKey); setUser(null); }} />
}


function ProviderDetail({ provider, onBack }: { provider: Provider; onBack: () => void }) {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [detailError, setDetailError] = useState('');
  useEffect(() => {
    setLoadingDetail(true); setDetailError('');
    void Promise.all([
      request<PortfolioItem[]>(`/providers/${provider.id}/portfolio`).then(setPortfolio),
      request<Review[]>(`/providers/${provider.id}/reviews`).then(setReviews),
    ]).catch((err) => setDetailError(err instanceof Error ? err.message : 'تعذر تحميل تفاصيل الملف'))
      .finally(() => setLoadingDetail(false));
  }, [provider.id]);
  return <SafeAreaView style={styles.app}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.detail}>
    <Pressable onPress={onBack}><Text style={styles.back}>‹ العودة للبحث</Text></Pressable>
    <Text style={styles.detailName}>{provider.name}</Text><Text style={styles.muted}>{provider.categoryName} · {provider.city} · {provider.district}</Text>
    <View style={styles.badge}><Text style={styles.badgeText}>{provider.isVerified ? 'مهني موثق' : 'قيد التحقق'}</Text></View>
    <Text style={styles.detailBio}>{provider.bio || 'لا توجد نبذة مضافة بعد.'}</Text>
    <View style={styles.stats}><Text style={styles.stat}>★ {provider.rating.toFixed(1)} ({provider.reviewCount})</Text><Text style={styles.stat}>{provider.yearsExperience} سنة خبرة</Text></View>
    <View style={styles.actionRow}><Pressable style={styles.action} onPress={() => Linking.openURL(toPhoneHref(provider.phone))}><Text style={styles.actionText}>اتصال</Text></Pressable>{provider.whatsapp && <Pressable style={styles.whatsapp} onPress={() => Linking.openURL(toWhatsAppHref(provider.whatsapp!))}><Text style={styles.actionText}>واتساب</Text></Pressable>}</View>
    {loadingDetail ? <ActivityIndicator color="#0F766E" style={styles.loader} /> : detailError ? <Text style={styles.error}>{detailError}</Text> : <>
      <Text style={[styles.sectionTitle, { textAlign: 'right', marginTop: 28 }]}>معرض الأعمال</Text>
      {portfolio.length === 0 ? <Text style={styles.empty}>لا توجد أعمال معتمدة للعرض حالياً.</Text> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 12 }}>{portfolio.map((item) => <View key={item.id} style={{ width: 150 }}><Image source={{ uri: item.imageUrl }} style={{ width: 150, height: 120, borderRadius: 14, backgroundColor: '#E2E8F0' }} /><Text style={styles.muted}>{item.description || 'عمل مهني موثق'}</Text></View>)}</ScrollView>}
      <Text style={[styles.sectionTitle, { textAlign: 'right', marginTop: 18 }]}>آراء العملاء</Text>
      {reviews.length === 0 ? <Text style={styles.empty}>لا توجد تقييمات منشورة بعد.</Text> : reviews.slice(0, 10).map((review) => <View key={review.id} style={styles.card}><Text style={styles.name}>{review.clientName || 'عميل'}</Text><Text style={styles.rating}>★ {review.rating}/5</Text>{review.comment && <Text style={styles.cardBio}>{review.comment}</Text>}</View>)}
    </>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: '#0F766E' }, app: { flex: 1, backgroundColor: '#F8FAFC' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, container: { padding: 20, paddingBottom: 48 }, header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, brand: { color: '#0F766E', fontSize: 34, fontWeight: '900', textAlign: 'right' }, tagline: { color: '#64748B', fontSize: 13, textAlign: 'right', marginTop: 2 }, user: { color: '#0F766E', fontSize: 12, fontWeight: '700' }, searchBox: { backgroundColor: '#fff', borderRadius: 18, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 }, input: { textAlign: 'right', fontSize: 16, color: '#0F172A', minHeight: 42 }, cityInput: { textAlign: 'right', color: '#0F172A', borderTopWidth: 1, borderTopColor: '#F1F5F9', minHeight: 42 }, searchButton: { backgroundColor: '#0F766E', borderRadius: 12, minHeight: 46, alignItems: 'center', justifyContent: 'center' }, searchButtonText: { color: '#fff', fontWeight: '800', fontSize: 16 }, categories: { gap: 8, paddingVertical: 18 }, category: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9, backgroundColor: '#fff' }, categorySelected: { backgroundColor: '#0F766E', borderColor: '#0F766E' }, categoryText: { color: '#475569', fontWeight: '700', fontSize: 13 }, categoryTextSelected: { color: '#fff' }, sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, sectionTitle: { color: '#0F172A', fontSize: 21, fontWeight: '800' }, count: { color: '#64748B', fontSize: 12 }, card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' }, cardTop: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10 }, avatar: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#CCFBF1', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#0F766E', fontSize: 22, fontWeight: '900' }, cardInfo: { flex: 1, alignItems: 'flex-end' }, name: { color: '#0F172A', fontSize: 16, fontWeight: '800' }, muted: { color: '#64748B', fontSize: 12, marginTop: 3, textAlign: 'right' }, rating: { color: '#B45309', fontSize: 11, marginTop: 5, textAlign: 'right' }, verified: { color: '#047857', backgroundColor: '#D1FAE5', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, fontSize: 10, fontWeight: '800' }, pending: { color: '#A16207', backgroundColor: '#FEF3C7', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, fontSize: 10, fontWeight: '800' }, cardBio: { color: '#475569', fontSize: 13, lineHeight: 20, textAlign: 'right', marginTop: 12 }, cardActions: { flexDirection: 'row-reverse', gap: 18, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 12, paddingTop: 11 }, link: { color: '#0F766E', fontWeight: '800', fontSize: 13 }, whatsappLink: { color: '#15803D', fontWeight: '800', fontSize: 13 }, success: { color: '#047857', backgroundColor: '#D1FAE5', padding: 10, borderRadius: 10, textAlign: 'right', marginBottom: 10 }, error: { color: '#B91C1C', backgroundColor: '#FEE2E2', padding: 10, borderRadius: 10, textAlign: 'right', marginBottom: 10 }, loader: { margin: 30 }, empty: { color: '#64748B', textAlign: 'center', padding: 30, lineHeight: 22 }, loginBox: { marginTop: 24, backgroundColor: '#ECFEFF', borderRadius: 18, padding: 16, gap: 10 }, loginTitle: { color: '#0F172A', textAlign: 'right', fontSize: 16, fontWeight: '800' }, loginInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#BAE6FD', borderRadius: 10, padding: 12, textAlign: 'right', color: '#0F172A' }, outlineButton: { borderWidth: 1, borderColor: '#0F766E', borderRadius: 10, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, outlineText: { color: '#0F766E', fontWeight: '800' }, detail: { padding: 22, paddingBottom: 48 }, back: { color: '#0F766E', fontSize: 16, fontWeight: '800', textAlign: 'right', marginBottom: 28 }, detailName: { color: '#0F172A', fontSize: 30, fontWeight: '900', textAlign: 'right' }, badge: { alignSelf: 'flex-end', backgroundColor: '#D1FAE5', borderRadius: 8, padding: 8, marginTop: 14 }, badgeText: { color: '#047857', fontWeight: '800' }, detailBio: { color: '#334155', fontSize: 16, lineHeight: 27, textAlign: 'right', marginTop: 24 }, stats: { flexDirection: 'row-reverse', justifyContent: 'space-around', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 20 }, stat: { color: '#475569', fontWeight: '800' }, actionRow: { flexDirection: 'row-reverse', gap: 12, marginTop: 28 }, action: { flex: 1, backgroundColor: '#0F766E', borderRadius: 14, minHeight: 52, alignItems: 'center', justifyContent: 'center' }, whatsapp: { flex: 1, backgroundColor: '#16A34A', borderRadius: 14, minHeight: 52, alignItems: 'center', justifyContent: 'center' }, actionText: { color: '#fff', fontWeight: '900', fontSize: 16 }, authSafe: { flex: 1, backgroundColor: '#F8FAFC' }, authContainer: { padding: 22, paddingBottom: 48 }, authBrand: { color: '#0F766E', fontSize: 36, fontWeight: '900', textAlign: 'right', marginTop: 18 }, authTitle: { color: '#0F172A', fontSize: 26, fontWeight: '900', textAlign: 'right', marginTop: 22 }, authHint: { color: '#64748B', fontSize: 14, lineHeight: 23, textAlign: 'right', marginTop: 8, marginBottom: 18 }, authInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 12, minHeight: 50, paddingHorizontal: 14, marginBottom: 10, textAlign: 'right', color: '#0F172A' }, authPrimary: { backgroundColor: '#0F766E', borderRadius: 13, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8, marginBottom: 14 }, authPrimaryText: { color: '#fff', fontWeight: '900', fontSize: 16 }, authSecondary: { borderWidth: 1, borderColor: '#0F766E', borderRadius: 13, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 }, authLinks: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginTop: 12 }, mainBody: { flex: 1 }, bottomNav: { flexDirection: 'row-reverse', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', minHeight: 64, alignItems: 'center', justifyContent: 'space-around' }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' }, navText: { color: '#64748B', fontWeight: '700', fontSize: 13 }, navActive: { color: '#0F766E', fontWeight: '900', fontSize: 13 }, heroCard: { backgroundColor: '#0F766E', borderRadius: 22, padding: 20, marginBottom: 20 }, heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'right' }, heroBody: { color: '#CCFBF1', fontSize: 14, lineHeight: 23, textAlign: 'right', marginTop: 8 }, heroButton: { backgroundColor: '#FBBF24', borderRadius: 12, alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 11, marginTop: 16 }, heroButtonText: { color: '#0F766E', fontWeight: '900' }, accountCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 20 }, accountIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#CCFBF1', color: '#0F766E', fontSize: 34, fontWeight: '900', textAlign: 'center', textAlignVertical: 'center', paddingTop: 12 }, accountName: { color: '#0F172A', fontSize: 21, fontWeight: '900', marginTop: 14 } });


type AuthFlow = 'login' | 'register' | 'otp' | 'forgot' | 'reset';
type AuthScreenProps = { initialScreen: AuthFlow; onClose: () => void; onAuthenticated: (user: User) => void };

function AuthScreen({ initialScreen, onClose, onAuthenticated }: AuthScreenProps) {
  const [screen, setScreen] = useState<AuthFlow>(initialScreen);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); setMessage(''); try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'تعذر تنفيذ العملية'); } finally { setBusy(false); } };
  const login = () => run(async () => { const result = await request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) }); await SecureStore.setItemAsync(tokenKey, result.token); onAuthenticated(result.user); });
  const registerEmail = () => run(async () => { const result = await request<{ token: string; user: User }>('/auth/register/email', { method: 'POST', body: JSON.stringify({ name, email, password, phone: phone || undefined, role: 'client' }) }); await SecureStore.setItemAsync(tokenKey, result.token); onAuthenticated(result.user); });
  const sendOtp = () => run(async () => { const result = await request<{ otp?: string }>('/auth/send-otp', { method: 'POST', body: JSON.stringify({ phone }) }); setMessage(result.otp ? `رمز الاختبار: ${result.otp}` : 'تم إرسال رمز التحقق إلى هاتفك'); setScreen('otp'); });
  const verifyOtp = () => run(async () => { const result = await request<{ token: string; user: User; needsRegistration?: boolean }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ phone, code, name: name || undefined, role: 'client' }) }); if (result.needsRegistration) { setMessage('أدخل اسمك لإكمال إنشاء الحساب'); setScreen('register'); return; } await SecureStore.setItemAsync(tokenKey, result.token); onAuthenticated(result.user); });
  const forgot = () => run(async () => { const result = await request<{ resetToken?: string; message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); setMessage(result.resetToken ? `رمز الاستعادة للاختبار: ${result.resetToken}` : result.message); if (result.resetToken) { setResetToken(result.resetToken); setScreen('reset'); } });
  const reset = () => run(async () => { await request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: resetToken, newPassword }) }); setMessage('تم تغيير كلمة المرور. يمكنك تسجيل الدخول الآن.'); setScreen('login'); });

  const title = screen === 'login' ? 'تسجيل الدخول' : screen === 'register' ? 'إنشاء حساب عميل' : screen === 'otp' ? 'التحقق من الهاتف' : screen === 'forgot' ? 'استعادة كلمة المرور' : 'كلمة مرور جديدة';
  return <SafeAreaView style={styles.authSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.authContainer} keyboardShouldPersistTaps="handled"><Pressable onPress={onClose}><Text style={styles.back}>‹ العودة إلى فزعة</Text></Pressable><Text style={styles.authBrand}>فزعة</Text><Text style={styles.authTitle}>{title}</Text><Text style={styles.authHint}>{screen === 'login' ? 'أدخل بيانات حسابك للمتابعة.' : screen === 'register' ? 'أنشئ حسابًا حقيقيًا للوصول إلى خدمات فزعة.' : screen === 'otp' ? 'أدخل الرمز المرسل إلى رقم هاتفك.' : 'سنساعدك على استعادة الوصول إلى حسابك.'}</Text>{error ? <Text style={styles.error}>{error}</Text> : null}{message ? <Text style={styles.success}>{message}</Text> : null}{screen === 'login' && <><TextInput value={phone} onChangeText={setPhone} placeholder="رقم الهاتف" placeholderTextColor="#94A3B8" style={styles.authInput} keyboardType="phone-pad" /><TextInput value={password} onChangeText={setPassword} placeholder="كلمة المرور" placeholderTextColor="#94A3B8" style={styles.authInput} secureTextEntry /><Pressable style={styles.authPrimary} onPress={login} disabled={busy}><Text style={styles.authPrimaryText}>{busy ? 'جارٍ التحقق...' : 'تسجيل الدخول'}</Text></Pressable><View style={styles.authLinks}><Pressable onPress={() => setScreen('register')}><Text style={styles.link}>إنشاء حساب</Text></Pressable><Pressable onPress={() => setScreen('forgot')}><Text style={styles.link}>نسيت كلمة المرور؟</Text></Pressable></View><Pressable style={styles.authSecondary} onPress={sendOtp}><Text style={styles.outlineText}>الدخول برمز الهاتف</Text></Pressable></>}{screen === 'register' && <><TextInput value={name} onChangeText={setName} placeholder="الاسم الكامل" placeholderTextColor="#94A3B8" style={styles.authInput} /><TextInput value={email} onChangeText={setEmail} placeholder="البريد الإلكتروني" placeholderTextColor="#94A3B8" style={styles.authInput} keyboardType="email-address" autoCapitalize="none" /><TextInput value={phone} onChangeText={setPhone} placeholder="رقم الهاتف (اختياري مع البريد)" placeholderTextColor="#94A3B8" style={styles.authInput} keyboardType="phone-pad" /><TextInput value={password} onChangeText={setPassword} placeholder="كلمة المرور - 8 أحرف على الأقل" placeholderTextColor="#94A3B8" style={styles.authInput} secureTextEntry /><Pressable style={styles.authPrimary} onPress={registerEmail} disabled={busy}><Text style={styles.authPrimaryText}>إنشاء الحساب</Text></Pressable><Pressable style={styles.authSecondary} onPress={sendOtp}><Text style={styles.outlineText}>إنشاء الحساب برقم الهاتف</Text></Pressable></>}{screen === 'otp' && <><TextInput value={phone} onChangeText={setPhone} placeholder="رقم الهاتف" placeholderTextColor="#94A3B8" style={styles.authInput} keyboardType="phone-pad" /><TextInput value={code} onChangeText={setCode} placeholder="رمز التحقق" placeholderTextColor="#94A3B8" style={styles.authInput} keyboardType="number-pad" /><TextInput value={name} onChangeText={setName} placeholder="الاسم عند إنشاء حساب جديد" placeholderTextColor="#94A3B8" style={styles.authInput} /><Pressable style={styles.authPrimary} onPress={verifyOtp} disabled={busy}><Text style={styles.authPrimaryText}>تحقق ومتابعة</Text></Pressable><Pressable onPress={sendOtp}><Text style={styles.link}>إعادة إرسال الرمز</Text></Pressable></>}{screen === 'forgot' && <><TextInput value={email} onChangeText={setEmail} placeholder="البريد الإلكتروني" placeholderTextColor="#94A3B8" style={styles.authInput} keyboardType="email-address" autoCapitalize="none" /><Pressable style={styles.authPrimary} onPress={forgot} disabled={busy}><Text style={styles.authPrimaryText}>إرسال رابط الاستعادة</Text></Pressable></>}{screen === 'reset' && <><TextInput value={newPassword} onChangeText={setNewPassword} placeholder="كلمة المرور الجديدة" placeholderTextColor="#94A3B8" style={styles.authInput} secureTextEntry /><Pressable style={styles.authPrimary} onPress={reset} disabled={busy}><Text style={styles.authPrimaryText}>حفظ كلمة المرور</Text></Pressable></>}</ScrollView></SafeAreaView>;
}


type MainTabsProps = { user: User | null; providers: Provider[]; categories: Category[]; query: string; city: string; busy: boolean; error: string; onQuery: (value: string) => void; onCity: (value: string) => void; onSearch: () => void; onSelectProvider: (provider: Provider) => void; onCategory: (id: number) => void; onAuth: () => void; onLogout: () => Promise<void> };

function MainTabs({ user, providers, categories, query, city, busy, error, onQuery, onCity, onSearch, onSelectProvider, onCategory, onAuth, onLogout }: MainTabsProps) {
  const [tab, setTab] = useState<'home' | 'explore' | 'account'>('home');
  const [topRated, setTopRated] = useState<Provider[]>([]);
  useEffect(() => { void request<Provider[]>('/providers/top-rated?limit=6').then(setTopRated).catch(() => undefined); }, []);
  const visible = tab === 'home' && topRated.length ? topRated : providers;
  return <SafeAreaView style={styles.app}><StatusBar style="dark" /><View style={styles.mainBody}><ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><View><Text style={styles.brand}>فزعة</Text><Text style={styles.tagline}>{tab === 'home' ? 'خدمات موثوقة أقرب إليك' : tab === 'explore' ? 'ابحث واختر بثقة' : 'إدارة حسابك وبياناتك'}</Text></View>{user ? <Text style={styles.user}>مرحبًا {user.name}</Text> : <Pressable onPress={onAuth}><Text style={styles.link}>دخول</Text></Pressable>}</View>
    {tab === 'home' && <><View style={styles.heroCard}><Text style={styles.heroTitle}>تحتاج مهنيًا موثوقًا؟</Text><Text style={styles.heroBody}>استعرض مهنيين معتمدين وتواصل معهم مباشرة عبر الاتصال أو واتساب.</Text><Pressable style={styles.heroButton} onPress={() => setTab('explore')}><Text style={styles.heroButtonText}>استكشف المهنيين</Text></Pressable></View><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>التخصصات</Text><Text style={styles.count}>{categories.length} تخصص</Text></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{categories.map((category) => <Pressable key={category.id} onPress={() => { onQuery(''); onCity(''); onCategory(category.id); setTab('explore'); }} style={styles.category}><Text style={styles.categoryText}>{category.name}</Text></Pressable>)}</ScrollView><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>الأعلى تقييمًا</Text><Text style={styles.count}>موثقون ومشتركون</Text></View></>}
    {tab === 'explore' && <><View style={styles.searchBox}><TextInput value={query} onChangeText={onQuery} placeholder="ابحث عن مهني أو خدمة" placeholderTextColor="#94A3B8" style={styles.input} returnKeyType="search" onSubmitEditing={onSearch} /><TextInput value={city} onChangeText={onCity} placeholder="المدينة" placeholderTextColor="#94A3B8" style={styles.cityInput} onSubmitEditing={onSearch} /><Pressable style={styles.searchButton} onPress={onSearch}><Text style={styles.searchButtonText}>بحث</Text></Pressable></View><View style={styles.sectionHeader}><Text style={styles.sectionTitle}>نتائج البحث</Text><Text style={styles.count}>{providers.length} نتيجة</Text></View></>}
    {error ? <Text style={styles.error}>{error}</Text> : null}{busy ? <ActivityIndicator color="#0F766E" style={styles.loader} /> : visible.map((provider) => <Pressable key={provider.id} style={styles.card} onPress={() => onSelectProvider(provider)}><View style={styles.cardTop}><View style={styles.avatar}><Text style={styles.avatarText}>{provider.name.slice(0, 1)}</Text></View><View style={styles.cardInfo}><Text style={styles.name}>{provider.name}</Text><Text style={styles.muted}>{provider.categoryName} · {provider.city}</Text><Text style={styles.rating}>★ {provider.rating.toFixed(1)} · {provider.reviewCount} تقييم · {provider.yearsExperience} سنة خبرة</Text></View><Text style={provider.isVerified ? styles.verified : styles.pending}>{provider.isVerified ? 'موثق' : 'مراجعة'}</Text></View><Text style={styles.cardBio} numberOfLines={2}>{provider.bio || 'مهني متاح للتواصل المباشر'}</Text><View style={styles.cardActions}><Pressable onPress={() => Linking.openURL(toPhoneHref(provider.phone))}><Text style={styles.link}>اتصال</Text></Pressable>{provider.whatsapp && <Pressable onPress={() => Linking.openURL(toWhatsAppHref(provider.whatsapp!))}><Text style={styles.whatsappLink}>واتساب</Text></Pressable>}</View></Pressable>)}{!busy && visible.length === 0 ? <Text style={styles.empty}>لا توجد نتائج مطابقة حاليًا.</Text> : null}
    {tab === 'account' && <View style={styles.accountCard}><Text style={styles.accountIcon}>{user ? user.name.slice(0, 1) : 'ف'}</Text><Text style={styles.accountName}>{user ? user.name : 'زائر'}</Text><Text style={styles.muted}>{user ? user.phone : 'سجّل الدخول لحفظ تفضيلاتك ومتابعة حسابك'}</Text>{user ? <Pressable style={styles.authPrimary} onPress={() => void onLogout()}><Text style={styles.authPrimaryText}>تسجيل الخروج</Text></Pressable> : <Pressable style={styles.authPrimary} onPress={onAuth}><Text style={styles.authPrimaryText}>تسجيل الدخول أو إنشاء حساب</Text></Pressable>}</View>}
  </ScrollView><View style={styles.bottomNav}><Pressable onPress={() => setTab('home')} style={styles.navItem}><Text style={tab === 'home' ? styles.navActive : styles.navText}>الرئيسية</Text></Pressable><Pressable onPress={() => setTab('explore')} style={styles.navItem}><Text style={tab === 'explore' ? styles.navActive : styles.navText}>استكشف</Text></Pressable><Pressable onPress={() => setTab('account')} style={styles.navItem}><Text style={tab === 'account' ? styles.navActive : styles.navText}>حسابي</Text></Pressable></View></View></SafeAreaView>;
}
