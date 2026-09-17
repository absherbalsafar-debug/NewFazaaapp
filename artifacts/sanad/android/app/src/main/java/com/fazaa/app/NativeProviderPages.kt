package com.fazaa.app

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Campaign
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Image
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PhoneAndroid
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.runtime.CompositionLocalProvider
import kotlinx.coroutines.launch

internal enum class ProviderRoute { DASHBOARD, BUSINESS, VERIFY, EARNINGS, WALLET, REGISTER }
internal enum class VerificationDocumentType(val title: String, val hint: String, val required: Boolean, val multiple: Boolean) {
    SELFIE("الصورة الشخصية", "صورة واضحة لوجهك بإضاءة جيدة", true, false), ID_FRONT("الهوية من الأمام", "صورة كاملة وواضحة", true, false), ID_BACK("الهوية من الخلف", "صورة كاملة وواضحة", true, false), PORTFOLIO("صور الأعمال السابقة", "صور حقيقية من أعمالك", false, true), CERTIFICATE("الشهادات والتراخيص", "اختياري", false, true)
}
internal data class ProviderRequestUi(val id: String, val serviceType: String, val clientName: String, val city: String, val status: String)
internal data class ProviderProfileUi(val id: String, val name: String, val categoryName: String, val city: String, val bio: String = "", val rating: Double = 0.0, val reviewCount: Int = 0, val completedJobs: Int = 0, val yearsExperience: Int = 0, val isVerified: Boolean = false, val isAvailable: Boolean = false)
internal data class ProviderDashboardData(val profile: ProviderProfileUi?, val requests: List<ProviderRequestUi> = emptyList())
internal data class ProviderSubscriptionUi(val plan: String = "free", val status: String = "active", val endsAt: String? = null, val freeSlotNumber: Int? = null)
internal data class SubscriptionPlanUi(val id: String, val name: String, val monthlyPrice: String, val yearlyPrice: String, val description: String)
internal data class PaymentWalletUi(val id: String, val displayName: String, val description: String = "", val usage: String = "both")
internal data class PaymentRecordUi(val id: String, val reference: String, val plan: String, val status: String)
internal data class AdvertisementUi(val id: String, val title: String, val plan: String, val durationDays: Int, val budget: String, val status: String, val impressions: Int = 0, val clicks: Int = 0, val callClicks: Int = 0, val whatsappClicks: Int = 0)
internal data class ProviderBusinessData(val subscription: ProviderSubscriptionUi = ProviderSubscriptionUi(), val freeSlotsRemaining: Int = 0, val profileViews: Int = 0, val callClicks: Int = 0, val whatsappClicks: Int = 0, val serviceRequests: Int = 0, val plans: List<SubscriptionPlanUi> = emptyList(), val wallets: List<PaymentWalletUi> = emptyList(), val payments: List<PaymentRecordUi> = emptyList(), val advertisements: List<AdvertisementUi> = emptyList())
internal data class ProviderRegistrationDraft(val name: String, val phone: String, val password: String, val category: String, val city: String, val district: String, val yearsExperience: String, val bio: String, val role: String = "provider")

internal interface ProviderApi {
    suspend fun loadDashboard(): ProviderDashboardData
    suspend fun updateAvailability(profileId: String, available: Boolean): ProviderProfileUi
    suspend fun loadBusiness(): ProviderBusinessData
    suspend fun submitSubscription(plan: String, walletId: String, transactionReference: String, receiptName: String?)
    suspend fun submitAdvertisement(title: String, description: String, city: String, district: String, plan: String, durationDays: Int, budget: String, imageName: String?)
    suspend fun submitVerification(files: Map<VerificationDocumentType, List<String>>)
    suspend fun loadEarnings(): String
    suspend fun loadWallet(): List<PaymentWalletUi>
    suspend fun registerProvider(draft: ProviderRegistrationDraft)
    object Unconfigured : ProviderApi {
        override suspend fun loadDashboard() = ProviderDashboardData(null)
        override suspend fun updateAvailability(profileId: String, available: Boolean): ProviderProfileUi = error("لم يتم ربط خدمة التوفر بعد")
        override suspend fun loadBusiness() = ProviderBusinessData()
        override suspend fun submitSubscription(plan: String, walletId: String, transactionReference: String, receiptName: String?) = error("لم يتم ربط خدمة الاشتراك بعد")
        override suspend fun submitAdvertisement(title: String, description: String, city: String, district: String, plan: String, durationDays: Int, budget: String, imageName: String?) = error("لم يتم ربط خدمة الإعلانات بعد")
        override suspend fun submitVerification(files: Map<VerificationDocumentType, List<String>>) = error("لم يتم ربط خدمة التوثيق بعد")
        override suspend fun loadEarnings() = "٠"
        override suspend fun loadWallet() = emptyList<PaymentWalletUi>()
        override suspend fun registerProvider(draft: ProviderRegistrationDraft) = error("لم يتم ربط خدمة التسجيل بعد")
    }
}

