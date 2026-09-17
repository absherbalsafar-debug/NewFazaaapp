package com.fazaa.app

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
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
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

/** بيانات الصفحة التي يمكن للطبقة المالكة تمريرها إلى عمليات API الحقيقية. */
data class AuthEmailLoginInput(val email: String, val password: String)
data class AuthEmailRegistrationInput(
    val name: String,
    val email: String,
    val password: String,
    val role: String,
    val city: String,
    val categoryId: Int?,
    val bio: String,
    val yearsExperience: Int?,
)
data class NativeAuthResult(val token: String? = null, val userName: String? = null, val emailVerifyToken: String? = null)
data class NativePasswordResetResult(val resetToken: String? = null)
data class NativeServiceCategory(val id: Int, val name: String, val icon: String? = null)
data class NativeLegalSection(val title: String, val body: String)
data class NativeLegalDocument(val title: String, val eyebrow: String, val headline: String, val introduction: String, val sections: List<NativeLegalSection>, val updatedAt: String)

/**
 * نقطة ربط خفيفة مع الشبكة. التطبيق المضيف يمرر تنفيذاً حقيقياً عند ربط API؛
 * الواجهات نفسها لا تعتمد على WebView أو طبقة React.
 */
interface AuthLegalApi {
    suspend fun login(input: AuthEmailLoginInput): NativeAuthResult
    suspend fun register(input: AuthEmailRegistrationInput): NativeAuthResult
    suspend fun requestPasswordReset(email: String): NativePasswordResetResult
    suspend fun loadCategories(): List<NativeServiceCategory>
    suspend fun loadLegalDocument(route: String): NativeLegalDocument
}

/** تنفيذ افتراضي آمن يوضح أن نقاط API تحتاج ربطاً من التطبيق المضيف. */
object UnboundAuthLegalApi : AuthLegalApi {
    private fun notBound(): Nothing = throw IllegalStateException("لم يتم ربط خدمة API بعد")
    override suspend fun login(input: AuthEmailLoginInput): NativeAuthResult = notBound()
    override suspend fun register(input: AuthEmailRegistrationInput): NativeAuthResult = notBound()
    override suspend fun requestPasswordReset(email: String): NativePasswordResetResult = notBound()
    override suspend fun loadCategories(): List<NativeServiceCategory> = notBound()
    override suspend fun loadLegalDocument(route: String): NativeLegalDocument = legalDocumentFor(route)
}

/** موجه المجموعة؛ يتيح لـ FazaaNativeApp أو NavHost استبدال الشاشة تدريجياً دون تغيير بقية المجموعات. */
@Composable
fun NativeAuthLegalPageScreen(
    route: String,
    onBack: () -> Unit,
    onNavigate: (String) -> Unit = {},
    role: String = "client",
    api: AuthLegalApi = UnboundAuthLegalApi,
) {
    CompositionRtl {
        when (route) {
            "/auth/email" -> NativeAuthEmailPage(role = role, onBack = onBack, onForgotPassword = { onNavigate("/auth/forgot-password") }, api = api)
            "/auth/forgot-password" -> NativeForgotPasswordPage(onBack = onBack, onBackToLogin = { onNavigate("/auth/email") }, api = api)
            "/privacy" -> NativePrivacyPage(onBack = onBack, api = api)
            "/terms" -> NativeTermsPage(onBack = onBack, api = api)
            else -> NativeAuthLegalNotFoundPage(onBack)
        }
    }
}

