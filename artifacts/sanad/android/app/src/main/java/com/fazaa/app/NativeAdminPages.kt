package com.fazaa.app

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.runtime.CompositionLocalProvider
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

data class AdminStats(val totalUsers: Int = 0, val totalProviders: Int = 0, val totalClients: Int = 0, val totalRequests: Int = 0, val completedRequests: Int = 0, val pendingProviders: Int = 0)
data class AdminServiceStat(val categoryName: String, val requestCount: Int, val providerCount: Int)
data class AdminUser(val id: Int, val name: String, val phone: String, val role: String, val createdAt: String, val status: String)
data class AdminProvider(val id: Int, val name: String, val categoryName: String? = null, val city: String? = null, val rating: Double? = null, val completedJobs: Int = 0, val isVerified: Boolean = false)
data class PaymentWalletSetting(val wallet: String, val merchantName: String = "", val merchantAccount: String = "", val instructions: String = "", val isActive: Boolean = true)
data class SubscriptionPayment(val id: Int, val providerId: Int, val plan: String, val wallet: String, val transactionReference: String, val status: String, val adminNote: String? = null, val createdAt: String = "")
data class AdminComplaintEvidence(val id: Int, val originalName: String, val objectPath: String)
data class AdminComplaint(val id: Int, val clientName: String, val subject: String, val description: String, val status: String, val priority: String, val providerId: Int, val evidence: List<AdminComplaintEvidence> = emptyList())
data class AdminService(val id: Int, val name: String, val isActive: Boolean = true)
data class AdminSpecialization(val id: Int, val name: String, val isActive: Boolean = true, val services: List<AdminService> = emptyList())
data class AdminCategory(val id: Int, val name: String, val icon: String = "🔧", val specializations: List<AdminSpecialization> = emptyList())
data class SponsoredAd(val id: Int, val title: String, val providerName: String? = null, val providerId: Int = 0, val providerPhone: String? = null, val city: String? = null, val categoryName: String? = null, val description: String? = null, val imageUrl: String? = null, val plan: String = "standard")

/** واجهة فصل الشبكة عن الواجهة؛ يحقن التطبيق موصل HTTP حقيقياً لاحقاً. */
interface AdminApi {
    suspend fun getStats(): AdminStats
    suspend fun getServiceStats(): List<AdminServiceStat>
    suspend fun listUsers(search: String?, role: String?): List<AdminUser>
    suspend fun updateUserStatus(id: Int, status: String)
    suspend fun listProviders(): List<AdminProvider>
    suspend fun verifyProvider(id: Int, verified: Boolean)
    suspend fun listSubscriptionPayments(): List<SubscriptionPayment>
    suspend fun listPaymentWallets(): List<PaymentWalletSetting>
    suspend fun reviewSubscriptionPayment(id: Int, status: String, note: String?)
    suspend fun reviewAdvertisement(id: Int, status: String, note: String?)
    suspend fun savePaymentWallet(setting: PaymentWalletSetting)
    suspend fun listComplaints(): List<AdminComplaint>
    suspend fun updateComplaint(id: Int, status: String, suspendProvider: Boolean = false, resolutionNote: String? = null)
    suspend fun getTaxonomy(): List<AdminCategory>
    suspend fun createCategory(name: String)
    suspend fun createSpecialization(categoryId: Int, name: String)
    suspend fun createService(specializationId: Int, name: String)
    suspend fun listFeaturedAds(): List<SponsoredAd>
    suspend fun trackAd(id: Int, event: String)
}

