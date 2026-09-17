package com.fazaa.app

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Tune
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
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

// نماذج العميل: طبقة العرض لا تعتمد على WebView أو React.
data class ClientCategory(val id: Int, val name: String, val icon: String = "🔧")
data class ClientProvider(val id: Int, val name: String, val categoryName: String = "خدمات عامة", val categoryIcon: String = "🔧", val city: String = "صنعاء", val district: String = "", val bio: String = "", val rating: Double = 0.0, val reviewCount: Int = 0, val completedJobs: Int = 0, val yearsExperience: Int = 0, val isVerified: Boolean = false, val isAvailable: Boolean = false, val isFavorited: Boolean = false, val phone: String? = null, val whatsapp: String? = null)
data class ClientReview(val id: Int, val clientName: String, val rating: Int, val comment: String = "")
data class ClientPortfolioItem(val id: Int, val description: String = "")
data class ClientRequest(val id: Int, val serviceType: String, val description: String = "", val city: String = "صنعاء", val district: String = "", val status: String = "pending", val isImmediate: Boolean = true, val scheduledAt: String? = null, val createdAt: String = "", val providerName: String = "بانتظار المهني", val providerCategoryName: String = "")
data class ClientNotification(val id: Int, val title: String, val body: String, val createdAt: String, val isRead: Boolean = false)
data class ClientHomeData(val categories: List<ClientCategory> = emptyList(), val featured: List<ClientProvider> = emptyList(), val recentRequests: List<ClientRequest> = emptyList())
data class ClientDiscoverData(val categories: List<ClientCategory> = emptyList(), val topRated: List<ClientProvider> = emptyList(), val newest: List<ClientProvider> = emptyList())
data class ProviderQuery(val search: String = "", val categoryId: Int? = null, val city: String = "", val availableOnly: Boolean = false, val verifiedOnly: Boolean = false)
data class NewClientRequest(val providerId: Int, val serviceType: String, val description: String, val city: String, val district: String, val isImmediate: Boolean, val scheduledAt: String?)

/** عقد عمليات API قابل للربط لاحقاً مع Retrofit أو الموصل الحالي. */
interface ClientApi {
    suspend fun home(): ClientHomeData
    suspend fun discover(): ClientDiscoverData
    suspend fun providers(query: ProviderQuery): List<ClientProvider>
    suspend fun provider(id: Int): ClientProvider?
    suspend fun reviews(providerId: Int): List<ClientReview>
    suspend fun portfolio(providerId: Int): List<ClientPortfolioItem>
    suspend fun createRequest(request: NewClientRequest): ClientRequest
    suspend fun requests(): List<ClientRequest>
    suspend fun request(id: Int): ClientRequest?
    suspend fun updateRequestStatus(id: Int, status: String): ClientRequest
    suspend fun favorites(): List<ClientProvider>
    suspend fun setFavorite(providerId: Int, favorite: Boolean)
    suspend fun trackContact(providerId: Int, kind: String)
    suspend fun notifications(): List<ClientNotification>
    suspend fun markAllNotificationsRead()
}

object UnavailableClientApi : ClientApi {
    private fun unavailable(): Nothing = error("لم يتم ربط API العميل بعد")
    override suspend fun home(): ClientHomeData = unavailable()
    override suspend fun discover(): ClientDiscoverData = unavailable()
    override suspend fun providers(query: ProviderQuery): List<ClientProvider> = unavailable()
    override suspend fun provider(id: Int): ClientProvider? = unavailable()
    override suspend fun reviews(providerId: Int): List<ClientReview> = unavailable()
    override suspend fun portfolio(providerId: Int): List<ClientPortfolioItem> = unavailable()
    override suspend fun createRequest(request: NewClientRequest): ClientRequest = unavailable()
    override suspend fun requests(): List<ClientRequest> = unavailable()
    override suspend fun request(id: Int): ClientRequest? = unavailable()
    override suspend fun updateRequestStatus(id: Int, status: String): ClientRequest = unavailable()
    override suspend fun favorites(): List<ClientProvider> = unavailable()
    override suspend fun setFavorite(providerId: Int, favorite: Boolean): Unit = unavailable()
    override suspend fun trackContact(providerId: Int, kind: String): Unit = unavailable()
    override suspend fun notifications(): List<ClientNotification> = unavailable()
    override suspend fun markAllNotificationsRead(): Unit = unavailable()
}