private sealed interface Load<out T> { data object Waiting : Load<Nothing>; data class Success<T>(val value: T) : Load<T>; data class Error(val message: String) : Load<Nothing> }

@Composable private fun PageFrame(title: String, subtitle: String? = null, back: (() -> Unit)? = null, body: @Composable () -> Unit) {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        Scaffold(topBar = { Row(Modifier.fillMaxWidth().background(Color.White).padding(12.dp), verticalAlignment = Alignment.CenterVertically) { if (back != null) IconButton(back) { Icon(Icons.Default.ArrowForward, "رجوع", tint = FazaaNavy) }; Column(Modifier.weight(1f)) { Text(title, color = FazaaNavy, fontSize = 20.sp, fontWeight = FontWeight.Black); subtitle?.let { Text(it, color = Color.Gray, fontSize = 11.sp) } }; Brand() } }) { pad -> Column(Modifier.fillMaxSize().background(FazaaBackground).padding(pad).padding(horizontal = 16.dp).navigationBarsPadding()) { body() } }
    }
}
@Composable private fun Busy(text: String) { Box(Modifier.fillMaxWidth().padding(60.dp), contentAlignment = Alignment.Center) { Column(horizontalAlignment = Alignment.CenterHorizontally) { CircularProgressIndicator(color = FazaaNavy); Text(text, color = Color.Gray, modifier = Modifier.padding(top = 10.dp)) } } }
@Composable private fun ErrorView(message: String, retry: () -> Unit) { Card(Modifier.fillMaxWidth().padding(35.dp), colors = CardDefaults.cardColors(Color.White)) { Column(Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.ErrorOutline, null, tint = Color.Red, modifier = Modifier.size(40.dp)); Text("تعذر تحميل الصفحة", color = FazaaNavy, fontWeight = FontWeight.Bold); Text(message, color = Color.Gray, textAlign = TextAlign.Center, fontSize = 12.sp); OutlinedButton(retry, Modifier.padding(top = 12.dp)) { Icon(Icons.Default.Refresh, null); Text("إعادة المحاولة") } } } }
@Composable private fun EmptyView(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, message: String) { Column(Modifier.fillMaxWidth().padding(25.dp), horizontalAlignment = Alignment.CenterHorizontally) { Icon(icon, null, tint = FazaaNavy.copy(.55f), modifier = Modifier.size(42.dp)); Text(title, color = FazaaNavy, fontWeight = FontWeight.Bold); Text(message, color = Color.Gray, fontSize = 12.sp, textAlign = TextAlign.Center) } }
@Composable private fun Section(title: String, subtitle: String? = null, icon: androidx.compose.ui.graphics.vector.ImageVector? = null, body: @Composable () -> Unit) { Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(Color.White)) { Column(Modifier.padding(15.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { icon?.let { Icon(it, null, tint = FazaaNavy) }; Column(Modifier.weight(1f).padding(start = 8.dp)) { Text(title, color = FazaaNavy, fontWeight = FontWeight.Black); subtitle?.let { Text(it, color = Color.Gray, fontSize = 11.sp) } } }; Spacer(Modifier.height(10.dp)); body() } } }
@Composable private fun Stat(label: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier, tint: Color = FazaaNavy) { Card(modifier, colors = CardDefaults.cardColors(Color.White), shape = RoundedCornerShape(16.dp)) { Column(Modifier.padding(11.dp)) { Icon(icon, null, tint = tint, modifier = Modifier.size(18.dp)); Text(value, color = FazaaNavy, fontWeight = FontWeight.Black, fontSize = 21.sp); Text(label, color = Color.Gray, fontSize = 10.sp) } } }