@Composable
fun NativeAuthEmailPage(
    role: String = "client",
    onBack: () -> Unit,
    onForgotPassword: () -> Unit,
    api: AuthLegalApi = UnboundAuthLegalApi,
) {
    var mode by remember { mutableStateOf(AuthMode.Login) }
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var city by remember { mutableStateOf("") }
    var categoryId by remember { mutableStateOf<Int?>(null) }
    var bio by remember { mutableStateOf("") }
    var yearsExperience by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }
    var categories by remember { mutableStateOf<List<NativeServiceCategory>>(emptyList()) }
    var categoriesLoading by remember { mutableStateOf(false) }
    var categoriesError by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    val isProvider = role == "provider"

    LaunchedEffect(mode, role) {
        if (mode != AuthMode.Register || !isProvider) return@LaunchedEffect
        categoriesLoading = true
        categoriesError = null
        runCatching { api.loadCategories() }
            .onSuccess { categories = it }
            .onFailure { categoriesError = it.message ?: "تعذر تحميل مجالات الخدمة" }
        categoriesLoading = false
    }

    AuthLegalScaffold(title = if (mode == AuthMode.Login) "تسجيل الدخول" else "إنشاء حساب جديد", onBack = onBack) {
        Text(
            if (mode == AuthMode.Login) "أهلاً بعودتك، تابع رحلتك مع فزعة." else "أنشئ حسابك وابدأ تجربة خدمات أكثر سهولة.",
            color = Color(0xFF77766F), lineHeight = 24.sp,
        )
        Spacer(Modifier.height(20.dp))
        AuthModeToggle(mode = mode, onModeChanged = { mode = it; error = null; successMessage = null })
        Spacer(Modifier.height(18.dp))
        if (mode == AuthMode.Register) {
            FazaaField(value = name, onValueChange = { name = it; error = null }, label = "الاسم الكامل", leading = Icons.Default.Person)
            Spacer(Modifier.height(10.dp))
            FazaaField(value = city, onValueChange = { city = it }, label = "المدينة (اختياري)", leading = Icons.Default.Description)
            Spacer(Modifier.height(12.dp))
            RoleBadge(role = role)
            if (isProvider) {
                Spacer(Modifier.height(12.dp))
                ProviderRegistrationFields(
                    categories = categories,
                    categoriesLoading = categoriesLoading,
                    categoriesError = categoriesError,
                    categoryId = categoryId,
                    onCategorySelected = { categoryId = it },
                    bio = bio,
                    onBioChanged = { bio = it },
                    yearsExperience = yearsExperience,
                    onYearsChanged = { yearsExperience = it },
                    onRetryCategories = { scope.launch { categoriesLoading = true; categoriesError = null; runCatching { api.loadCategories() }.onSuccess { categories = it }.onFailure { categoriesError = it.message ?: "تعذر تحميل مجالات الخدمة" }; categoriesLoading = false } },
                )
            }
            Spacer(Modifier.height(10.dp))
        }
        FazaaField(value = email, onValueChange = { email = it; error = null }, label = "البريد الإلكتروني", leading = Icons.Default.Email, keyboardType = KeyboardType.Email, ltr = true)
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it; error = null },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("كلمة المرور") },
            leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null, tint = FazaaNavy) },
            trailingIcon = { IconButton(onClick = { showPassword = !showPassword }) { Icon(if (showPassword) Icons.Default.VisibilityOff else Icons.Default.Visibility, contentDescription = if (showPassword) "إخفاء كلمة المرور" else "إظهار كلمة المرور") } },
            visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            singleLine = true,
            shape = RoundedCornerShape(16.dp),
        )
        if (mode == AuthMode.Login) {
            TextButton(onClick = onForgotPassword, modifier = Modifier.fillMaxWidth(), content = { Text("نسيت كلمة المرور؟", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Start, color = FazaaNavy) })
        }
        error?.let { NativeErrorMessage(it) }
        successMessage?.let { NativeSuccessMessage(it) }
        Spacer(Modifier.height(8.dp))
        Button(
            onClick = {
                val validation = validateAuth(mode, email, password, name, isProvider, categoryId, bio)
                if (validation != null) { error = validation; return@Button }
                scope.launch {
                    loading = true; error = null; successMessage = null
                    runCatching {
                        if (mode == AuthMode.Login) api.login(AuthEmailLoginInput(email.trim(), password))
                        else api.register(AuthEmailRegistrationInput(name.trim(), email.trim(), password, role, city.trim(), categoryId, bio.trim(), yearsExperience.toIntOrNull()))
                    }.onSuccess { result ->
                        successMessage = result.emailVerifyToken?.let { "تم إنشاء الحساب. رمز التفعيل: $it" } ?: "تمت العملية بنجاح"
                    }.onFailure { error = it.message ?: "تعذر تنفيذ العملية" }
                    loading = false
                }
            },
            enabled = !loading,
            modifier = Modifier.fillMaxWidth().height(56.dp),
            shape = RoundedCornerShape(18.dp),
            colors = ButtonDefaults.buttonColors(containerColor = FazaaNavy),
        ) {
            if (loading) { CircularProgressIndicator(modifier = Modifier.size(21.dp), color = FazaaGold, strokeWidth = 2.dp) } else Text(if (mode == AuthMode.Login) "تسجيل الدخول" else "إنشاء الحساب", fontWeight = FontWeight.ExtraBold, fontSize = 17.sp)
        }
        Text("فزعة FAZAAH · تجربة آمنة ومصممة لك", color = Color(0xFFAAA69B), fontSize = 11.sp, modifier = Modifier.fillMaxWidth().padding(top = 18.dp), textAlign = TextAlign.Center)
    }
}