object UnconfiguredAdminApi : AdminApi {
    override suspend fun getStats() = AdminStats()
    override suspend fun getServiceStats() = emptyList<AdminServiceStat>()
    override suspend fun listUsers(search: String?, role: String?) = emptyList<AdminUser>()
    override suspend fun updateUserStatus(id: Int, status: String) = Unit
    override suspend fun listProviders() = emptyList<AdminProvider>()
    override suspend fun verifyProvider(id: Int, verified: Boolean) = Unit
    override suspend fun listSubscriptionPayments() = emptyList<SubscriptionPayment>()
    override suspend fun listPaymentWallets() = emptyList<PaymentWalletSetting>()
    override suspend fun reviewSubscriptionPayment(id: Int, status: String, note: String?) = Unit
    override suspend fun reviewAdvertisement(id: Int, status: String, note: String?) = Unit
    override suspend fun savePaymentWallet(setting: PaymentWalletSetting) = Unit
    override suspend fun listComplaints() = emptyList<AdminComplaint>()
    override suspend fun updateComplaint(id: Int, status: String, suspendProvider: Boolean, resolutionNote: String?) = Unit
    override suspend fun getTaxonomy() = emptyList<AdminCategory>()
    override suspend fun createCategory(name: String) = Unit
    override suspend fun createSpecialization(categoryId: Int, name: String) = Unit
    override suspend fun createService(specializationId: Int, name: String) = Unit
    override suspend fun listFeaturedAds() = emptyList<SponsoredAd>()
    override suspend fun trackAd(id: Int, event: String) = Unit
}

private sealed interface AdminLoad<out T> { data object Loading : AdminLoad<Nothing>; data class Ready<T>(val value: T) : AdminLoad<T>; data class Failed(val message: String) : AdminLoad<Nothing> }
private suspend fun <T> adminLoad(block: suspend () -> T): AdminLoad<T> = try { AdminLoad.Ready(block()) } catch (e: Exception) { AdminLoad.Failed(e.message ?: "تعذر تحميل البيانات") }

@Composable
internal fun NativeAdminPageScreen(route: String, onBack: () -> Unit, api: AdminApi = UnconfiguredAdminApi) {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        when (route) {
            "/admin" -> AdminDashboardPage(onBack, api)
            "/admin/users" -> AdminUsersPage(onBack, api)
            "/admin/providers" -> AdminProvidersPage(onBack, api)
            "/admin/business" -> AdminBusinessPage(onBack, api)
            "/admin/complaints" -> AdminComplaintsPage(onBack, api)
            "/admin/taxonomy" -> AdminTaxonomyPage(onBack, api)
            "/sponsored-preview" -> SponsoredPreviewPage(onBack, api)
            else -> AdminFrame("فزعة", "المسار غير معروف", onBack) { AdminEmpty("صفحة الإدارة غير موجودة") }
        }
    }
}

@Composable
private fun AdminFrame(title: String, subtitle: String? = null, onBack: () -> Unit, body: @Composable () -> Unit) {
    Column(Modifier.fillMaxSize().background(FazaaBackground)) {
        Row(Modifier.fillMaxWidth().background(Color.White).padding(horizontal = 12.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.Default.ArrowForward, "رجوع", tint = FazaaNavy) }
            Column { Text(title, color = FazaaNavy, fontSize = 21.sp, fontWeight = FontWeight.Black); subtitle?.let { Text(it, color = Color(0xFF708198), fontSize = 11.sp) } }
        }
        body()
    }
}

@Composable
private fun AdminDashboardPage(onBack: () -> Unit, api: AdminApi) {
    var stats: AdminLoad<AdminStats> by remember { mutableStateOf(AdminLoad.Loading) }
    var services: AdminLoad<List<AdminServiceStat>> by remember { mutableStateOf(AdminLoad.Loading) }
    var refresh by remember { mutableStateOf(0) }
    LaunchedEffect(refresh) { stats = adminLoad { api.getStats() }; services = adminLoad { api.getServiceStats() } }
    AdminFrame("لوحة التحكم", "نظرة سريعة على أداء منصة فزعة", onBack) { when (val result = stats) { AdminLoad.Loading -> AdminLoading(); is AdminLoad.Failed -> AdminError(result.message) { refresh++ }; is AdminLoad.Ready -> AdminDashboardBody(result.value, services) } }
}