@Composable
fun NativeClientPage(route: String, api: ClientApi = RealClientApi, onNavigate: (String) -> Unit = {}, onBack: () -> Unit = {}) {
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) {
        when {
            route == "/" || route == "/home" -> ClientHomePage(api, onNavigate)
            route == "/discover" -> ClientDiscoverPage(api, onNavigate)
            route == "/providers" || route.startsWith("/providers?") -> ClientProvidersPage(api, onNavigate, onBack)
            route.startsWith("/providers/") -> ClientProviderDetailPage(route.substringAfterLast('/').substringBefore('?').toIntOrNull() ?: 0, api, onNavigate, onBack)
            route == "/request/new" || route.startsWith("/request/new?") -> ClientNewRequestPage(api, onNavigate, onBack, route.substringAfter("providerId=", "0").substringBefore('&').toIntOrNull() ?: 0)
            route == "/my-requests" -> ClientMyRequestsPage(api, onNavigate, onBack)
            route.startsWith("/my-requests/") -> ClientRequestDetailPage(route.substringAfterLast('/').toIntOrNull() ?: 0, api, onNavigate, onBack)
            route == "/favorites" -> ClientFavoritesPage(api, onNavigate, onBack)
            route == "/notifications" -> ClientNotificationsPage(api, onBack)
            route == "/profile" -> ClientProfilePage(onNavigate, onBack)
            route == "/settings" -> ClientSettingsPage(onNavigate, onBack)
            else -> ClientEmptyPage("صفحة العميل", "المسار غير معروف", onBack)
        }
    }
}

@Composable internal fun PageSurface(content: @Composable () -> Unit) { Surface(Modifier.fillMaxSize(), color = FazaaBackground) { content() } }
@Composable private fun BrandMark() { androidx.compose.foundation.Image(painterResource(R.drawable.fazaah_logo), "شعار فزعة", Modifier.size(58.dp), contentScale = ContentScale.Fit) }
@Composable internal fun TopBar(title: String, onBack: (() -> Unit)? = null, action: (@Composable () -> Unit)? = null) { Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) { if (onBack != null) IconButton(onClick = onBack) { Icon(Icons.Default.ArrowForward, "رجوع", tint = FazaaNavy) } else Spacer(Modifier.size(48.dp)); Text(title, Modifier.weight(1f), color = FazaaNavy, fontSize = 20.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center); if (action != null) action() else Spacer(Modifier.size(48.dp)) } }
@Composable private fun BottomBar(selected: Int, go: (String) -> Unit) { Row(Modifier.fillMaxWidth().background(Color.White).navigationBarsPadding().padding(vertical = 5.dp), horizontalArrangement = Arrangement.SpaceEvenly) { val pages = listOf("/" to Icons.Default.Home, "/discover" to Icons.Default.Search, "/my-requests" to Icons.Default.Description, "/profile" to Icons.Default.Person); pages.forEachIndexed { index, page -> IconButton(onClick = { go(page.first) }) { Icon(page.second, null, tint = if (index == selected) FazaaNavy else Color.Gray) } } } }
@Composable private fun SectionTitle(title: String, link: String, onClick: () -> Unit) { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { TextButton(onClick = onClick) { Text(link, color = FazaaNavy, fontSize = 11.sp) }; Text(title, color = FazaaNavy, fontSize = 16.sp, fontWeight = FontWeight.Black) } }
@Composable internal fun Avatar(name: String, size: Dp = 52.dp) { Box(Modifier.size(size).background(Color(0xFFEAF0F7), CircleShape), contentAlignment = Alignment.Center) { Text(name.take(1), color = FazaaNavy, fontSize = 22.sp, fontWeight = FontWeight.Black) } }
@Composable private fun EmptyState(title: String, message: String) { Column(Modifier.fillMaxWidth().padding(38.dp), horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.Info, null, tint = Color(0xFF8794A7), modifier = Modifier.size(40.dp)); Text(title, color = FazaaNavy, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 10.dp)); Text(message, color = Color(0xFF718096), fontSize = 13.sp, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 5.dp)) } }
@Composable private fun LoadErrorEmpty(loading: Boolean, error: String?, empty: Boolean, title: String, message: String, retry: () -> Unit) { when { loading -> Box(Modifier.fillMaxWidth().padding(36.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = FazaaNavy) }; error != null -> Card(Modifier.fillMaxWidth().padding(10.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF1F0))) { Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.ErrorOutline, null, tint = Color(0xFFB3261E)); Text(error, color = Color(0xFF8C1D18), textAlign = TextAlign.Center, modifier = Modifier.padding(8.dp)); TextButton(onClick = retry) { Icon(Icons.Default.Refresh, null); Text("إعادة المحاولة") } } }; empty -> EmptyState(title, message) } }
@Composable private fun CategoryTile(category: ClientCategory, onClick: () -> Unit) { Card(onClick = onClick, modifier = Modifier.width(92.dp).height(100.dp), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(16.dp)) { Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) { Text(category.icon, fontSize = 24.sp); Text(category.name, color = FazaaNavy, fontSize = 10.sp, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis) } } }
@Composable private fun ProviderCard(provider: ClientProvider, onClick: () -> Unit) { Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp)) { Row(Modifier.padding(13.dp), verticalAlignment = Alignment.CenterVertically) { Avatar(provider.name); Column(Modifier.weight(1f).padding(horizontal = 11.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Text(provider.name, color = FazaaNavy, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis); if (provider.isVerified) Icon(Icons.Default.Shield, "موثق", tint = FazaaTeal, modifier = Modifier.size(16.dp)) }; Text("${provider.categoryIcon} ${provider.categoryName}", color = Color(0xFF718096), fontSize = 11.sp); Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Star, null, tint = FazaaGold, modifier = Modifier.size(15.dp)); Text(" ${"%.1f".format(provider.rating)} (${provider.reviewCount}) · ${provider.city}", color = Color(0xFF718096), fontSize = 11.sp) } }; if (provider.isAvailable) Box(Modifier.size(10.dp).background(FazaaTeal, CircleShape)) } } }
@Composable private fun StatusChip(status: String) { val value = when (status) { "accepted" -> "تم القبول" to Color(0xFF1976D2); "in_progress" -> "جاري التنفيذ" to Color(0xFF7B1FA2); "completed" -> "مكتمل" to FazaaTeal; "rejected" -> "مرفوض" to Color(0xFFB3261E); "cancelled" -> "ملغي" to Color.Gray; else -> "قيد الانتظار" to Color(0xFF9A7200) }; Text(value.first, color = value.second, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.background(value.second.copy(alpha = .1f), RoundedCornerShape(20.dp)).padding(horizontal = 9.dp, vertical = 5.dp)) }