private enum class AuthMode { Login, Register }

@Composable
private fun AuthModeToggle(mode: AuthMode, onModeChanged: (AuthMode) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().background(Color(0xFFF0EEE9), RoundedCornerShape(16.dp)).padding(4.dp)) {
        ModeButton("تسجيل الدخول", mode == AuthMode.Login, Modifier.weight(1f)) { onModeChanged(AuthMode.Login) }
        ModeButton("حساب جديد", mode == AuthMode.Register, Modifier.weight(1f)) { onModeChanged(AuthMode.Register) }
    }
}

@Composable
private fun ModeButton(label: String, selected: Boolean, modifier: Modifier, onClick: () -> Unit) {
    TextButton(onClick = onClick, modifier = modifier.background(if (selected) FazaaNavy else Color.Transparent, RoundedCornerShape(13.dp))) { Text(label, color = if (selected) Color.White else Color(0xFF8C897F), fontWeight = FontWeight.Bold) }
}

@Composable
private fun RoleBadge(role: String) {
    val provider = role == "provider"
    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = FazaaNavy)) {
        Row(modifier = Modifier.padding(13.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(40.dp).background(FazaaGold, RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) { Icon(if (provider) Icons.Default.Work else Icons.Default.Person, null, tint = FazaaNavy) }
            Spacer(Modifier.width(11.dp))
            Column(Modifier.weight(1f)) { Text(if (provider) "حساب مقدم خدمة" else "حساب عميل", color = Color.White, fontWeight = FontWeight.ExtraBold); Text(if (provider) "استقبل الطلبات وأدر خدماتك" else "اكتشف المهنيين واطلب خدماتك", color = Color.White.copy(alpha = .68f), fontSize = 11.sp) }
            Icon(Icons.Default.CheckCircle, null, tint = FazaaGold, modifier = Modifier.size(19.dp))
        }
    }
}

@Composable
private fun ProviderRegistrationFields(
    categories: List<NativeServiceCategory>, categoriesLoading: Boolean, categoriesError: String?, categoryId: Int?, onCategorySelected: (Int) -> Unit,
    bio: String, onBioChanged: (String) -> Unit, yearsExperience: String, onYearsChanged: (String) -> Unit, onRetryCategories: () -> Unit,
) {
    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.Work, null, tint = FazaaGold); Spacer(Modifier.width(8.dp)); Text("ما الخدمة التي تقدمها؟", color = FazaaNavy, fontWeight = FontWeight.ExtraBold) }
            CategoryPicker(categories, categoriesLoading, categoriesError, categoryId, onCategorySelected, onRetryCategories)
            OutlinedTextField(value = bio, onValueChange = { if (it.length <= 240) onBioChanged(it) }, modifier = Modifier.fillMaxWidth(), label = { Text("نبذة عن خدمتك") }, placeholder = { Text("مثال: أقدم خدمات السباكة المنزلية...") }, leadingIcon = { Icon(Icons.Default.Description, null, tint = FazaaGold) }, minLines = 3, maxLines = 4, shape = RoundedCornerShape(16.dp))
            Text("${bio.length}/240", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Start, color = Color.Gray, fontSize = 10.sp)
            FazaaField(value = yearsExperience, onValueChange = { if (it.all(Char::isDigit) && it.length <= 2) onYearsChanged(it) }, label = "سنوات الخبرة (اختياري)", leading = Icons.Default.Work, keyboardType = KeyboardType.Number, ltr = true)
        }
    }
}