@Composable internal fun ProviderDashboardPage(api: ProviderApi = ProviderApi.Unconfigured, onBack: (() -> Unit)? = null, onNavigate: (ProviderRoute) -> Unit = {}) {
    var state by remember { mutableStateOf<Load<ProviderDashboardData>>(Load.Waiting) }; var changing by remember { mutableStateOf(false) }; val scope = rememberCoroutineScope()
    fun reload() { scope.launch { state = Load.Waiting; state = runCatching { Load.Success(api.loadDashboard()) }.getOrElse { Load.Error(it.message ?: "حدث خطأ") } } }; LaunchedEffect(api) { reload() }
    PageFrame("لوحة المهني", "تابع طلباتك ونشاطك المهني", onBack) { when (val s = state) {
        Load.Waiting -> Busy("جاري تحميل لوحة المهني..."); is Load.Error -> ErrorView(s.message) { reload() }; is Load.Success -> { val data = s.value; val p = data.profile
            if (p == null) { EmptyView(Icons.Default.Business, "أكمل ملفك المهني", "أنشئ ملفك حتى تبدأ باستقبال طلبات العملاء."); Button({ onNavigate(ProviderRoute.REGISTER) }, Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(FazaaNavy)) { Text("الانتقال إلى التسجيل") } }
            else Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(FazaaNavy)) { Column(Modifier.padding(18.dp)) { Text("لوحة المهني", color = Color.White.copy(.7f)); Text("مرحباً، ${p.name}", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black); Text("${p.categoryName} · ${p.city}", color = Color.White.copy(.7f), fontSize = 12.sp); Row(Modifier.fillMaxWidth().padding(top = 14.dp), verticalAlignment = Alignment.CenterVertically) { Column(Modifier.weight(1f)) { Text(if (p.isAvailable) "متاح الآن" else "غير متاح", color = Color.White, fontWeight = FontWeight.Bold); Text("استقبال طلبات جديدة", color = Color.White.copy(.65f), fontSize = 11.sp) }; Switch(p.isAvailable, { desired -> if (!changing) scope.launch { changing = true; runCatching { api.updateAvailability(p.id, desired) }.onSuccess { state = Load.Success(data.copy(profile = it)) }.onFailure { state = Load.Error(it.message ?: "تعذر تحديث الحالة") }; changing = false } }, enabled = !changing) } } }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) { Stat("طلبات جديدة", data.requests.count { it.status == "pending" }.toString(), Icons.Default.Schedule, Modifier.weight(1f)); Stat("أعمال نشطة", data.requests.count { it.status == "accepted" || it.status == "in_progress" }.toString(), Icons.Default.Business, Modifier.weight(1f)) }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) { Stat("أعمال مكتملة", (p.completedJobs + data.requests.count { it.status == "completed" }).toString(), Icons.Default.CheckCircle, Modifier.weight(1f)); Stat("التقييم", "%.1f".format(p.rating), Icons.Default.Star, Modifier.weight(1f)) }
                Card(Modifier.fillMaxWidth().clickable { onNavigate(ProviderRoute.BUSINESS) }, colors = CardDefaults.cardColors(FazaaNavy.copy(.08f)), border = BorderStroke(1.dp, FazaaNavy.copy(.15f))) { Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Campaign, null, tint = FazaaNavy); Text("الاشتراك والإعلانات", color = FazaaNavy, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f).padding(horizontal = 10.dp)); Icon(Icons.Default.ArrowForward, null, tint = FazaaNavy) } }
                if (!p.isVerified) Card(Modifier.fillMaxWidth().clickable { onNavigate(ProviderRoute.VERIFY) }, colors = CardDefaults.cardColors(Color(0xFFFFF7E0))) { Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Shield, null, tint = Color(0xFF9A6800)); Text("وثّق ملفك لزيادة الثقة", color = Color(0xFF714F00), fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f).padding(horizontal = 10.dp)); Icon(Icons.Default.ArrowForward, null, tint = Color(0xFF9A6800)) } }
                Section("آخر الطلبات", "تابع أعمالك ورد على العملاء", Icons.Default.Description) { if (data.requests.isEmpty()) EmptyView(Icons.Default.Description, "لا توجد طلبات حتى الآن", "ستظهر طلبات العملاء هنا") else data.requests.take(4).forEachIndexed { i, r -> if (i > 0) HorizontalDivider(); Row(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Description, null, tint = FazaaNavy); Column(Modifier.weight(1f).padding(horizontal = 8.dp)) { Text(r.serviceType, color = FazaaNavy, fontWeight = FontWeight.Bold); Text("${r.clientName} · ${r.city}", color = Color.Gray, fontSize = 11.sp) }; Text(statusLabel(r.status), color = Color.Gray, fontSize = 10.sp) } } }; OutlinedButton({ reload() }, Modifier.fillMaxWidth()) { Icon(Icons.Default.Refresh, null); Text("تحديث الطلبات") }
            }
        }
    } }
}
private fun statusLabel(s: String) = when (s) { "pending" -> "بانتظار ردك"; "accepted" -> "تم القبول"; "in_progress" -> "قيد التنفيذ"; "completed" -> "مكتمل"; "rejected" -> "مرفوض"; else -> s }