@Composable fun ClientHomePage(api: ClientApi, onNavigate: (String) -> Unit) {
    var data by remember { mutableStateOf<ClientHomeData?>(null) }; var loading by remember { mutableStateOf(true) }; var error by remember { mutableStateOf<String?>(null) }; var search by remember { mutableStateOf("") }; val scope = rememberCoroutineScope()
    suspend fun load() { loading = true; error = null; runCatching { api.home() }.onSuccess { data = it }.onFailure { error = it.message ?: "تعذر تحميل الصفحة" }; loading = false }; LaunchedEffect(Unit) { load() }
    PageSurface { Scaffold(bottomBar = { BottomBar(0, onNavigate) }) { padding -> LazyColumn(Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        item { Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.LocationOn, null, tint = FazaaNavy); Text("صنعاء", color = FazaaNavy, fontWeight = FontWeight.Bold) }; Row { IconButton({ onNavigate("/notifications") }) { Icon(Icons.Default.Notifications, "الإشعارات", tint = FazaaNavy) }; BrandMark() } } }
        item { Card(Modifier.fillMaxWidth().height(178.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFEEF2F6)), shape = RoundedCornerShape(25.dp)) { Box(Modifier.fillMaxSize()) { androidx.compose.foundation.Image(painterResource(R.drawable.fazaah_worker_hero), null, Modifier.fillMaxSize(), contentScale = ContentScale.Crop); Box(Modifier.fillMaxSize().background(Color.White.copy(alpha = .72f))); Column(Modifier.padding(20.dp).fillMaxWidth(.65f), verticalArrangement = Arrangement.Center) { Text("احتياجك .. نوصلك بالشخص المناسب", color = Color(0xFF60728A), fontSize = 11.sp); Text("تحتاج شيء؟", color = FazaaNavy, fontSize = 25.sp, fontWeight = FontWeight.Black); Text("فزعة لك!", color = FazaaNavy, fontSize = 25.sp, fontWeight = FontWeight.Black); Text("ابحث عن المهني المناسب لإنجاز احتياجك بسهولة.", color = Color(0xFF60728A), fontSize = 10.sp) } } } }
        item { Row(verticalAlignment = Alignment.CenterVertically) { OutlinedTextField(search, { search = it }, Modifier.weight(1f), placeholder = { Text("ابحث عن الخدمة أو المهني...", fontSize = 11.sp) }, singleLine = true, trailingIcon = { IconButton({ if (search.isNotBlank()) onNavigate("/providers") }) { Icon(Icons.Default.Search, "بحث") } }); IconButton({ onNavigate("/providers") }) { Icon(Icons.Default.Tune, "تصفية", tint = FazaaNavy) } } }
        item { SectionTitle("اختر نوع الخدمة", "عرض الكل") { onNavigate("/providers") }; val categories = data?.categories.orEmpty(); if (categories.isEmpty()) LoadErrorEmpty(loading, error, !loading && error == null, "لا توجد أنواع خدمات", "تصفح المهنيين عند توفر الخدمات.") { scope.launch { load() } } else LazyRow(horizontalArrangement = Arrangement.spacedBy(9.dp)) { items(categories.take(8)) { CategoryTile(it) { onNavigate("/providers?categoryId=${it.id}") } } } }
        item { Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF5DB)), shape = RoundedCornerShape(20.dp)) { Column(Modifier.padding(18.dp)) { Text("محتاج مساعدة أكثر؟", color = FazaaNavy, fontWeight = FontWeight.Black, fontSize = 16.sp); Text("تصفح جميع المهنيين والخدمات المتاحة.", color = Color(0xFF67758A), fontSize = 11.sp); Button({ onNavigate("/providers") }, colors = ButtonDefaults.buttonColors(containerColor = FazaaGold)) { Text("تصفح الكل", color = FazaaNavy) } } } }
        item { SectionTitle("خدماتك الأخيرة", "عرض الكل") { onNavigate("/my-requests") }; val requests = data?.recentRequests.orEmpty(); if (requests.isEmpty()) EmptyState("لا توجد طلبات محفوظة", "تصفح المهنيين وأنشئ طلب خدمة حقيقياً.") else Column(verticalArrangement = Arrangement.spacedBy(8.dp)) { requests.take(4).forEach { RequestRow(it) { onNavigate("/my-requests/${it.id}") } } } }
    } } }
}
@Composable private fun RequestRow(request: ClientRequest, onClick: () -> Unit) { Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) { Row(Modifier.padding(13.dp), verticalAlignment = Alignment.CenterVertically) { Avatar(request.serviceType, 42.dp); Column(Modifier.weight(1f).padding(horizontal = 10.dp)) { Text(request.serviceType, color = FazaaNavy, fontWeight = FontWeight.Bold); Text(request.providerName, color = Color.Gray, fontSize = 11.sp) }; StatusChip(request.status) } } }