@Composable
private fun CategoryPicker(categories: List<NativeServiceCategory>, loading: Boolean, error: String?, selectedId: Int?, onSelected: (Int) -> Unit, onRetry: () -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    val selected = categories.firstOrNull { it.id == selectedId }
    Box(Modifier.fillMaxWidth()) {
        OutlinedButton(onClick = { if (!loading && error == null && categories.isNotEmpty()) expanded = true }, enabled = !loading && error == null && categories.isNotEmpty(), modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
            Text(if (loading) "جاري تحميل مجالات الخدمة..." else selected?.let { "${it.icon.orEmpty()} ${it.name}" } ?: if (categories.isEmpty()) "لا توجد مجالات متاحة" else "اختر مجال خدمتك", modifier = Modifier.weight(1f), textAlign = TextAlign.Start)
            if (loading) CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp) else Icon(Icons.Default.ExpandMore, null)
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) { categories.forEach { category -> DropdownMenuItem(text = { Text("${category.icon.orEmpty()} ${category.name}") }, onClick = { onSelected(category.id); expanded = false }) } }
    }
    if (error != null) Row(verticalAlignment = Alignment.CenterVertically) { Text(error, color = Color(0xFFB3261E), fontSize = 12.sp, modifier = Modifier.weight(1f)); TextButton(onClick = onRetry) { Text("إعادة المحاولة") } }
    if (!loading && error == null && categories.isEmpty()) Text("لا توجد مجالات خدمة حالياً. يمكنك المحاولة لاحقاً.", color = Color.Gray, fontSize = 12.sp)
}

@Composable
fun NativeForgotPasswordPage(onBack: () -> Unit, onBackToLogin: () -> Unit, api: AuthLegalApi = UnboundAuthLegalApi) {
    var email by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var sent by remember { mutableStateOf(false) }
    var resetToken by remember { mutableStateOf<String?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    AuthLegalScaffold(title = "استعادة كلمة المرور", onBack = onBack) {
        if (sent) {
            NativeSuccessState(title = "تم الإرسال!", body = "إذا كان البريد مسجلاً ستصلك رسالة لإعادة تعيين كلمة المرور", icon = Icons.Default.CheckCircle)
            resetToken?.let { Card(modifier = Modifier.fillMaxWidth().padding(top = 16.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF4D6))) { Text("رمز التطوير: $it", color = Color(0xFF8A6925), modifier = Modifier.padding(13.dp), fontSize = 12.sp) } }
            Button(onClick = onBackToLogin, modifier = Modifier.fillMaxWidth().padding(top = 20.dp).height(52.dp), shape = RoundedCornerShape(17.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaNavy)) { Text("العودة لتسجيل الدخول", fontWeight = FontWeight.Bold) }
        } else {
            Box(Modifier.size(58.dp).background(FazaaNavy.copy(alpha = .1f), RoundedCornerShape(17.dp)), contentAlignment = Alignment.Center) { Icon(Icons.Default.Email, null, tint = FazaaNavy, modifier = Modifier.size(29.dp)) }
            Text("نسيت كلمة المرور؟", color = FazaaNavy, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(top = 18.dp))
            Text("أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة", color = Color.Gray, modifier = Modifier.padding(top = 6.dp))
            FazaaField(value = email, onValueChange = { email = it; error = null }, label = "بريدك الإلكتروني", leading = Icons.Default.Email, keyboardType = KeyboardType.Email, ltr = true, modifier = Modifier.padding(top = 18.dp))
            error?.let { NativeErrorMessage(it) }
            Button(onClick = {
                if (!email.trim().contains("@")) { error = "أدخل بريدك الإلكتروني بشكل صحيح"; return@Button }
                scope.launch { loading = true; error = null; runCatching { api.requestPasswordReset(email.trim()) }.onSuccess { resetToken = it.resetToken; sent = true }.onFailure { error = it.message ?: "تعذر إرسال رابط الاستعادة" }; loading = false }
            }, enabled = !loading, modifier = Modifier.fillMaxWidth().padding(top = 16.dp).height(56.dp), shape = RoundedCornerShape(18.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaNavy)) { if (loading) CircularProgressIndicator(Modifier.size(21.dp), color = FazaaGold, strokeWidth = 2.dp) else Text("إرسال رابط الاستعادة", fontWeight = FontWeight.Bold, fontSize = 16.sp) }
        }
    }
}

