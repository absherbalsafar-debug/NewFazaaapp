package com.fazaa.app

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedContent
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.launch

internal val FazaaNavy = Color(0xFF0E2F62)
internal val FazaaGold = Color(0xFFF5B916)
internal val FazaaTeal = Color(0xFF0F766E)
internal val FazaaBackground = Color(0xFFF7F8FA)

object NativeNavigation {
    var handler: (() -> Boolean)? = null
    fun back(): Boolean = handler?.invoke() ?: false
}

private sealed class Screen {
    data object Welcome : Screen()
    data class Phone(val role: String = "client") : Screen()
    data class Otp(val role: String, val phone: String, val devOtp: String?) : Screen()
    data class Name(val role: String, val phone: String, val otp: String) : Screen()
    data object Home : Screen()
    data object Discover : Screen()
    data object Requests : Screen()
    data object Profile : Screen()
    data object Pages : Screen()
    data class Page(val route: String) : Screen()
}

@Composable
fun FazaaNativeApp() {
    MaterialTheme {
        val stack = remember { mutableStateOf(listOf<Screen>(Screen.Welcome)) }
        val current = stack.value.last()
        DisposableEffect(Unit) {
            NativeNavigation.handler = {
                if (stack.value.size > 1) {
                    stack.value = stack.value.dropLast(1)
                    true
                } else false
            }
            onDispose { NativeNavigation.handler = null }
        }
        Surface(modifier = Modifier.fillMaxSize(), color = FazaaBackground) {
            AnimatedContent(targetState = current, label = "fazaa-native-navigation") { screen ->
                when (screen) {
                    Screen.Welcome -> WelcomeScreen { role -> stack.value = stack.value + Screen.Phone(role) }
                    is Screen.Phone -> PhoneScreen(role = screen.role, onBack = { stack.value = stack.value.dropLast(1) }, onOtp = { phone, code -> stack.value = stack.value + Screen.Otp(screen.role, phone, code) })
                    is Screen.Otp -> OtpScreen(screen, onBack = { stack.value = stack.value.dropLast(1) }, onNeedsName = { stack.value = stack.value + Screen.Name(screen.role, screen.phone, it) }, onLoggedIn = { stack.value = listOf(Screen.Home) })
                    is Screen.Name -> NameScreen(screen, onBack = { stack.value = stack.value.dropLast(1) }, onComplete = { stack.value = listOf(Screen.Home) })
                    Screen.Home -> MainShell(selected = 0, onOpenPages = { stack.value = stack.value + Screen.Pages }, onSelect = { index -> stack.value = listOf(if (index == 1) Screen.Discover else if (index == 2) Screen.Requests else if (index == 3) Screen.Profile else Screen.Home) })
                    Screen.Discover -> MainShell(selected = 1, onOpenPages = { stack.value = stack.value + Screen.Pages }, onSelect = { index -> stack.value = listOf(if (index == 0) Screen.Home else if (index == 2) Screen.Requests else if (index == 3) Screen.Profile else Screen.Discover) })
                    Screen.Requests -> MainShell(selected = 2, onOpenPages = { stack.value = stack.value + Screen.Pages }, onSelect = { index -> stack.value = listOf(if (index == 0) Screen.Home else if (index == 1) Screen.Discover else if (index == 3) Screen.Profile else Screen.Requests) })
                    Screen.Profile -> MainShell(selected = 3, onOpenPages = { stack.value = stack.value + Screen.Pages }, onSelect = { index -> stack.value = listOf(if (index == 0) Screen.Home else if (index == 1) Screen.Discover else if (index == 2) Screen.Requests else Screen.Profile) })
                    Screen.Pages -> NativePagesIndex(onOpen = { stack.value = stack.value + Screen.Page(it) })
                    is Screen.Page -> NativeRouteScreen(route = screen.route, onBack = { stack.value = stack.value.dropLast(1) }, onNavigate = { stack.value = stack.value + Screen.Page(it) })
                }
            }
        }
    }
}

@Composable
private fun NativeRouteScreen(route: String, onBack: () -> Unit, onNavigate: (String) -> Unit) {
    when {
        route.startsWith("/auth/") || route == "/privacy" || route == "/terms" -> NativeAuthLegalPageScreen(route, onBack, onNavigate)
        route == "/admin" || route.startsWith("/admin/") || route == "/sponsored-preview" -> NativeAdminPageScreen(route, onBack)
        route.startsWith("/provider-") || route == "/provider-dashboard" || route == "/provider-business" || route == "/provider-verify" || route == "/verify" || route == "/earnings" || route == "/wallet" || route == "/register" -> NativeProviderPage(route, onBack = onBack, onNavigate = { target -> onNavigate(when (target) { ProviderRoute.DASHBOARD -> "/provider-dashboard"; ProviderRoute.BUSINESS -> "/provider-business"; ProviderRoute.VERIFY -> "/provider-verify"; ProviderRoute.EARNINGS -> "/earnings"; ProviderRoute.WALLET -> "/wallet"; ProviderRoute.REGISTER -> "/register" }) })
        route == "/" || route == "/discover" || route == "/providers" || route.startsWith("/providers/") || route == "/request/new" || route == "/my-requests" || route.startsWith("/my-requests/") || route == "/favorites" || route == "/notifications" -> NativeClientPage(route, onNavigate = onNavigate, onBack = onBack)
        else -> NativePageScreen(route, onBack)
    }
}