@Composable
private fun AdminDashboardBody(stats: AdminStats, services: AdminLoad<List<AdminServiceStat>>) {
    LazyColumn(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text("ملخص المنصة", color = FazaaNavy, fontSize = 21.sp, fontWeight = FontWeight.Black) }
        item { Column(verticalArrangement = Arrangement.spacedBy(10.dp)) { listOf("إجمالي المستخدمين" to stats.totalUsers, "مزودو الخدمة" to stats.totalProviders, "العملاء" to stats.totalClients, "إجمالي الطلبات" to stats.totalRequests, "الطلبات المنجزة" to stats.completedRequests, "بانتظار التوثيق" to stats.pendingProviders).chunked(2).forEach { row -> Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) { row.forEach { (label, value) -> AdminMetric(label, value, Modifier.weight(1f)) } } } } }
        item { Text("إحصائيات الخدمات", color = FazaaNavy, fontSize = 18.sp, fontWeight = FontWeight.Black) }
        item { Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp)) { when (services) { AdminLoad.Loading -> AdminLoading(Modifier.padding(20.dp)); is AdminLoad.Failed -> Text(services.message, color = Color(0xFFB3261E), modifier = Modifier.padding(20.dp)); is AdminLoad.Ready -> if (services.value.isEmpty()) AdminEmpty("لا توجد بيانات متاحة") else Column(Modifier.padding(15.dp), verticalArrangement = Arrangement.spacedBy(13.dp)) { services.value.forEach { AdminBar(it) } } } } }
    }
}

@Composable private fun AdminMetric(label: String, value: Int, modifier: Modifier) { Card(modifier, colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(14.dp)) { Text(label, color = Color(0xFF708198), fontSize = 12.sp); Text(value.toString(), color = FazaaNavy, fontSize = 28.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 5.dp)) } } }
@Composable private fun AdminBar(stat: AdminServiceStat) { val max = maxOf(1, stat.requestCount, stat.providerCount); Column { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(stat.categoryName, color = FazaaNavy, fontWeight = FontWeight.Bold); Text("${stat.requestCount} طلب · ${stat.providerCount} مهني", color = Color(0xFF708198), fontSize = 11.sp) }; Box(Modifier.fillMaxWidth().padding(top = 6.dp).height(8.dp).background(Color(0xFFEAF0F7), RoundedCornerShape(8.dp))) { Box(Modifier.fillMaxWidth((stat.requestCount.toFloat() / max).coerceIn(0f, 1f)).height(8.dp).background(FazaaGold, RoundedCornerShape(8.dp))) } } }

@Composable
private fun AdminUsersPage(onBack: () -> Unit, api: AdminApi) {
    var search by remember { mutableStateOf("") }; var role by remember { mutableStateOf("all") }; var state: AdminLoad<List<AdminUser>> by remember { mutableStateOf(AdminLoad.Loading) }; var refresh by remember { mutableStateOf(0) }; var error by remember { mutableStateOf<String?>(null) }; val scope = rememberCoroutineScope()
    LaunchedEffect(search, role, refresh) { state = adminLoad { api.listUsers(search.trim().ifBlank { null }, role.takeUnless { it == "all" }) } }
    AdminFrame("إدارة المستخدمين", "المستخدمون والعملاء وحالات الحساب", onBack) { LazyColumn(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) {
        item { OutlinedTextField(search, { search = it }, Modifier.fillMaxWidth(), label = { Text("بحث بالاسم أو رقم الهاتف") }, leadingIcon = { Icon(Icons.Default.Search, null) }, singleLine = true) }
        item { Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) { listOf("all" to "الكل", "client" to "عميل", "provider" to "مزود خدمة").forEach { (key, label) -> FilterChip(selected = role == key, onClick = { role = key }, label = { Text(label) }) } } }
        item { error?.let { AdminErrorBanner(it) } }
        when (val result = state) { AdminLoad.Loading -> item { AdminLoading() }; is AdminLoad.Failed -> item { AdminError(result.message) { refresh++ } }; is AdminLoad.Ready -> if (result.value.isEmpty()) item { AdminEmpty("لا يوجد مستخدمين") } else items(result.value, key = { it.id }) { user -> AdminUserCard(user) { status -> scope.launch { error = try { api.updateUserStatus(user.id, status); null } catch (e: Exception) { e.message }; if (error == null) refresh++ } } } }
    } }
}

@Composable private fun AdminUserCard(user: AdminUser, change: (String) -> Unit) { Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Person, null, tint = FazaaNavy); Column(Modifier.weight(1f).padding(horizontal = 9.dp)) { Text(user.name, color = FazaaNavy, fontWeight = FontWeight.Black); Text(user.phone, color = Color(0xFF708198), fontSize = 12.sp) }; AdminStatus(user.status) }; Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) { AdminPill(adminRole(user.role)); AdminPill(user.createdAt.ifBlank { "تاريخ غير متاح" }) }; Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) { if (user.status != "active") OutlinedButton(onClick = { change("active") }, modifier = Modifier.weight(1f)) { Text("تنشيط", color = Color(0xFF16833B)) }; if (user.status != "banned" && user.role != "admin") OutlinedButton(onClick = { change("banned") }, modifier = Modifier.weight(1f)) { Text("حظر", color = Color(0xFFB3261E)) } } } } }