@Composable internal fun ProviderBusinessPage(api: ProviderApi = ProviderApi.Unconfigured, onBack: (() -> Unit)? = null) {
    var state by remember { mutableStateOf<Load<ProviderBusinessData>>(Load.Waiting) }; var plan by remember { mutableStateOf("monthly") }; var wallet by remember { mutableStateOf("") }; var reference by remember { mutableStateOf("") }; var adTitle by remember { mutableStateOf("") }; var adDescription by remember { mutableStateOf("") }; var city by remember { mutableStateOf("") }; var district by remember { mutableStateOf("") }; var adPlan by remember { mutableStateOf("standard") }; var budget by remember { mutableStateOf("") }; var message by remember { mutableStateOf<String?>(null) }; val scope = rememberCoroutineScope()
    fun reload() { scope.launch { state = Load.Waiting; state = runCatching { Load.Success(api.loadBusiness()) }.getOrElse { Load.Error(it.message ?: "حدث خطأ") } } }; LaunchedEffect(api) { reload() }
    PageFrame("الاشتراك والإعلانات", "لوحة نمو الملف المهني", onBack) { when (val s = state) { Load.Waiting -> Busy("جاري تحميل لوحة الأعمال..."); is Load.Error -> ErrorView(s.message) { reload() }; is Load.Success -> { val b = s.value; val free = b.subscription.plan == "free" && b.subscription.status == "active"; Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Card(Modifier.fillMaxWidth(), shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(FazaaNavy)) { Column(Modifier.padding(18.dp)) { Text("اشتراكك الحالي", color = Color.White.copy(.7f)); Text(if (free) "مجاني لأول 300 مهني" else "اشتراك ${b.subscription.plan}", color = Color.White, fontSize = 23.sp, fontWeight = FontWeight.Black); Text(if (free) "المقعد المجاني رقم ${b.subscription.freeSlotNumber ?: "—"} · لا ينتهي" else b.subscription.endsAt ?: "أرسل طلب اشتراك للمراجعة", color = Color.White.copy(.7f), fontSize = 11.sp); Text("المتبقي من المقاعد المجانية: ${b.freeSlotsRemaining}", color = FazaaGold, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 12.dp)) } }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) { Stat("مشاهدات الملف", b.profileViews.toString(), Icons.Default.Visibility, Modifier.weight(1f)); Stat("ضغطات اتصال", b.callClicks.toString(), Icons.Default.Call, Modifier.weight(1f)) }; Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) { Stat("ضغطات واتساب", b.whatsappClicks.toString(), Icons.Default.PhoneAndroid, Modifier.weight(1f)); Stat("طلبات الخدمة", b.serviceRequests.toString(), Icons.Default.BarChart, Modifier.weight(1f)) }
        if (!free) Section("خطط اشتراك المهني", "اختر المدة المناسبة", Icons.Default.Security) { if (b.plans.isEmpty()) EmptyView(Icons.Default.Security, "لا توجد خطط مفعلة", "ستظهر عند ربط الاشتراكات") else b.plans.forEach { item -> Choice(plan == item.id, { plan = item.id }, item.name, item.description, item.monthlyPrice) } }
        if (!free) Section("اختر محفظة الدفع", "الدفع الرسمي سيُربط لاحقاً", Icons.Default.AccountBalanceWallet) { if (b.wallets.isEmpty()) EmptyView(Icons.Default.AccountBalanceWallet, "لا توجد محافظ مفعلة", "لا توجد محافظ متاحة حالياً") else b.wallets.forEach { item -> Choice(wallet == item.id, { wallet = item.id }, item.displayName, item.description, "اختيار") }; Field(reference, { reference = it }, "رقم العملية"); OutlinedButton({ scope.launch { runCatching { api.submitSubscription(plan, wallet, reference, null) }.onSuccess { message = "تم إرسال الطلب للمراجعة" }.onFailure { message = it.message } } }, enabled = wallet.isNotBlank(), modifier = Modifier.fillMaxWidth()) { Text("إرسال طلب الاشتراك") } }
        message?.let { Text(it, color = Color(0xFF137333), fontSize = 12.sp) }
        Section("طلبات الدفع السابقة", "لا يتم التفعيل قبل اعتماد الإدارة", Icons.Default.ReceiptLong) { if (b.payments.isEmpty()) EmptyView(Icons.Default.ReceiptLong, "لا توجد عمليات دفع حتى الآن", "ستظهر هنا") else b.payments.forEach { item -> Row(Modifier.fillMaxWidth().padding(8.dp), horizontalArrangement = Arrangement.SpaceBetween) { Text(item.reference, color = FazaaNavy); Text(paymentLabel(item.status), color = Color.Gray) } } }
        Section("إنشاء إعلان مدفوع", "يظهر بعد اعتماد الإدارة", Icons.Default.Campaign) { Field(adTitle, { adTitle = it }, "عنوان الإعلان"); Field(adDescription, { adDescription = it }, "وصف مختصر للخدمة", lines = 3); Field(city, { city = it }, "المدينة"); Field(district, { district = it }, "المنطقة"); listOf("standard" to "إعلان عادي · 7 أيام", "featured" to "إعلان مميز · 14 يوماً", "homepage" to "إعلان رئيسي · 30 يوماً", "vip" to "إعلان VIP · 60 يوماً").forEach { item -> Choice(adPlan == item.first, { adPlan = item.first }, item.second, "ظهور مدفوع داخل فزعة", "اختيار") }; Field(budget, { budget = it.filter(Char::isDigit) }, "ميزانية الإعلان", KeyboardType.Number); OutlinedButton({ val days = if (adPlan == "standard") 7 else if (adPlan == "featured") 14 else if (adPlan == "homepage") 30 else 60; if (adTitle.isBlank() || city.isBlank() || budget.isBlank()) message = "أكمل عنوان الإعلان والمدينة والميزانية" else scope.launch { runCatching { api.submitAdvertisement(adTitle, adDescription, city, district, adPlan, days, budget, null) }.onSuccess { message = "تم إرسال الإعلان للمراجعة" }.onFailure { message = it.message } } }, modifier = Modifier.fillMaxWidth()) { Icon(Icons.Default.Send, null); Text("إرسال الإعلان للمراجعة") } }
        Section("إعلاناتي", "تابع أداء إعلاناتك", Icons.Default.Campaign) { if (b.advertisements.isEmpty()) EmptyView(Icons.Default.Campaign, "ستظهر إعلاناتك هنا", "أنشئ إعلاناً مدفوعاً") else b.advertisements.forEach { ad -> Text("${ad.title} · ${adStatus(ad.status)} · ظهور ${ad.impressions} · نقرات ${ad.clicks}", color = FazaaNavy, fontSize = 12.sp, modifier = Modifier.padding(vertical = 5.dp)) } }; Spacer(Modifier.height(8.dp))
    } } } }
}
@Composable private fun Choice(selected: Boolean, onClick: () -> Unit, title: String, description: String, trailing: String) { Card(Modifier.fillMaxWidth().padding(vertical = 3.dp).clickable(onClick = onClick), border = BorderStroke(1.dp, if (selected) FazaaNavy else Color.LightGray), colors = CardDefaults.cardColors(if (selected) FazaaNavy.copy(.07f) else Color.White)) { Row(Modifier.padding(8.dp), verticalAlignment = Alignment.CenterVertically) { RadioButton(selected, onClick); Column(Modifier.weight(1f)) { Text(title, color = FazaaNavy, fontWeight = FontWeight.Bold); Text(description, color = Color.Gray, fontSize = 10.sp) }; Text(trailing, color = FazaaNavy, fontSize = 10.sp) } } }
private fun paymentLabel(s: String) = when (s) { "pending" -> "قيد المراجعة"; "approved" -> "مقبول"; "rejected" -> "مرفوض"; else -> s }
private fun adStatus(s: String) = when (s) { "pending" -> "بانتظار الاعتماد"; "active" -> "نشط"; "rejected" -> "مرفوض"; else -> s }