@Composable
fun NativePrivacyPage(onBack: () -> Unit, api: AuthLegalApi = UnboundAuthLegalApi) = NativeLegalPage(route = "/privacy", onBack = onBack, api = api)

@Composable
fun NativeTermsPage(onBack: () -> Unit, api: AuthLegalApi = UnboundAuthLegalApi) = NativeLegalPage(route = "/terms", onBack = onBack, api = api)

@Composable
private fun NativeLegalPage(route: String, onBack: () -> Unit, api: AuthLegalApi) {
    var document by remember(route) { mutableStateOf<NativeLegalDocument?>(null) }
    var loading by remember(route) { mutableStateOf(true) }
    var error by remember(route) { mutableStateOf<String?>(null) }
    val load: () -> Unit = { loading = true; error = null }
    LaunchedEffect(route, loading) {
        if (!loading) return@LaunchedEffect
        runCatching { api.loadLegalDocument(route) }.onSuccess { document = it }.onFailure { error = it.message ?: "تعذر تحميل الصفحة" }
        loading = false
    }
    AuthLegalScaffold(title = if (route == "/privacy") "سياسة الخصوصية" else "شروط الاستخدام", onBack = onBack) {
        when {
            loading -> NativeLoadingState("جاري تحميل الوثيقة...")
            error != null -> NativeErrorState(error!!, onRetry = load)
            document == null || document!!.sections.isEmpty() -> NativeEmptyState("لا توجد معلومات متاحة حالياً")
            else -> LegalDocumentContent(document!!)
        }
    }
}

@Composable
private fun LegalDocumentContent(document: NativeLegalDocument) {
    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = if (document.title == "سياسة الخصوصية") FazaaNavy else Color(0xFFFFF7E1))) {
        Column(Modifier.padding(18.dp)) { Text(document.eyebrow, color = if (document.title == "سياسة الخصوصية") FazaaGold else Color(0xFFA17B29), fontSize = 12.sp, fontWeight = FontWeight.Bold); Text(document.headline, color = if (document.title == "سياسة الخصوصية") Color.White else FazaaNavy, fontSize = 25.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 8.dp)); Text(document.introduction, color = if (document.title == "سياسة الخصوصية") Color.White.copy(alpha = .72f) else Color.Gray, lineHeight = 24.sp, modifier = Modifier.padding(top = 8.dp)) }
    }
    Spacer(Modifier.height(12.dp))
    document.sections.forEach { section ->
        Card(modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Row(Modifier.padding(16.dp), verticalAlignment = Alignment.Top) { Icon(Icons.Default.CheckCircle, null, tint = FazaaNavy, modifier = Modifier.size(20.dp)); Spacer(Modifier.width(10.dp)); Column { Text(section.title, color = FazaaNavy, fontWeight = FontWeight.ExtraBold); Text(section.body, color = Color(0xFF6E6D68), lineHeight = 24.sp, fontSize = 14.sp, modifier = Modifier.padding(top = 7.dp)) } }
        }
    }
    Text("آخر تحديث: ${document.updatedAt}", color = Color.Gray, fontSize = 11.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp))
}

@Composable
private fun AuthLegalScaffold(title: String, onBack: () -> Unit, content: @Composable () -> Unit) {
    LazyColumn(modifier = Modifier.fillMaxSize().background(FazaaBackground).navigationBarsPadding().padding(horizontal = 20.dp), verticalArrangement = Arrangement.spacedBy(0.dp)) {
        item {
            Row(modifier = Modifier.fillMaxWidth().padding(top = 18.dp, bottom = 12.dp), verticalAlignment = Alignment.CenterVertically) { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowForward, "رجوع", tint = FazaaNavy) }; BrandMarkSmall(); Spacer(Modifier.width(10.dp)); Text(title, color = FazaaNavy, fontSize = 19.sp, fontWeight = FontWeight.Black) }
        }
        item { content() }
    }
}