@Composable
private fun AdminProvidersPage(onBack: () -> Unit, api: AdminApi) { var state: AdminLoad<List<AdminProvider>> by remember { mutableStateOf(AdminLoad.Loading) }; var refresh by remember { mutableStateOf(0) }; var error by remember { mutableStateOf<String?>(null) }; val scope = rememberCoroutineScope(); LaunchedEffect(refresh) { state = adminLoad { api.listProviders() } }; AdminFrame("إدارة المهنيين", "التوثيق والتقييم والأعمال المنجزة", onBack) { LazyColumn(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) { item { error?.let { AdminErrorBanner(it) } }; when (val result = state) { AdminLoad.Loading -> item { AdminLoading() }; is AdminLoad.Failed -> item { AdminError(result.message) { refresh++ } }; is AdminLoad.Ready -> if (result.value.isEmpty()) item { AdminEmpty("لا يوجد مهنيين") } else items(result.value, key = { it.id }) { provider -> AdminProviderCard(provider) { verified -> scope.launch { error = try { api.verifyProvider(provider.id, verified); null } catch (e: Exception) { e.message }; if (error == null) refresh++ } } } } } } }
@Composable private fun AdminProviderCard(provider: AdminProvider, change: (Boolean) -> Unit) { Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.VerifiedUser, null, tint = FazaaNavy); Column(Modifier.weight(1f).padding(horizontal = 9.dp)) { Text(provider.name, color = FazaaNavy, fontWeight = FontWeight.Black); Text("${provider.categoryName ?: "بدون تصنيف"} · ${provider.city ?: "المدينة غير محددة"}", color = Color(0xFF708198), fontSize = 12.sp) }; AdminVerification(provider.isVerified) }; Text("التقييم: ${provider.rating?.let { "%.1f".format(it) } ?: "-"} · الأعمال المنجزة: ${provider.completedJobs}", color = Color(0xFF8C6B00), fontSize = 12.sp); OutlinedButton(onClick = { change(!provider.isVerified) }, modifier = Modifier.fillMaxWidth()) { Text(if (provider.isVerified) "إلغاء التوثيق" else "توثيق المهني") } } } }

@Composable
private fun AdminBusinessPage(onBack: () -> Unit, api: AdminApi) { var payments: AdminLoad<List<SubscriptionPayment>> by remember { mutableStateOf(AdminLoad.Loading) }; var wallets: AdminLoad<List<PaymentWalletSetting>> by remember { mutableStateOf(AdminLoad.Loading) }; var refresh by remember { mutableStateOf(0) }; var adId by remember { mutableStateOf("") }; var note by remember { mutableStateOf("") }; var error by remember { mutableStateOf<String?>(null) }; val scope = rememberCoroutineScope(); LaunchedEffect(refresh) { payments = adminLoad { api.listSubscriptionPayments() }; wallets = adminLoad { api.listPaymentWallets() } }; AdminFrame("الاشتراكات والإعلانات", "راجع التحويلات والمحافظ والإعلانات", onBack) { LazyColumn(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(13.dp)) {
    item { Text("اعتماد إعلان برقم", color = FazaaNavy, fontWeight = FontWeight.Black, fontSize = 18.sp) }
    item { Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { OutlinedTextField(adId, { adId = it.filter(Char::isDigit) }, Modifier.fillMaxWidth(), label = { Text("رقم الإعلان") }, singleLine = true); OutlinedTextField(note, { note = it }, Modifier.fillMaxWidth(), label = { Text("ملاحظة الإدارة (اختيارية)") }, minLines = 2); error?.let { AdminErrorBanner(it) }; Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) { Button(onClick = { adminReviewAd(scope, api, adId, "active", note) { error = it; if (it == null) { adId = ""; note = "" } } }, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = FazaaNavy)) { Text("تفعيل") }; OutlinedButton(onClick = { adminReviewAd(scope, api, adId, "rejected", note) { error = it } }, modifier = Modifier.weight(1f)) { Text("رفض") } } } } }
    item { Text("أرقام وحسابات المحافظ", color = FazaaNavy, fontWeight = FontWeight.Black, fontSize = 18.sp) }
    when (val result = wallets) { AdminLoad.Loading -> item { AdminLoading() }; is AdminLoad.Failed -> item { AdminError(result.message) { refresh++ } }; is AdminLoad.Ready -> if (result.value.isEmpty()) item { AdminEmpty("لا توجد محافظ مهيأة") } else items(result.value, key = { it.wallet }) { wallet -> AdminWalletCard(wallet, api, scope) { refresh++ } } }
    item { Text("طلبات تحويل الاشتراك", color = FazaaNavy, fontWeight = FontWeight.Black, fontSize = 18.sp) }
    when (val result = payments) { AdminLoad.Loading -> item { AdminLoading() }; is AdminLoad.Failed -> item { AdminError(result.message) { refresh++ } }; is AdminLoad.Ready -> if (result.value.isEmpty()) item { AdminEmpty("لا توجد طلبات دفع") } else items(result.value, key = { it.id }) { payment -> AdminPaymentCard(payment, api, scope) { refresh++ } } }
} } }