@Composable internal fun ProviderVerifyPage(api: ProviderApi = ProviderApi.Unconfigured, onBack: (() -> Unit)? = null, onChooseFile: (VerificationDocumentType) -> Unit = {}, onSubmitted: () -> Unit = {}) {
    var step by remember { mutableStateOf(0) }; var files by remember { mutableStateOf<Map<VerificationDocumentType, List<String>>>(emptyMap()) }; var sent by remember { mutableStateOf(false) }; var error by remember { mutableStateOf<String?>(null) }; val scope = rememberCoroutineScope(); val docs = VerificationDocumentType.entries; val current = docs[step]; val required = docs.filter { it.required }.all { !files[it].isNullOrEmpty() }
    if (sent) { PageFrame("توثيق الملف المهني") { Column(Modifier.fillMaxWidth().padding(top = 45.dp), horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF137333), modifier = Modifier.size(68.dp)); Text("طلبك قيد المراجعة", color = FazaaNavy, fontSize = 24.sp, fontWeight = FontWeight.Black); Text("لن يظهر ملفك قبل اعتماد فريق فزعة.", color = Color.Gray, textAlign = TextAlign.Center); Button(onSubmitted, Modifier.fillMaxWidth().padding(top = 20.dp), colors = ButtonDefaults.buttonColors(FazaaNavy)) { Text("العودة إلى لوحة المهني") } } }; return }
    PageFrame("توثيق الملف المهني", "حماية العملاء تبدأ من التوثيق", onBack) { Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) { Text("المرحلة ${step + 1} من ${docs.size} · ${(step + 1) * 100 / docs.size}%", color = FazaaNavy, fontWeight = FontWeight.Bold); Section(current.title, current.hint, Icons.Default.Description) { Card(Modifier.fillMaxWidth().clickable { onChooseFile(current) }, colors = CardDefaults.cardColors(FazaaNavy.copy(.06f)), border = BorderStroke(2.dp, FazaaNavy.copy(.25f))) { Column(Modifier.fillMaxWidth().padding(vertical = 28.dp), horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.Upload, null, tint = FazaaNavy, modifier = Modifier.size(36.dp)); Text("اضغط لاختيار ${if (current.multiple) "الملفات" else "الملف"}", color = FazaaNavy, fontWeight = FontWeight.Bold); Text("JPG أو PNG أو WEBP أو PDF — حتى 10 ميجابايت", color = Color.Gray, fontSize = 10.sp) } }; files[current]?.let { if (it.isNotEmpty()) Text("تم اختيار ${it.size} ملف: ${it.joinToString("، ")}", color = Color(0xFF137333), fontSize = 11.sp) }; error?.let { Text(it, color = Color.Red, fontSize = 11.sp) }; Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) { if (step > 0) OutlinedButton({ step-- }, Modifier.weight(1f)) { Text("رجوع") }; Button({ if (step < docs.lastIndex) step++ else if (!required) error = "أكمل الصورة الشخصية والهوية من الأمام والخلف" else scope.launch { runCatching { api.submitVerification(files) }.onSuccess { sent = true }.onFailure { error = it.message } } }, Modifier.weight(1f), colors = ButtonDefaults.buttonColors(FazaaNavy)) { Text(if (step < docs.lastIndex) "التالي" else "إرسال للمراجعة") } } } }; Spacer(Modifier.height(8.dp)) } }