@Composable
private fun WelcomeScreen(onStart: (String) -> Unit) {
    var role by remember { mutableStateOf("client") }
    Column(modifier = Modifier.fillMaxSize().background(FazaaBackground).padding(22.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Spacer(Modifier.height(34.dp))
        BrandMark(large = true)
        Spacer(Modifier.height(24.dp))
        Text("أهلاً وسهلاً بك في", color = FazaaNavy, fontSize = 28.sp, fontWeight = FontWeight.Black)
        Text("فزعة", color = FazaaGold, fontSize = 38.sp, fontWeight = FontWeight.Black)
        Text("منصة توصلك بأفضل المهنيين والفنيين لإنجاز احتياجاتك بسهولة وسرعة.", color = Color(0xFF637087), textAlign = TextAlign.Center, modifier = Modifier.padding(top = 12.dp))
        Spacer(Modifier.height(28.dp))
        RoleCard("أبحث عن خدمة", "أصل إلى الشخص المناسب بثقة", role == "client") { role = "client" }
        Spacer(Modifier.height(12.dp))
        RoleCard("أقدّم خدمة", "أحوّل خبرتي إلى فرص حقيقية", role == "provider") { role = "provider" }
        Spacer(Modifier.weight(1f))
        Button(onClick = { onStart(role) }, modifier = Modifier.fillMaxWidth().height(56.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaNavy), shape = RoundedCornerShape(18.dp)) { Text("التسجيل برقم الهاتف", fontWeight = FontWeight.Bold) }
        Text("تجربة آمنة ومصممة لك", color = Color.Gray, fontSize = 12.sp, modifier = Modifier.padding(top = 14.dp))
    }
}

@Composable
private fun BrandMark(large: Boolean = false) {
    Box(modifier = Modifier.size(if (large) 112.dp else 54.dp).background(FazaaGold, CircleShape), contentAlignment = Alignment.Center) {
        Text("ف", color = FazaaNavy, fontSize = if (large) 58.sp else 30.sp, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun RoleCard(title: String, subtitle: String, selected: Boolean, onClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick), shape = RoundedCornerShape(22.dp), colors = androidx.compose.material3.CardDefaults.cardColors(containerColor = if (selected) FazaaNavy else Color.White)) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier.size(52.dp).background(if (selected) FazaaGold else Color(0xFFF1EEE7), RoundedCornerShape(16.dp)), contentAlignment = Alignment.Center) { Icon(Icons.Default.Person, null, tint = FazaaNavy) }
            Spacer(Modifier.width(14.dp))
            Column(Modifier.weight(1f)) { Text(title, color = if (selected) Color.White else FazaaNavy, fontWeight = FontWeight.Bold); Text(subtitle, color = if (selected) Color.White.copy(alpha = .7f) else Color.Gray, fontSize = 12.sp) }
            if (selected) Icon(Icons.Default.Check, null, tint = FazaaGold)
        }
    }
}

@Composable
private fun PhoneScreen(role: String, onBack: () -> Unit, onOtp: (String, String?) -> Unit) {
    var phone by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    AuthScaffold("أدخل رقم هاتفك", onBack) {
        Text("سنرسل رمزاً قصيراً إلى رقمك لتبدأ تجربتك بأمان.", color = Color.Gray)
        Spacer(Modifier.height(20.dp))
        OutlinedTextField(value = phone, onValueChange = { phone = it.filter(Char::isDigit) }, label = { Text("رقم الهاتف") }, placeholder = { Text("7XXXXXXXX") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), modifier = Modifier.fillMaxWidth())
        error?.let { Text(it, color = Color(0xFFB00020), modifier = Modifier.padding(top = 8.dp)) }
        Spacer(Modifier.height(18.dp))
        Button(onClick = { scope.launch { loading = true; error = null; runCatching { ApiClient.sendOtp(phone) }.onSuccess { onOtp(phone, it.otp) }.onFailure { error = it.message }; loading = false } }, enabled = phone.length >= 7 && !loading, modifier = Modifier.fillMaxWidth().height(54.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaNavy)) { Text(if (loading) "جاري الإرسال..." else "إرسال رمز التحقق") }
    }
}

