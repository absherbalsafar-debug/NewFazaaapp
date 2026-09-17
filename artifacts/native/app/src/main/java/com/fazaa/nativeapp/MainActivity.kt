package com.fazaa.nativeapp

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel

private val Teal = Color(0xFF0F766E)
private val Gold = Color(0xFFFBBF24)
private val Surface = Color(0xFFF8FAFC)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); setContent { FazaaTheme { FazaaApp() } } }
}

@Composable fun FazaaTheme(content: @Composable () -> Unit) { MaterialTheme(colorScheme = lightColorScheme(primary = Teal, background = Surface), content = content) }

@Composable fun FazaaApp(vm: FazaaViewModel = viewModel()) {
    val state by vm.state.collectAsState(); val user by vm.user.collectAsState()
    var screen by remember { mutableStateOf("home") }; var selected by remember { mutableStateOf<Provider?>(null) }
    var showLogin by remember { mutableStateOf(false) }
    CompositionLocalProvider(LocalLayoutDirection provides androidx.compose.ui.unit.LayoutDirection.Rtl) {
        when {
            showLogin -> LoginScreen(onBack = { showLogin = false }, onLogin = { phone, password, done -> vm.login(phone, password) { done(it); if (it == null) showLogin = false } })
            selected != null -> ProviderDetailScreen(selected!!, onBack = { selected = null })
            else -> MainScreen(state, user, screen, onTab = { screen = it }, onSelect = { selected = it }, onLogin = { showLogin = true }, onLogout = vm::logout, onSearch = vm::refresh)
        }
    }
}

@Composable private fun MainScreen(state: LoadState, user: User?, screen: String, onTab: (String) -> Unit, onSelect: (Provider) -> Unit, onLogin: () -> Unit, onLogout: () -> Unit, onSearch: (String, String, Int?) -> Unit) {
    Scaffold(bottomBar = { NavigationBar { NavigationBarItem(selected = screen == "home", onClick = { onTab("home") }, icon = { Text("⌂") }, label = { Text("الرئيسية") }); NavigationBarItem(selected = screen == "discover", onClick = { onTab("discover") }, icon = { Text("⌕") }, label = { Text("استكشف") }); NavigationBarItem(selected = screen == "account", onClick = { onTab("account") }, icon = { Text("◉") }, label = { Text("حسابي") }) } }) { pad ->
        when (screen) {
            "account" -> AccountScreen(user, onLogin, onLogout, Modifier.padding(pad))
            else -> HomeDiscoverScreen(state, screen == "discover", onSelect, onSearch, Modifier.padding(pad))
        }
    }
}

@Composable private fun HomeDiscoverScreen(state: LoadState, discover: Boolean, onSelect: (Provider) -> Unit, onSearch: (String, String, Int?) -> Unit, modifier: Modifier) {
    var query by remember { mutableStateOf("") }; var city by remember { mutableStateOf("") }
    Column(modifier.fillMaxSize().background(Surface).padding(20.dp)) {
        Text("فزعة", color = Teal, fontSize = 34.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.End, modifier = Modifier.fillMaxWidth())
        Text(if (discover) "استعرض المهنيين" else "خدماتك في مكان واحد", color = Color.Gray, modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.End)
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(query, { query = it }, label = { Text("ابحث عن مهني أو خدمة") }, modifier = Modifier.fillMaxWidth())
        if (discover) OutlinedTextField(city, { city = it }, label = { Text("المدينة") }, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
        Button(onClick = { onSearch(query, city, null) }, modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp)) { Text("بحث") }
        when (state) {
            LoadState.Loading -> Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator(color = Teal) }
            is LoadState.Error -> Text(state.message, color = Color.Red, modifier = Modifier.padding(12.dp))
            is LoadState.Ready -> { Text(if (discover) "النتائج" else "مهنيون مميزون", fontSize = 21.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(vertical = 8.dp)); LazyColumn { items(state.providers) { ProviderCard(it, onSelect) } } }
        }
    }
}