internal fun ProviderVerifyFileSelected(current: Map<VerificationDocumentType, List<String>>, type: VerificationDocumentType, names: List<String>) = current.toMutableMap().apply { put(type, names) }

@Composable internal fun ProviderEarningsPage(api: ProviderApi = ProviderApi.Unconfigured, onBack: (() -> Unit)? = null, onDashboard: () -> Unit = {}) { var state by remember { mutableStateOf<Load<String>>(Load.Waiting) }; val scope = rememberCoroutineScope(); fun reload() { scope.launch { state = Load.Waiting; state = runCatching { Load.Success(api.loadEarnings()) }.getOrElse { Load.Error(it.message ?: "تعذر تحميل الأرباح") } } }; LaunchedEffect(api) { reload() }; PageFrame("أرباحي", "الرصيد وعمليات السحب", onBack) { when (val s = state) { Load.Waiting -> Busy("جاري تحميل الأرباح..."); is Load.Error -> ErrorView(s.message) { reload() }; is Load.Success -> Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) { Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(FazaaNavy), shape = RoundedCornerShape(24.dp)) { Column(Modifier.padding(20.dp)) { Text("الرصيد المتاح", color = Color.White); Text("${s.value} ر.ي", color = Color.White, fontSize = 38.sp, fontWeight = FontWeight.Black); Text("ستظهر الأرباح بعد اكتمال أول طلب مدفوع.", color = Color.White.copy(.6f), fontSize = 11.sp) } }; Section("الأرباح قيد التفعيل", "سيتم تفعيل المحفظة والسحب عند جاهزية نظام الدفع.", Icons.Default.Schedule) {}; Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(Color(0xFFEAF3FF))) { Text("لا توجد عمليات مالية حالياً، ولن يتم عرض أرقام تجريبية.", color = FazaaNavy, fontSize = 11.sp, modifier = Modifier.padding(12.dp)) }; OutlinedButton(onDashboard, Modifier.fillMaxWidth()) { Text("العودة إلى لوحتي") } } } } }
@Composable internal fun ProviderWalletPage(api: ProviderApi = ProviderApi.Unconfigured, onBack: (() -> Unit)? = null) { var state by remember { mutableStateOf<Load<List<PaymentWalletUi>>>(Load.Waiting) }; val scope = rememberCoroutineScope(); fun reload() { scope.launch { state = Load.Waiting; state = runCatching { Load.Success(api.loadWallet()) }.getOrElse { Load.Error(it.message ?: "تعذر تحميل وسائل الدفع") } } }; LaunchedEffect(api) { reload() }; PageFrame("وسائل الدفع", "إدارة بطاقاتك وأرصدة حسابك", onBack) { when (val s = state) { Load.Waiting -> Busy("جاري تحميل وسائل الدفع..."); is Load.Error -> ErrorView(s.message) { reload() }; is Load.Success -> Section("وسائل الدفع المحفوظة", "بيانات الدفع الرسمية فقط", Icons.Default.CreditCard) { if (s.value.isEmpty()) { EmptyView(Icons.Default.CreditCard, "لا توجد وسائل دفع محفوظة", "ستتمكن من إضافة وسيلة دفع عند تفعيل الدفع الإلكتروني."); OutlinedButton({}, enabled = false, modifier = Modifier.fillMaxWidth()) { Icon(Icons.Default.Add, null); Text("إضافة وسيلة دفع") } } else s.value.forEach { Text("${it.displayName} · ${it.description}", color = FazaaNavy, modifier = Modifier.padding(8.dp)) } } } } }