private fun adminReviewAd(scope: CoroutineScope, api: AdminApi, text: String, status: String, note: String, done: (String?) -> Unit) { val id = text.toIntOrNull(); if (id == null) { done("أدخل رقم الإعلان"); return }; scope.launch { done(try { api.reviewAdvertisement(id, status, note.trim().ifBlank { null }); null } catch (e: Exception) { e.message }) } }
@Composable private fun AdminWalletCard(initial: PaymentWalletSetting, api: AdminApi, scope: CoroutineScope, saved: () -> Unit) { var setting by remember(initial) { mutableStateOf(initial) }; var error by remember { mutableStateOf<String?>(null) }; Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Text(adminWallet(setting.wallet), color = FazaaNavy, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f)); Text("مفعلة", color = Color(0xFF708198), fontSize = 11.sp); Switch(checked = setting.isActive, onCheckedChange = { setting = setting.copy(isActive = it) }) }; OutlinedTextField(setting.merchantName, { setting = setting.copy(merchantName = it) }, Modifier.fillMaxWidth(), label = { Text("اسم التاجر") }, singleLine = true); OutlinedTextField(setting.merchantAccount, { setting = setting.copy(merchantAccount = it) }, Modifier.fillMaxWidth(), label = { Text("رقم أو حساب التاجر") }, singleLine = true); OutlinedTextField(setting.instructions, { setting = setting.copy(instructions = it) }, Modifier.fillMaxWidth(), label = { Text("تعليمات التحويل") }, minLines = 2); error?.let { AdminErrorBanner(it) }; Button(onClick = { scope.launch { error = try { api.savePaymentWallet(setting); null } catch (e: Exception) { e.message }; if (error == null) saved() } }, modifier = Modifier.fillMaxWidth()) { Text("حفظ إعدادات ${adminWallet(setting.wallet)}") } } } }
@Composable private fun AdminPaymentCard(payment: SubscriptionPayment, api: AdminApi, scope: CoroutineScope, reviewed: () -> Unit) { var note by remember { mutableStateOf(payment.adminNote.orEmpty()) }; var error by remember { mutableStateOf<String?>(null) }; Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) { Row { Text("#${payment.id}", color = FazaaNavy, fontWeight = FontWeight.Black); Spacer(Modifier.width(8.dp)); AdminStatus(payment.status) }; Text("المهني #${payment.providerId} · ${if (payment.plan == "yearly") "سنوي" else "شهري"}", color = Color(0xFF40516A), fontSize = 13.sp); Text("محفظة ${adminWallet(payment.wallet)} · رقم العملية: ${payment.transactionReference}", color = Color(0xFF708198), fontSize = 12.sp); if (payment.status == "pending") { OutlinedTextField(note, { note = it }, Modifier.fillMaxWidth(), label = { Text("ملاحظة المراجعة") }, minLines = 2); error?.let { AdminErrorBanner(it) }; Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) { Button(onClick = { scope.launch { error = try { api.reviewSubscriptionPayment(payment.id, "approved", note.trim().ifBlank { null }); null } catch (e: Exception) { e.message }; if (error == null) reviewed() } }, modifier = Modifier.weight(1f)) { Text("اعتماد") }; OutlinedButton(onClick = { scope.launch { error = try { api.reviewSubscriptionPayment(payment.id, "rejected", note.trim().ifBlank { null }); null } catch (e: Exception) { e.message }; if (error == null) reviewed() } }, modifier = Modifier.weight(1f)) { Text("رفض") } } } else Text("تمت المراجعة", color = Color(0xFF708198), fontSize = 12.sp) } } }