@Composable
private fun OtpScreen(screen: Screen.Otp, onBack: () -> Unit, onNeedsName: (String) -> Unit, onLoggedIn: () -> Unit) {
    var otp by remember { mutableStateOf(screen.devOtp ?: "") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    AuthScaffold("تحقق من هاتفك", onBack) {
        Text("أدخل الرمز الذي وصل إلى هاتفك لإكمال الدخول.", color = Color.Gray)
        Text("أرسلنا الرمز إلى ${screen.phone}", color = FazaaNavy, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 18.dp))
        screen.devOtp?.let { Text("رمز التطوير: $it", color = Color(0xFF8A6925), fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 12.dp)) }
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(value = otp, onValueChange = { otp = it.filter(Char::isDigit).take(6) }, label = { Text("رمز التحقق") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), modifier = Modifier.fillMaxWidth())
        error?.let { Text(it, color = Color(0xFFB00020), modifier = Modifier.padding(top = 8.dp)) }
        Spacer(Modifier.height(18.dp))
        Button(onClick = { scope.launch { loading = true; error = null; runCatching { ApiClient.verifyOtp(screen.phone, otp) }.onSuccess { if (it.needsRegistration) onNeedsName(otp) else onLoggedIn() }.onFailure { error = it.message }; loading = false } }, enabled = otp.length == 6 && !loading, modifier = Modifier.fillMaxWidth().height(54.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaNavy)) { Text(if (loading) "جاري التحقق..." else "تأكيد الرمز") }
    }
}

@Composable
private fun NameScreen(screen: Screen.Name, onBack: () -> Unit, onComplete: () -> Unit) {
    var name by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()
    AuthScaffold("خطوة أخيرة", onBack) {
        Text("عرّفنا باسمك لإكمال حسابك في فزعة.", color = Color.Gray)
        Spacer(Modifier.height(18.dp))
        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("الاسم الكامل") }, modifier = Modifier.fillMaxWidth())
        error?.let { Text(it, color = Color(0xFFB00020), modifier = Modifier.padding(top = 8.dp)) }
        Spacer(Modifier.height(18.dp))
        Button(onClick = { scope.launch { loading = true; runCatching { ApiClient.verifyOtp(screen.phone, screen.otp, name, screen.role) }.onSuccess { onComplete() }.onFailure { error = it.message }; loading = false } }, enabled = name.trim().length >= 2 && !loading, modifier = Modifier.fillMaxWidth().height(54.dp), colors = ButtonDefaults.buttonColors(containerColor = FazaaNavy)) { Text(if (loading) "جاري إنشاء الحساب..." else "أكمل إلى فزعة") }
    }
}

@Composable
private fun AuthScaffold(title: String, onBack: () -> Unit, content: @Composable () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().background(FazaaBackground).padding(22.dp)) {
        IconButton(onClick = onBack) { Icon(Icons.Default.ArrowForward, "رجوع", tint = FazaaNavy) }
        BrandMark()
        Spacer(Modifier.height(28.dp))
        Text(title, color = FazaaNavy, fontSize = 30.sp, fontWeight = FontWeight.Black)
        Spacer(Modifier.height(22.dp))
        content()
    }
}

@Composable
private fun MainShell(selected: Int, onOpenPages: () -> Unit, onSelect: (Int) -> Unit) {
    Scaffold(bottomBar = { BottomBar(selected, onSelect) }) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(22.dp), horizontalAlignment = Alignment.End) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) { BrandMark(); Text("مرحباً بك في فزعة", color = FazaaNavy, fontSize = 22.sp, fontWeight = FontWeight.Black) }
            Spacer(Modifier.height(28.dp))
            Text(if (selected == 0) "اكتشف المهنيين من حولك" else if (selected == 1) "اكتشف الخدمات" else if (selected == 2) "طلباتي" else "ملفي الشخصي", color = FazaaNavy, fontSize = 25.sp, fontWeight = FontWeight.Black)
            Spacer(Modifier.height(20.dp))
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(24.dp), colors = androidx.compose.material3.CardDefaults.cardColors(containerColor = FazaaNavy)) {
                Column(modifier = Modifier.padding(20.dp)) { Text("تواصل مباشرة مع المهني", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold); Text("اتصال أو واتساب فقط — بدون رسائل داخلية أو مكالمات داخل التطبيق", color = Color.White.copy(alpha = .7f), fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp)); ContactButtons() }
            }
            OutlinedButton(onClick = onOpenPages, modifier = Modifier.fillMaxWidth().padding(top = 14.dp)) { Text("استعراض صفحات فزعة") }
        }
    }
}

@Composable
private fun ContactButtons() {
    val context = LocalContext.current
    Row(modifier = Modifier.padding(top = 18.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Button(onClick = { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:"))) }, colors = ButtonDefaults.buttonColors(containerColor = FazaaGold)) { Icon(Icons.Default.Call, null, tint = FazaaNavy); Spacer(Modifier.width(6.dp)); Text("اتصال", color = FazaaNavy) }
        Button(onClick = { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/"))) }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF25D366))) { Icon(Icons.Default.Chat, null); Spacer(Modifier.width(6.dp)); Text("واتساب") }
    }
}

@Composable
private fun BottomBar(selected: Int, onSelect: (Int) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().background(Color.White).navigationBarsPadding().padding(vertical = 10.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
        listOf(Icons.Default.Home, Icons.Default.Search, Icons.Default.LocationOn, Icons.Default.Person).forEachIndexed { index, icon -> IconButton(onClick = { onSelect(index) }) { Icon(icon, null, tint = if (selected == index) FazaaNavy else Color.Gray) } }
    }
}