@Composable internal fun ProviderRegisterPage(api: ProviderApi = ProviderApi.Unconfigured, onBack: (() -> Unit)? = null, onCompleted: () -> Unit = {}, onVerify: () -> Unit = {}) { var step by remember { mutableStateOf(1) }; var name by remember { mutableStateOf("") }; var phone by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }; var category by remember { mutableStateOf("") }; var city by remember { mutableStateOf("") }; var district by remember { mutableStateOf("") }; var years by remember { mutableStateOf("1") }; var bio by remember { mutableStateOf("") }; var done by remember { mutableStateOf(false) }; var error by remember { mutableStateOf<String?>(null) }; val scope = rememberCoroutineScope(); if (done) { PageFrame("تسجيل مهني في فزعة") { Column(Modifier.fillMaxWidth().padding(top = 40.dp), horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF137333), modifier = Modifier.size(65.dp)); Text("تم حفظ طلبك بنجاح", color = FazaaNavy, fontSize = 24.sp, fontWeight = FontWeight.Black); Text("ملفك غير ظاهر للعملاء حالياً. أكمل التوثيق قبل الاعتماد.", color = Color.Gray, textAlign = TextAlign.Center); Button(onVerify, Modifier.fillMaxWidth().padding(top = 20.dp), colors = ButtonDefaults.buttonColors(FazaaNavy)) { Text("إكمال التوثيق الآن") }; OutlinedButton(onCompleted, Modifier.fillMaxWidth()) { Text("اختيار الاشتراك لاحقاً") } } }; return }; val titles = listOf("المعلومات الأساسية", "البيانات المهنية", "معرض الأعمال", "التوثيق والتحقق"); PageFrame("تسجيل مهني في فزعة", "رحلة واضحة لبناء الثقة", onBack) { Column(Modifier.fillMaxWidth().verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(12.dp)) { Text("المرحلة $step من 4", color = FazaaNavy, fontWeight = FontWeight.Bold); Section(titles[step - 1]) { when (step) { 1 -> Column(verticalArrangement = Arrangement.spacedBy(8.dp)) { Field(name, { name = it }, "الاسم الكامل"); Field(phone, { phone = it }, "رقم الهاتف", type = KeyboardType.Phone); Field(password, { password = it }, "كلمة المرور", type = KeyboardType.Password, secret = true) }; 2 -> Column(verticalArrangement = Arrangement.spacedBy(8.dp)) { Field(category, { category = it }, "القسم والتخصص الرئيسي"); Field(city, { city = it }, "المحافظة / المدينة"); Field(district, { district = it }, "المديرية"); Field(years, { years = it }, "سنوات الخبرة", type = KeyboardType.Number); Field(bio, { bio = it }, "نبذة مهنية مختصرة", lines = 4) }; 3 -> Column(horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.Image, null, tint = FazaaNavy, modifier = Modifier.size(40.dp)); Text("أضف صور أعمالك السابقة من شاشة التوثيق.", color = Color.Gray, modifier = Modifier.padding(top = 8.dp)) }; 4 -> Column { Text("بعد إنشاء الحساب ارفع الهوية والصورة الشخصية والأعمال أو الشهادات.", color = Color(0xFF714F00)); Text("✓ هوية أمامية وخلفية\n✓ صورة شخصية واضحة\n✓ صور أعمال سابقة\n✓ شهادات أو تراخيص", color = FazaaNavy, modifier = Modifier.padding(top = 8.dp)) } }; error?.let { Text(it, color = Color.Red, fontSize = 11.sp) }; Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) { if (step > 1) OutlinedButton({ step-- }, Modifier.weight(1f)) { Text("رجوع") }; Button({ error = null; if (step == 1 && (name.length < 3 || phone.length < 9 || password.length < 6)) error = "أكمل الاسم والهاتف وكلمة المرور" else if (step == 2 && (category.isBlank() || city.isBlank())) error = "أكمل القسم والمدينة" else if (step < 4) step++ else scope.launch { runCatching { api.registerProvider(ProviderRegistrationDraft(name, phone, password, category, city, district, years, bio)) }.onSuccess { done = true }.onFailure { error = it.message } } }, Modifier.weight(1f), colors = ButtonDefaults.buttonColors(FazaaNavy)) { Text(if (step == 4) "إنشاء الحساب والمتابعة" else "التالي") } } }; Text("لديك حساب بالفعل؟ سجل دخول", color = Color.Gray, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()) } } }
@Composable private fun Field(value: String, change: (String) -> Unit, label: String, type: KeyboardType = KeyboardType.Text, modifier: Modifier = Modifier, lines: Int = 1, secret: Boolean = false) { OutlinedTextField(value, change, label = { Text(label) }, minLines = lines, visualTransformation = if (secret) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None, keyboardOptions = KeyboardOptions(keyboardType = type), modifier = modifier.fillMaxWidth()) }
@Composable internal fun NativeProviderPage(route: String, api: ProviderApi = ProviderApi.Unconfigured, onBack: () -> Unit = {}, onNavigate: (ProviderRoute) -> Unit = {}, onChooseFile: (VerificationDocumentType) -> Unit = {}) { when (route) { "/provider-dashboard" -> ProviderDashboardPage(api, onBack, onNavigate); "/provider-business" -> ProviderBusinessPage(api, onBack); "/provider-verify", "/verify" -> ProviderVerifyPage(api, onBack, onChooseFile) { onNavigate(ProviderRoute.DASHBOARD) }; "/earnings" -> ProviderEarningsPage(api, onBack) { onNavigate(ProviderRoute.DASHBOARD) }; "/wallet" -> ProviderWalletPage(api, onBack); "/register" -> ProviderRegisterPage(api, onBack, { onNavigate(ProviderRoute.BUSINESS) }, { onNavigate(ProviderRoute.VERIFY) }); else -> ErrorView("المسار غير معروف: $route") {} } }
@Composable private fun Brand() { Box(Modifier.size(44.dp).background(FazaaGold, CircleShape), contentAlignment = Alignment.Center) { Text("ف", color = FazaaNavy, fontSize = 25.sp, fontWeight = FontWeight.Black) } }