@Composable
private fun AdminComplaintsPage(onBack: () -> Unit, api: AdminApi) { var state: AdminLoad<List<AdminComplaint>> by remember { mutableStateOf(AdminLoad.Loading) }; var refresh by remember { mutableStateOf(0) }; var error by remember { mutableStateOf<String?>(null) }; val scope = rememberCoroutineScope(); LaunchedEffect(refresh) { state = adminLoad { api.listComplaints() } }; AdminFrame("الشكاوى والنزاعات", "راجع الأدلة واتخذ إجراءً موثقاً", onBack) { LazyColumn(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) { item { error?.let { AdminErrorBanner(it) } }; when (val result = state) { AdminLoad.Loading -> item { AdminLoading() }; is AdminLoad.Failed -> item { AdminError(result.message) { refresh++ } }; is AdminLoad.Ready -> if (result.value.isEmpty()) item { AdminEmpty("لا توجد شكاوى مسجلة") } else items(result.value, key = { it.id }) { complaint -> AdminComplaintCard(complaint) { status, suspend -> scope.launch { error = try { api.updateComplaint(complaint.id, status, suspend, if (suspend) "تم إيقاف المهني مؤقتاً لحماية العملاء" else null); null } catch (e: Exception) { e.message }; if (error == null) refresh++ } } } } } } }
@Composable private fun AdminComplaintCard(item: AdminComplaint, change: (String, Boolean) -> Unit) { Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Warning, null, tint = Color(0xFFB77900)); Text("#${item.id} — ${item.subject}", color = FazaaNavy, fontWeight = FontWeight.Black, modifier = Modifier.weight(1f)); AdminStatus(item.status) }; Text("العميل: ${item.clientName} · المهني #${item.providerId} · أولوية ${item.priority}", color = Color(0xFF708198), fontSize = 12.sp); Text(item.description, color = Color(0xFF40516A), modifier = Modifier.fillMaxWidth().background(Color(0xFFF5F7FA), RoundedCornerShape(12.dp)).padding(10.dp)); if (item.evidence.isNotEmpty()) Text("الأدلة: ${item.evidence.joinToString(" · ") { it.originalName.ifBlank { "ملف" } }}", color = FazaaNavy, fontSize = 12.sp); Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) { OutlinedButton(onClick = { change("under_review", false) }, modifier = Modifier.weight(1f)) { Text("قيد المراجعة", fontSize = 10.sp) }; OutlinedButton(onClick = { change("resolved", true) }, modifier = Modifier.weight(1f)) { Text("إيقاف مؤقت", fontSize = 10.sp) }; Button(onClick = { change("resolved", false) }, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16833B))) { Text("حل الشكوى", fontSize = 10.sp) } } } } }