@Composable fun ClientDiscoverPage(api: ClientApi, onNavigate: (String) -> Unit) {
    var data by remember { mutableStateOf<ClientDiscoverData?>(null) }; var loading by remember { mutableStateOf(true) }; var error by remember { mutableStateOf<String?>(null) }; val scope = rememberCoroutineScope()
    suspend fun load() { loading = true; error = null; runCatching { api.discover() }.onSuccess { data = it }.onFailure { error = it.message ?: "تعذر تحميل الاكتشاف" }; loading = false }; LaunchedEffect(Unit) { load() }
    PageSurface { LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
        item { Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = FazaaNavy), shape = RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp)) { Column(Modifier.padding(22.dp)) { Text("✦  اكتشف", color = FazaaGold, fontSize = 23.sp, fontWeight = FontWeight.Black); Text("أفضل المهنيين والخدمات في منطقتك", color = Color.White.copy(alpha = .7f), fontSize = 13.sp) } } }
        item { Text("عروض مميزة", color = FazaaNavy, fontWeight = FontWeight.Bold); LazyRow(horizontalArrangement = Arrangement.spacedBy(9.dp)) { items(listOf("خصم ٢٠٪ على خدمات الكهرباء", "أول طلب مجاناً للمستخدمين الجدد", "خدمة تنظيف شاملة بسعر مميز")) { title -> Card(Modifier.width(220.dp).height(110.dp), colors = CardDefaults.cardColors(containerColor = FazaaNavy)) { Column(Modifier.padding(15.dp)) { Text("✦", color = FazaaGold, fontSize = 24.sp); Text(title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp) } } } } }
        item { Text("شارات التميز", color = FazaaNavy, fontWeight = FontWeight.Bold); Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) { listOf("🏆 الأعلى تقييماً", "⚡ الأسرع استجابة", "✅ موثق رسمياً", "🆕 جديد").forEach { Text(it, color = FazaaNavy, fontSize = 12.sp, modifier = Modifier.background(Color.White, RoundedCornerShape(12.dp)).padding(9.dp)) } } }
        item { SectionTitle("الأكثر طلباً", "عرض الكل") { onNavigate("/providers") }; LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) { items(data?.categories.orEmpty().take(6)) { CategoryTile(it) { onNavigate("/providers?categoryId=${it.id}") } } } }
        item { Text("الأعلى تقييماً", color = FazaaNavy, fontWeight = FontWeight.Bold); if (data?.topRated.isNullOrEmpty()) LoadErrorEmpty(loading, error, !loading && error == null, "لا يوجد مهنيون", "جرّب مرة أخرى لاحقاً.") { scope.launch { load() } } else Column(verticalArrangement = Arrangement.spacedBy(9.dp)) { data!!.topRated.take(4).forEach { ProviderCard(it) { onNavigate("/providers/${it.id}") } } } }
        item { Text("مهنيون جدد", color = FazaaNavy, fontWeight = FontWeight.Bold); if (data?.newest.isNullOrEmpty()) LoadErrorEmpty(loading, error, !loading && error == null, "لا يوجد مهنيون", "ستظهر الملفات الجديدة هنا.") { scope.launch { load() } } else Column(verticalArrangement = Arrangement.spacedBy(9.dp)) { data!!.newest.take(4).forEach { ProviderCard(it) { onNavigate("/providers/${it.id}") } } } }
    } }
}