@Composable
private fun BrandMarkSmall() { Box(Modifier.size(38.dp).background(FazaaGold, RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) { Text("ف", color = FazaaNavy, fontSize = 22.sp, fontWeight = FontWeight.Black) } }

@Composable
private fun FazaaField(value: String, onValueChange: (String) -> Unit, label: String, leading: androidx.compose.ui.graphics.vector.ImageVector, keyboardType: KeyboardType = KeyboardType.Text, ltr: Boolean = false, modifier: Modifier = Modifier) {
    OutlinedTextField(value = value, onValueChange = onValueChange, modifier = modifier.fillMaxWidth(), label = { Text(label) }, leadingIcon = { Icon(leading, null, tint = FazaaNavy) }, keyboardOptions = KeyboardOptions(keyboardType = keyboardType), singleLine = true, shape = RoundedCornerShape(16.dp))
}

@Composable
private fun NativeLoadingState(message: String) { Column(Modifier.fillMaxWidth().padding(vertical = 48.dp), horizontalAlignment = Alignment.CenterHorizontally) { CircularProgressIndicator(color = FazaaNavy); Text(message, color = Color.Gray, modifier = Modifier.padding(top = 14.dp)) } }
@Composable
private fun NativeEmptyState(message: String) { Column(Modifier.fillMaxWidth().padding(vertical = 48.dp), horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.Description, null, tint = Color.Gray, modifier = Modifier.size(42.dp)); Text(message, color = Color.Gray, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp)) } }
@Composable
private fun NativeErrorState(message: String, onRetry: () -> Unit) { Column(Modifier.fillMaxWidth().padding(vertical = 35.dp), horizontalAlignment = Alignment.CenterHorizontally) { Icon(Icons.Default.ErrorOutline, null, tint = Color(0xFFB3261E), modifier = Modifier.size(40.dp)); Text(message, color = Color(0xFFB3261E), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 10.dp)); OutlinedButton(onClick = onRetry, modifier = Modifier.padding(top = 12.dp)) { Icon(Icons.Default.Refresh, null); Spacer(Modifier.width(6.dp)); Text("إعادة المحاولة") } } }
@Composable
private fun NativeErrorMessage(message: String) { Text(message, color = Color(0xFFB3261E), fontSize = 12.sp, modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) }
@Composable
private fun NativeSuccessMessage(message: String) { Text(message, color = Color(0xFF16704A), fontSize = 12.sp, modifier = Modifier.fillMaxWidth().padding(top = 8.dp)) }
@Composable
private fun NativeSuccessState(title: String, body: String, icon: androidx.compose.ui.graphics.vector.ImageVector) { Column(Modifier.fillMaxWidth().padding(top = 35.dp), horizontalAlignment = Alignment.CenterHorizontally) { Box(Modifier.size(78.dp).background(Color(0xFFE4F5E9), CircleShape), contentAlignment = Alignment.Center) { Icon(icon, null, tint = Color(0xFF16704A), modifier = Modifier.size(43.dp)) }; Text(title, color = FazaaNavy, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(top = 16.dp)); Text(body, color = Color.Gray, textAlign = TextAlign.Center, lineHeight = 23.sp, modifier = Modifier.padding(top = 8.dp)) } }
@Composable
private fun NativeAuthLegalNotFoundPage(onBack: () -> Unit) { AuthLegalScaffold("صفحة فزعة", onBack) { NativeEmptyState("المسار المطلوب غير متاح ضمن مجموعة المصادقة والقانونية") } }

private fun validateAuth(mode: AuthMode, email: String, password: String, name: String, provider: Boolean, categoryId: Int?, bio: String): String? {
    if (!email.trim().contains("@")) return "أدخل البريد الإلكتروني بشكل صحيح"
    if (password.isBlank()) return "أدخل كلمة المرور"
    if (mode == AuthMode.Register && name.trim().length < 2) return "أدخل اسمك الكامل"
    if (mode == AuthMode.Register && provider && categoryId == null) return "حدد مجال خدمتك"
    if (mode == AuthMode.Register && provider && bio.trim().length < 10) return "اكتب نبذة عن خدمتك لا تقل عن 10 أحرف"
    return null
}