@Composable
private fun AdminTaxonomyPage(onBack: () -> Unit, api: AdminApi) { var state: AdminLoad<List<AdminCategory>> by remember { mutableStateOf(AdminLoad.Loading) }; var refresh by remember { mutableStateOf(0) }; var category by remember { mutableStateOf("") }; var error by remember { mutableStateOf<String?>(null) }; val scope = rememberCoroutineScope(); LaunchedEffect(refresh) { state = adminLoad { api.getTaxonomy() } }; AdminFrame("التخصصات والخدمات", "إدارة التصنيفات دون تحديث التطبيق", onBack) { LazyColumn(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) { item { Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(7.dp)) { OutlinedTextField(category, { category = it }, Modifier.weight(1f), label = { Text("اسم قسم جديد") }, singleLine = true); Button(onClick = { val value = category.trim(); if (value.isBlank()) error = "أدخل اسم القسم" else scope.launch { error = try { api.createCategory(value); null } catch (e: Exception) { e.message }; if (error == null) { category = ""; refresh++ } } }) { Text("إضافة") } } }; item { error?.let { AdminErrorBanner(it) } }; when (val result = state) { AdminLoad.Loading -> item { AdminLoading() }; is AdminLoad.Failed -> item { AdminError(result.message) { refresh++ } }; is AdminLoad.Ready -> if (result.value.isEmpty()) item { AdminEmpty("لا توجد تصنيفات") } else items(result.value, key = { it.id }) { categoryItem -> AdminCategoryCard(categoryItem, api, scope) { refresh++ } } } } } }
@Composable private fun AdminCategoryCard(category: AdminCategory, api: AdminApi, scope: CoroutineScope, changed: () -> Unit) { var specialization by remember { mutableStateOf("") }; var service by remember { mutableStateOf("") }; var error by remember { mutableStateOf<String?>(null) }; Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { Text("${category.icon} ${category.name}", color = FazaaNavy, fontSize = 18.sp, fontWeight = FontWeight.Black); category.specializations.forEach { spec -> Text("${spec.name} · ${spec.services.size} خدمات", color = FazaaNavy, fontWeight = FontWeight.Bold); if (spec.services.isNotEmpty()) Text(spec.services.joinToString(" · ") { it.name }, color = Color(0xFF708198), fontSize = 12.sp); Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) { OutlinedTextField(service, { service = it }, Modifier.weight(1f), label = { Text("خدمة جديدة") }, singleLine = true); TextButton(onClick = { val value = service.trim(); if (value.isNotBlank()) scope.launch { error = try { api.createService(spec.id, value); null } catch (e: Exception) { e.message }; if (error == null) { service = ""; changed() } } }) { Text("إضافة") } } }; Row(horizontalArrangement = Arrangement.spacedBy(5.dp)) { OutlinedTextField(specialization, { specialization = it }, Modifier.weight(1f), label = { Text("تخصص جديد") }, singleLine = true); TextButton(onClick = { val value = specialization.trim(); if (value.isNotBlank()) scope.launch { error = try { api.createSpecialization(category.id, value); null } catch (e: Exception) { e.message }; if (error == null) { specialization = ""; changed() } } }) { Text("تخصص") } }; error?.let { AdminErrorBanner(it) } } } }

@Composable
private fun SponsoredPreviewPage(onBack: () -> Unit, api: AdminApi) { var state: AdminLoad<List<SponsoredAd>> by remember { mutableStateOf(AdminLoad.Loading) }; LaunchedEffect(Unit) { state = adminLoad { api.listFeaturedAds() } }; AdminFrame("الإعلانات الممولة", "معاينة الظهور داخل تطبيق العميل", onBack) { LazyColumn(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) { item { Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = FazaaNavy), shape = RoundedCornerShape(22.dp)) { Column(Modifier.padding(18.dp)) { Text("معاينة الظهور المدفوع", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp); Text("إعلانات بارزة مع شارة واضحة وتجربة شفافة للعميل.", color = Color.White.copy(alpha = .75f), fontSize = 12.sp, modifier = Modifier.padding(top = 5.dp)) } } }; when (val result = state) { AdminLoad.Loading -> item { AdminLoading() }; is AdminLoad.Failed -> item { AdminError(result.message) {} }; is AdminLoad.Ready -> if (result.value.isEmpty()) item { AdminEmpty("لا توجد إعلانات نشطة حالياً") } else items(result.value.take(6), key = { it.id }) { ad -> AdminAdCard(ad) } }; item { AdminInfo("يتم تسجيل الظهور والنقر والاتصال وواتساب لقياس أثر الإعلان.") } } } }
@Composable private fun AdminAdCard(ad: SponsoredAd) { val vip = ad.plan == "vip"; Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFFFFFDF4)), shape = RoundedCornerShape(20.dp), border = BorderStroke(2.dp, if (vip) FazaaNavy else Color(0xFFEADBA7))) { Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(7.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Text(if (vip) "إعلان VIP" else "إعلان ممول", color = if (vip) Color.White else Color(0xFF8C6B00), fontWeight = FontWeight.Black, modifier = Modifier.background(if (vip) FazaaNavy else Color(0xFFFFF1C7), RoundedCornerShape(50)).padding(horizontal = 9.dp, vertical = 5.dp)); Spacer(Modifier.weight(1f)); Icon(Icons.Default.Visibility, null, tint = Color(0xFF708198)) }; Text(ad.title, color = FazaaNavy, fontWeight = FontWeight.Black, fontSize = 16.sp); Text("${ad.providerName ?: "مهني موصى به"}${ad.city?.let { " · $it" } ?: ""}", color = Color(0xFF708198), fontSize = 12.sp); ad.description?.takeIf { it.isNotBlank() }?.let { Text(it, color = Color(0xFF40516A), maxLines = 2, overflow = TextOverflow.Ellipsis, fontSize = 12.sp) }; Button(onClick = { }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = FazaaNavy)) { Text("عرض الملف") } } } }