@Composable fun ClientProvidersPage(api: ClientApi, onNavigate: (String) -> Unit, onBack: () -> Unit) {
    var search by remember { mutableStateOf("") }; var city by remember { mutableStateOf("") }; var available by remember { mutableStateOf(false) }; var verified by remember { mutableStateOf(false) }; var showFilters by remember { mutableStateOf(false) }; var providers by remember { mutableStateOf(emptyList<ClientProvider>()) }; var loading by remember { mutableStateOf(true) }; var error by remember { mutableStateOf<String?>(null) }; val scope = rememberCoroutineScope()
    suspend fun load() { loading = true; error = null; runCatching { api.providers(ProviderQuery(search, null, city, available, verified)) }.onSuccess { providers = it }.onFailure { error = it.message ?: "تعذر تحميل المهنيين" }; loading = false }; LaunchedEffect(search, city, available, verified) { load() }
    PageSurface { Column { TopBar("استعرض المهنيين", onBack); Column(Modifier.padding(horizontal = 16.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { OutlinedTextField(search, { search = it }, Modifier.weight(1f), placeholder = { Text("ابحث عن مهني أو خدمة...") }, leadingIcon = { Icon(Icons.Default.Search, null) }, singleLine = true); IconButton({ showFilters = !showFilters }) { Icon(Icons.Default.FilterList, "الفلاتر", tint = if (showFilters || city.isNotBlank() || available || verified) FazaaGold else FazaaNavy) } }; if (showFilters) Card(Modifier.fillMaxWidth().padding(vertical = 8.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) { Column(Modifier.padding(12.dp)) { OutlinedTextField(city, { city = it }, Modifier.fillMaxWidth(), label = { Text("المحافظة أو المدينة") }, singleLine = true); ToggleLine("متاح الآن", available) { available = it }; ToggleLine("موثقون فقط", verified) { verified = it }; TextButton({ city = ""; available = false; verified = false }) { Icon(Icons.Default.Close, null); Text("إزالة الفلاتر") } } }; Text(if (loading) "جاري البحث..." else "${providers.size} مهني", color = Color.Gray, fontSize = 13.sp, modifier = Modifier.padding(vertical = 10.dp)); if (providers.isEmpty() && !loading && error == null) EmptyState("لا توجد نتائج", "جرّب تغيير معايير البحث."); if (error != null) LoadErrorEmpty(false, error, false, "", "") { scope.launch { load() } }; LazyColumn(verticalArrangement = Arrangement.spacedBy(9.dp)) { items(providers) { ProviderCard(it) { onNavigate("/providers/${it.id}") } } } } } }
}
@Composable private fun ToggleLine(label: String, checked: Boolean, onChange: (Boolean) -> Unit) { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { Text(label, color = FazaaNavy); Switch(checked = checked, onCheckedChange = onChange) } }

@Composable fun ClientProviderDetailPage(id: Int, api: ClientApi, onNavigate: (String) -> Unit, onBack: () -> Unit) {
    var provider by remember { mutableStateOf<ClientProvider?>(null) }; var reviews by remember { mutableStateOf(emptyList<ClientReview>()) }; var portfolio by remember { mutableStateOf(emptyList<ClientPortfolioItem>()) }; var loading by remember { mutableStateOf(true) }; var error by remember { mutableStateOf<String?>(null) }; var favoriteLoading by remember { mutableStateOf(false) }; val scope = rememberCoroutineScope(); val context = LocalContext.current
    suspend fun load() { loading = true; error = null; runCatching { Triple(api.provider(id), api.reviews(id), api.portfolio(id)) }.onSuccess { provider = it.first; reviews = it.second; portfolio = it.third }.onFailure { error = it.message ?: "تعذر تحميل الملف" }; loading = false }; LaunchedEffect(id) { load() }
    PageSurface { when { loading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = FazaaNavy) }; error != null -> LoadErrorEmpty(false, error, false, "", "") { scope.launch { load() } }; provider == null -> EmptyState("لم يتم العثور على المهني", "قد يكون الملف غير متاح حالياً."); else -> ProviderDetailContent(provider!!, reviews, portfolio, favoriteLoading, { favoriteLoading = it }, api, onNavigate, onBack, context, scope) } }
}
@Composable private fun ProviderDetailContent(p: ClientProvider, reviews: List<ClientReview>, portfolio: List<ClientPortfolioItem>, favoriteLoading: Boolean, setFavoriteLoading: (Boolean) -> Unit, api: ClientApi, go: (String) -> Unit, back: () -> Unit, context: android.content.Context, scope: kotlinx.coroutines.CoroutineScope) { LazyColumn(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(14.dp)) { item { TopBar("الملف الشخصي", back) }; item { Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp), horizontalAlignment = Alignment.CenterHorizontally) { Avatar(p.name, 104.dp); Text(p.name, color = FazaaNavy, fontSize = 23.sp, fontWeight = FontWeight.Black); Text("${p.categoryIcon} ${p.categoryName}", color = Color.Gray); Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.LocationOn, null, tint = Color.Gray, modifier = Modifier.size(16.dp)); Text(" ${p.city} · ", color = Color.Gray, fontSize = 12.sp); Icon(Icons.Default.Star, null, tint = FazaaGold, modifier = Modifier.size(16.dp)); Text("${"%.1f".format(p.rating)} (${p.reviewCount})", color = Color.Gray, fontSize = 12.sp) } } }; item { Row(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) { StatCard("${p.completedJobs}", "مهمة", Modifier.weight(1f)); StatCard("${p.yearsExperience}", "سنوات", Modifier.weight(1f)); StatCard(if (p.isAvailable) "متاح" else "مشغول", "الحالة", Modifier.weight(1f)) } }; item { Row(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) { Button({ go("/request/new?providerId=${p.id}") }, Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = FazaaGold)) { Text("طلب خدمة", color = FazaaNavy) }; IconButton({ scope.launch { setFavoriteLoading(true); api.setFavorite(p.id, !p.isFavorited); setFavoriteLoading(false) } }) { if (favoriteLoading) CircularProgressIndicator(Modifier.size(18.dp)) else Icon(if (p.isFavorited) Icons.Default.Favorite else Icons.Default.FavoriteBorder, "المفضلة", tint = Color(0xFFD32F2F)) } } }; item { Row(Modifier.padding(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) { p.phone?.let { phone -> OutlinedButton({ scope.launch { api.trackContact(p.id, "call") }; context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))) }, Modifier.weight(1f)) { Icon(Icons.Default.Call, null); Text("اتصال") } }; p.whatsapp?.let { whatsapp -> OutlinedButton({ scope.launch { api.trackContact(p.id, "whatsapp") }; context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/$whatsapp"))) }, Modifier.weight(1f)) { Icon(Icons.Default.Chat, null); Text("واتساب") } } } }; if (p.bio.isNotBlank()) item { DetailSection("نبذة عن المهني") { Text(p.bio, color = Color.Gray, fontSize = 14.sp) } }; item { DetailSection("معرض الأعمال") { if (portfolio.isEmpty()) EmptyState("لم يُضف المهني صور أعمال بعد", "سيظهر المعرض عند إضافة الأعمال.") else LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) { items(portfolio) { Card(Modifier.size(130.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFE9EEF3))) { Text(it.description.ifBlank { "عمل مهني" }, color = FazaaNavy, modifier = Modifier.padding(10.dp)) } } } } }; if (reviews.isNotEmpty()) item { DetailSection("التقييمات والآراء") { reviews.forEach { ReviewCard(it) } } }; item { Spacer(Modifier.height(20.dp)) } } }
@Composable private fun StatCard(value: String, label: String, modifier: Modifier) { Card(modifier, colors = CardDefaults.cardColors(containerColor = Color.White)) { Column(Modifier.fillMaxWidth().padding(11.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(value, color = FazaaNavy, fontWeight = FontWeight.Black); Text(label, color = Color.Gray, fontSize = 10.sp) } } }
@Composable private fun DetailSection(title: String, content: @Composable () -> Unit) { Column(Modifier.padding(horizontal = 16.dp)) { Text(title, color = FazaaNavy, fontWeight = FontWeight.Black, fontSize = 17.sp); Spacer(Modifier.height(7.dp)); content() } }
@Composable private fun ReviewCard(review: ClientReview) { Card(Modifier.fillMaxWidth().padding(vertical = 4.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) { Column(Modifier.padding(12.dp)) { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(review.clientName, color = FazaaNavy, fontWeight = FontWeight.Bold); Row { repeat(5) { Icon(Icons.Default.Star, null, tint = if (it < review.rating) FazaaGold else Color.LightGray, modifier = Modifier.size(14.dp)) } } }; Text(review.comment, color = Color.Gray, fontSize = 12.sp) } } }

@Composable fun ClientNewRequestPage(api: ClientApi, onNavigate: (String) -> Unit, onBack: () -> Unit, providerId: Int = 0) { var service by remember { mutableStateOf("") }; var description by remember { mutableStateOf("") }; var city by remember { mutableStateOf("صنعاء") }; var district by remember { mutableStateOf("") }; var immediate by remember { mutableStateOf(true) }; var schedule by remember { mutableStateOf("") }; var error by remember { mutableStateOf<String?>(null) }; var loading by remember { mutableStateOf(false) }; var success by remember { mutableStateOf(false) }; val scope = rememberCoroutineScope(); if (success) { PageSurface { Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) { Icon(Icons.Default.CheckCircle, null, tint = FazaaTeal, modifier = Modifier.size(75.dp)); Text("تم إرسال الطلب بنجاح!", color = FazaaNavy, fontSize = 24.sp, fontWeight = FontWeight.Black); Text("سيقوم المهني بمراجعة طلبك والرد عليك قريباً.", color = Color.Gray, textAlign = TextAlign.Center); Button({ onNavigate("/my-requests") }, Modifier.fillMaxWidth().padding(top = 22.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaNavy)) { Text("متابعة طلباتي") } } }; return }; PageSurface { LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) { item { TopBar("طلب خدمة جديدة", onBack) }; item { Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFFEAF3FC))) { Text("فزعة تربطك بالمهني فقط. اتفق على السعر والتنفيذ مباشرة عبر الاتصال أو واتساب، ولا يتم الدفع داخل التطبيق.", color = FazaaNavy, fontSize = 12.sp, modifier = Modifier.padding(14.dp)) } }; item { Text("تفاصيل الخدمة", color = FazaaNavy, fontWeight = FontWeight.Black, fontSize = 18.sp); OutlinedTextField(service, { service = it; error = null }, Modifier.fillMaxWidth(), label = { Text("نوع الخدمة المطلوبة") }, placeholder = { Text("مثال: إصلاح تسريب مياه...") }); OutlinedTextField(description, { description = it; error = null }, Modifier.fillMaxWidth().height(135.dp), label = { Text("وصف المشكلة") }, placeholder = { Text("اشرح المشكلة بالتفصيل...") }) }; item { Text("الموقع", color = FazaaNavy, fontWeight = FontWeight.Black, fontSize = 18.sp); Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) { OutlinedTextField(city, { city = it }, Modifier.weight(1f), label = { Text("المدينة") }); OutlinedTextField(district, { district = it }, Modifier.weight(1f), label = { Text("المنطقة / الحي") }) } }; item { Text("الموعد", color = FazaaNavy, fontWeight = FontWeight.Black, fontSize = 18.sp); ToggleLine("أحتاج الخدمة الآن", immediate) { immediate = it }; if (!immediate) OutlinedTextField(schedule, { schedule = it }, Modifier.fillMaxWidth(), label = { Text("موعد الزيارة المقترح") }) }; item { error?.let { Text(it, color = Color(0xFFB3261E)) }; Button({ when { service.trim().length < 2 -> error = "الرجاء تحديد نوع الخدمة"; description.trim().length < 10 -> error = "الرجاء كتابة وصف تفصيلي للمشكلة"; city.trim().length < 2 || district.trim().length < 2 -> error = "الرجاء تحديد المدينة والمنطقة"; providerId <= 0 -> error = "اختر مهنياً أولاً لإرسال الطلب"; else -> scope.launch { loading = true; runCatching { api.createRequest(NewClientRequest(providerId, service, description, city, district, immediate, schedule.takeIf { !immediate })) }.onSuccess { success = true }.onFailure { error = it.message ?: "لم نتمكن من إرسال الطلب" }; loading = false } } }, Modifier.fillMaxWidth().height(54.dp), enabled = !loading, colors = ButtonDefaults.buttonColors(containerColor = FazaaNavy)) { if (loading) CircularProgressIndicator(Modifier.size(20.dp), color = Color.White) else { Icon(Icons.Default.Send, null); Text("تأكيد وإرسال الطلب") } } } } } }