@Composable private fun ProviderCard(p: Provider, onSelect: (Provider) -> Unit) { Card(Modifier.fillMaxWidth().padding(vertical = 6.dp).clickable { onSelect(p) }, shape = RoundedCornerShape(18.dp)) { Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.End) { Text(p.name, fontWeight = FontWeight.Bold, fontSize = 17.sp); Text("${p.categoryName} · ${p.city} · ${p.district}", color = Color.Gray, fontSize = 12.sp); Text("★ ${"%.1f".format(p.rating)} (${p.reviewCount}) · ${p.yearsExperience} سنة خبرة", color = Color(0xFFB45309), fontSize = 12.sp); p.bio?.let { Text(it, color = Color.DarkGray, modifier = Modifier.padding(top = 8.dp), textAlign = TextAlign.End) }; Text(if (p.isVerified) "مهني موثق" else "قيد التحقق", color = Color(0xFF047857), modifier = Modifier.padding(top = 8.dp)) } } }

@Composable private fun ProviderDetailScreen(p: Provider, onBack: () -> Unit) { val context = LocalContext.current; Column(Modifier.fillMaxSize().background(Surface).padding(20.dp), horizontalAlignment = Alignment.End) { Text("‹ العودة", color = Teal, modifier = Modifier.fillMaxWidth().clickable { onBack() }); Spacer(Modifier.height(20.dp)); Text(p.name, fontSize = 30.sp, fontWeight = FontWeight.Black); Text("${p.categoryName} · ${p.city} · ${p.district}", color = Color.Gray); Text(p.bio ?: "لا توجد نبذة مضافة بعد.", modifier = Modifier.padding(vertical = 20.dp), textAlign = TextAlign.End); Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) { Button(onClick = { context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:${p.phone}"))) }, modifier = Modifier.weight(1f)) { Text("اتصال") }; p.whatsapp?.let { Button(onClick = { context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/${it.filter(Char::isDigit)}"))) }, modifier = Modifier.weight(1f), colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A))) { Text("واتساب") } } }; Spacer(Modifier.height(20.dp)); Text("★ ${p.rating} (${p.reviewCount})", fontWeight = FontWeight.Bold) } }

@Composable private fun AccountScreen(user: User?, onLogin: () -> Unit, onLogout: () -> Unit, modifier: Modifier) { Column(modifier.fillMaxSize().background(Surface).padding(20.dp), horizontalAlignment = Alignment.End) { Text("حسابي", fontSize = 28.sp, fontWeight = FontWeight.Black); Spacer(Modifier.height(24.dp)); if (user == null) { Text("سجل الدخول للوصول إلى حسابك", color = Color.Gray); Button(onClick = onLogin, modifier = Modifier.fillMaxWidth().padding(top = 16.dp)) { Text("تسجيل الدخول") } } else { Text(user.name, fontWeight = FontWeight.Bold); Text(user.phone, color = Color.Gray); OutlinedButton(onClick = onLogout, modifier = Modifier.fillMaxWidth().padding(top = 20.dp)) { Text("تسجيل الخروج") } } } }

@Composable private fun LoginScreen(onBack: () -> Unit, onLogin: (String, String, (String?) -> Unit) -> Unit) { var phone by remember { mutableStateOf("") }; var password by remember { mutableStateOf("") }; var error by remember { mutableStateOf<String?>(null) }; Column(Modifier.fillMaxSize().background(Surface).padding(22.dp), horizontalAlignment = Alignment.End) { Text("‹ العودة", color = Teal, modifier = Modifier.clickable { onBack() }); Text("تسجيل الدخول", fontSize = 28.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 28.dp)); OutlinedTextField(phone, { phone = it }, label = { Text("رقم الهاتف") }, modifier = Modifier.fillMaxWidth().padding(top = 20.dp)); OutlinedTextField(password, { password = it }, label = { Text("كلمة المرور") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth().padding(top = 10.dp)); error?.let { Text(it, color = Color.Red, modifier = Modifier.padding(top = 10.dp)) }; Button(onClick = { onLogin(phone, password) { error = it } }, modifier = Modifier.fillMaxWidth().padding(top = 18.dp)) { Text("دخول") } } }