@Composable private fun AdminLoading(modifier: Modifier = Modifier) { Box(modifier.fillMaxWidth().padding(28.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = FazaaNavy, modifier = Modifier.size(30.dp)) } }
@Composable private fun AdminEmpty(text: String) { Box(Modifier.fillMaxWidth().padding(28.dp), contentAlignment = Alignment.Center) { Column(horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.Info, null, tint = Color(0xFF708198)); Text(text, color = Color(0xFF708198), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 7.dp)) } } }
@Composable private fun AdminError(message: String, retry: () -> Unit) { Column(Modifier.fillMaxWidth().padding(28.dp), horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.WifiOff, null, tint = Color(0xFFB3261E)); Text(message, color = Color(0xFFB3261E), textAlign = TextAlign.Center, modifier = Modifier.padding(vertical = 8.dp)); OutlinedButton(onClick = retry) { Icon(Icons.Default.Refresh, null); Text("إعادة المحاولة", modifier = Modifier.padding(start = 5.dp)) } } }
@Composable private fun AdminErrorBanner(message: String) { Text(message.ifBlank { "تعذر تنفيذ العملية" }, color = Color(0xFFB3261E), fontSize = 12.sp, modifier = Modifier.fillMaxWidth().background(Color(0xFFFFEBEE), RoundedCornerShape(10.dp)).padding(9.dp)) }
@Composable private fun AdminInfo(message: String) { Text(message, color = Color(0xFF315A86), fontSize = 12.sp, modifier = Modifier.fillMaxWidth().background(Color(0xFFEEF5FF), RoundedCornerShape(14.dp)).padding(12.dp)) }
@Composable private fun AdminStatus(value: String) { val (label, color) = when (value) { "active", "approved", "resolved" -> "نشط" to Color(0xFF16833B); "banned", "rejected" -> "محظور" to Color(0xFFB3261E); "pending", "under_review" -> "قيد المراجعة" to Color(0xFFB77900); else -> value.ifBlank { "غير محدد" } to Color(0xFF708198) }; Text(label, color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.background(color.copy(alpha = .1f), RoundedCornerShape(50)).padding(horizontal = 8.dp, vertical = 5.dp)) }
@Composable private fun AdminVerification(verified: Boolean) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.CheckCircle, null, tint = if (verified) Color(0xFF16833B) else Color(0xFFB77900), modifier = Modifier.size(17.dp)); Text(if (verified) "موثق" else "غير موثق", color = if (verified) Color(0xFF16833B) else Color(0xFFB77900), fontSize = 11.sp, modifier = Modifier.padding(start = 3.dp)) } }
@Composable private fun AdminPill(text: String) { Text(text, color = Color(0xFF40516A), fontSize = 11.sp, modifier = Modifier.background(Color(0xFFF1F4F8), RoundedCornerShape(50)).padding(horizontal = 8.dp, vertical = 5.dp)) }
private fun adminRole(role: String) = when (role) { "client" -> "عميل"; "provider" -> "مزود خدمة"; "admin" -> "مدير"; else -> role.ifBlank { "غير محدد" } }
private fun adminWallet(wallet: String) = mapOf("jeeb" to "جيب", "floosk" to "فلوسك", "jawali" to "جوالي", "cash" to "كاش", "one_cash" to "ون كاش", "hasib" to "حاسب", "easy" to "إيزي")[wallet] ?: wallet