@Composable fun ClientMyRequestsPage(api: ClientApi, onNavigate: (String) -> Unit, onBack: () -> Unit) { var requests by remember { mutableStateOf(emptyList<ClientRequest>()) }; var loading by remember { mutableStateOf(true) }; var error by remember { mutableStateOf<String?>(null) }; val scope = rememberCoroutineScope(); suspend fun load() { loading = true; error = null; runCatching { api.requests() }.onSuccess { requests = it }.onFailure { error = it.message }; loading = false }; LaunchedEffect(Unit) { load() }; PageSurface { Column { TopBar("طلباتي", onBack); Text("متابعة طلبات الخدمة الخاصة بك", color = Color.Gray, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()); LazyColumn(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) { item { LoadErrorEmpty(loading, error, !loading && error == null && requests.isEmpty(), "لا توجد طلبات", "لم تقم بطلب أي خدمة بعد.") { scope.launch { load() } } }; items(requests) { RequestCard(it) { onNavigate("/my-requests/${it.id}") } } } } } }
@Composable private fun RequestCard(request: ClientRequest, onClick: () -> Unit) { Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(14.dp)) { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { StatusChip(request.status); if (request.isImmediate) Text("عاجل", color = Color(0xFFB3261E), fontWeight = FontWeight.Bold, fontSize = 11.sp) }; Text(request.serviceType, color = FazaaNavy, fontWeight = FontWeight.Black, fontSize = 16.sp, modifier = Modifier.padding(top = 8.dp)); Text("المهني: ${request.providerName}", color = Color.Gray, fontSize = 12.sp) } } }
@Composable private fun InfoLine(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, value: String) { Row(Modifier.fillMaxWidth().padding(vertical = 6.dp)) { Icon(icon, null, tint = Color.Gray, modifier = Modifier.size(20.dp)); Column(Modifier.padding(start = 10.dp)) { Text(title, color = Color.Gray, fontSize = 11.sp, fontWeight = FontWeight.Bold); Text(value, color = FazaaNavy, fontSize = 13.sp) } } }

