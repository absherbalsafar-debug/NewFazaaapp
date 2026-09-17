import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const apiUrl = Constants.expoConfig?.extra?.apiUrl as string | undefined;

export default function App() {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState('');

  const checkService = async () => {
    setChecking(true);
    setStatus('');
    try {
      const response = await fetch(`${apiUrl}/api/health`);
      setStatus(response.ok ? 'الخدمة متاحة حاليًا' : 'الخدمة تحتاج إلى مراجعة');
    } catch {
      setStatus('تعذر الاتصال بالخدمة. تحقق من الشبكة أو بيئة التشغيل.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.hero}>
        <View style={styles.logo}><Text style={styles.logoText}>ف</Text></View>
        <Text style={styles.title}>فزعة</Text>
        <Text style={styles.subtitle}>مهنيون موثقون، تواصل مباشر، خدمة أقرب</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.heading}>ابحث عن المهني المناسب</Text>
        <Text style={styles.body}>تواصل مباشرة مع المهني عبر الاتصال أو الواتساب. لا يوجد دفع للخدمات داخل التطبيق.</Text>
        <Pressable style={styles.primary} onPress={() => void checkService()} disabled={checking}>
          {checking ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>البدء مع فزعة</Text>}
        </Pressable>
        <Pressable style={styles.secondary} onPress={() => void Linking.openURL('https://fazaa.com/privacy')}>
          <Text style={styles.secondaryText}>الخصوصية وشروط الاستخدام</Text>
        </Pressable>
        {!!status && <Text style={styles.status}>{status}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F766E' },
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 48 },
  logo: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBBF24', marginBottom: 18 },
  logoText: { color: '#0F766E', fontSize: 48, fontWeight: '900' },
  title: { color: '#fff', fontSize: 42, fontWeight: '900' },
  subtitle: { color: '#CCFBF1', fontSize: 16, marginTop: 10, textAlign: 'center' },
  content: { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28 },
  heading: { color: '#0F172A', fontSize: 25, fontWeight: '800', textAlign: 'right', marginTop: 18 },
  body: { color: '#475569', fontSize: 16, lineHeight: 27, textAlign: 'right', marginTop: 12 },
  primary: { minHeight: 54, borderRadius: 16, backgroundColor: '#0F766E', alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  primaryText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  secondary: { alignItems: 'center', padding: 18 },
  secondaryText: { color: '#0F766E', fontSize: 14, fontWeight: '700' },
  status: { color: '#0F766E', textAlign: 'center', marginTop: 10, fontWeight: '700' },
});