private fun legalDocumentFor(route: String): NativeLegalDocument = if (route == "/terms") {
    NativeLegalDocument("شروط الاستخدام", "استخدام مسؤول", "شروط واضحة للجميع", "تهدف هذه الشروط إلى تنظيم العلاقة بين العملاء ومقدمي الخدمات.", listOf(
        NativeLegalSection("قبول الشروط", "باستخدام فزعة، تقر بأنك قرأت هذه الشروط وتوافق على الالتزام بها. إذا لم توافق عليها، يرجى عدم استخدام الخدمات."),
        NativeLegalSection("الحسابات", "يجب تقديم معلومات صحيحة والمحافظة على سرية بيانات الدخول. الحساب شخصي، وأنت مسؤول عن النشاط الذي يتم من خلاله."),
        NativeLegalSection("مقدمو الخدمة", "يلتزم مقدم الخدمة بوصف خدماته بدقة، احترام العملاء، الالتزام بالمواعيد المتفق عليها، وعدم تقديم أعمال مخالفة للأنظمة أو السلامة."),
        NativeLegalSection("العملاء والطلبات", "على العميل وصف احتياجه بوضوح واحترام مقدم الخدمة. تفاصيل السعر والموعد ونطاق العمل يجب أن تُتفق عليها داخل الطلب قبل التنفيذ."),
        NativeLegalSection("المحتوى والسلوك", "يُمنع استخدام فزعة للإساءة أو الاحتيال أو نشر محتوى مخالف أو جمع بيانات الآخرين دون إذن. قد نوقف الحساب عند وجود مخالفة واضحة."),
        NativeLegalSection("الدفع والتحديثات", "قد نضيف خدمات دفع أو ميزات جديدة لاحقاً. سنوضح أي رسوم أو شروط مرتبطة بها قبل استخدامها، وقد نحدّث هذه الشروط عند الحاجة."),
    ), "6 سبتمبر 2026")
} else {
    NativeLegalDocument("سياسة الخصوصية", "فزعة FAZAAH", "خصوصيتك أولوية", "نوضح هنا ما نحتاجه لتقديم تجربة آمنة وواضحة.", listOf(
        NativeLegalSection("المعلومات التي نجمعها", "نجمع المعلومات التي تقدمها عند إنشاء الحساب مثل الاسم ورقم الهاتف أو البريد الإلكتروني والمدينة. وقد نحتفظ بمعلومات الخدمة والتقييمات والرسائل اللازمة لتشغيل المنصة."),
        NativeLegalSection("كيف نستخدم المعلومات", "نستخدم بياناتك لتسجيل الدخول، مطابقة العملاء مع مقدمي الخدمة، إدارة الطلبات والرسائل، تحسين الأمان، وإرسال التنبيهات المتعلقة بالخدمات التي طلبتها."),
        NativeLegalSection("مشاركة البيانات", "لا نبيع بياناتك الشخصية. قد تظهر بعض معلومات الملف المهني للعملاء عند تصفح الخدمات، ولا تتم مشاركة بيانات الاتصال الخاصة إلا عندما يكون ذلك ضرورياً لتنفيذ الطلب."),
        NativeLegalSection("حماية الحساب", "حافظ على سرية رمز التحقق وكلمة المرور، وأبلغنا فوراً إذا لاحظت استخداماً غير معتاد لحسابك. نستخدم وسائل حماية مناسبة للمعلومات المخزنة لدينا."),
        NativeLegalSection("حقوقك", "يمكنك طلب تصحيح معلوماتك أو الاستفسار عن طريقة استخدامها أو طلب حذف الحساب وفق المتطلبات القانونية والتشغيلية. تواصل مع فريق الدعم من داخل التطبيق."),
    ), "6 سبتمبر 2026")
}

@Composable
private fun CompositionRtl(content: @Composable () -> Unit) {
    androidx.compose.runtime.CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl) { content() }
}