@Composable fun ClientRequestDetailPage(id: Int, api: ClientApi, onNavigate: (String) -> Unit, onBack: () -> Unit) { var request by remember { mutableStateOf<ClientRequest?>(null) }; var loading by remember { mutableStateOf(true) }; var error by remember { mutableStateOf<String?>(null) }; var actionLoading by remember { mutableStateOf(false) }; val scope = rememberCoroutineScope(); suspend fun load() { loading = true; error = null; runCatching { api.request(id) }.onSuccess { request = it }.onFailure { error = it.message }; loading = false }; LaunchedEffect(id) { load() }; PageSurface { if (loading) Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = FazaaNavy) } else if (error != null) LoadErrorEmpty(false, error, false, "", "") { scope.launch { load() } } else if (request == null) EmptyState("لم يتم العثور على الطلب", "قد يكون الطلب غير متاح حالياً.") else { val r = request!!; LazyColumn(Modifier.fillMaxSize().padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) { item { TopBar("تفاصيل الطلب", onBack, { StatusChip(r.status) }) }; item { Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White)) { Column(Modifier.padding(17.dp)) { Text(r.serviceType, color = FazaaNavy, fontWeight = FontWeight.Black, fontSize = 19.sp); HorizontalDivider(Modifier.padding(vertical = 12.dp)); InfoLine(Icons.Default.Description, "الوصف", r.description); InfoLine(Icons.Default.LocationOn, "الموقع", "${r.city}، ${r.district}"); InfoLine(Icons.Default.CalendarMonth, "الموعد", if (r.isImmediate) "عاجل (الآن)" else r.scheduledAt ?: "غير محدد") } } }; item { Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFFF0F4F8))) { Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Avatar(r.providerName); Column(Modifier.padding(start = 10.dp)) { Text("المهني", color = Color.Gray, fontSize = 11.sp); Text(r.providerName, color = FazaaNavy, fontWeight = FontWeight.Bold) } } } }; item { if (r.status == "pending" || r.status == "accepted") OutlinedButton({ scope.launch { actionLoading = true; runCatching { api.updateRequestStatus(r.id, "cancelled") }.onSuccess { request = it }.onFailure { error = it.message }; actionLoading = false } }, Modifier.fillMaxWidth(), enabled = !actionLoading) { Icon(Icons.Default.Close, null, tint = Color(0xFFB3261E)); Text("إلغاء الطلب", color = Color(0xFFB3261E)) } } } } } }

@Composable fun ClientFavoritesPage(api: ClientApi, onNavigate: (String) -> Unit, onBack: () -> Unit) { var favorites by remember { mutableStateOf(emptyList<ClientProvider>()) }; var loading by remember { mutableStateOf(true) }; var error by remember { mutableStateOf<String?>(null) }; val scope = rememberCoroutineScope(); suspend fun load() { loading = true; error = null; runCatching { api.favorites() }.onSuccess { favorites = it }.onFailure { error = it.message }; loading = false }; LaunchedEffect(Unit) { load() }; PageSurface { Column { TopBar("المفضلة", onBack); Text("المهنيون الذين قمت بحفظهم", color = Color.Gray, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()); LazyColumn(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) { item { LoadErrorEmpty(loading, error, !loading && error == null && favorites.isEmpty(), "لا يوجد مهنيون مفضلون", "أضف المهنيين إلى المفضلة للرجوع إليهم لاحقاً.") { scope.launch { load() } } }; items(favorites) { ProviderCard(it) { onNavigate("/providers/${it.id}") } } } } } }
@Composable fun ClientNotificationsPage(api: ClientApi, onBack: () -> Unit) { var notifications by remember { mutableStateOf(emptyList<ClientNotification>()) }; var loading by remember { mutableStateOf(true) }; var error by remember { mutableStateOf<String?>(null) }; var marking by remember { mutableStateOf(false) }; val scope = rememberCoroutineScope(); suspend fun load() { loading = true; error = null; runCatching { api.notifications() }.onSuccess { notifications = it }.onFailure { error = it.message }; loading = false }; LaunchedEffect(Unit) { load() }; PageSurface { Column { TopBar("الإشعارات", onBack, { IconButton(onClick = { scope.launch { marking = true; runCatching { api.markAllNotificationsRead() }; load(); marking = false } }, enabled = !marking) { if (marking) CircularProgressIndicator(Modifier.size(18.dp)) else Icon(Icons.Default.Check, "تحديد الكل كمقروء", tint = FazaaNavy) } }); LazyColumn(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) { item { LoadErrorEmpty(loading, error, !loading && error == null && notifications.isEmpty(), "لا توجد إشعارات", "أنت على اطلاع بكل شيء!") { scope.launch { load() } } }; items(notifications) { n -> Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = if (n.isRead) Color.White else Color(0xFFEAF2FB))) { Column(Modifier.padding(14.dp)) { Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(n.title, color = FazaaNavy, fontWeight = FontWeight.Bold); Text(n.createdAt, color = Color.Gray, fontSize = 10.sp) }; Text(n.body, color = Color.Gray, fontSize = 12.sp, modifier = Modifier.padding(top = 5.dp)) } } } } } } }
@Composable private fun ClientEmptyPage(title: String, message: String, onBack: () -> Unit) { PageSurface { Column(Modifier.fillMaxSize()) { TopBar(title, onBack); EmptyState(title, message) } } }
