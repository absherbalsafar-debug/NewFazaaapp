package com.fazaa.app

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.json.JSONObject

@Composable
fun ClientProfilePage(onNavigate: (String) -> Unit, onBack: () -> Unit) {
    var user by remember { mutableStateOf<JSONObject?>(null) }
    var provider by remember { mutableStateOf<JSONObject?>(null) }
    LaunchedEffect(Unit) {
        runCatching { ApiClient.request("/auth/me") }.onSuccess { user = it }
        runCatching { ApiClient.request("/providers/me") }.onSuccess { provider = it }
    }
    PageSurface {
        LazyColumn(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item { Box(Modifier.fillMaxWidth().height(140.dp).background(FazaaNavy, RoundedCornerShape(bottomStart = 34.dp, bottomEnd = 34.dp))) { TopBar("حسابي", onBack, { IconButton({ onNavigate("/settings") }) { Icon(Icons.Default.Settings, "الإعدادات", tint = Color.White) } }) } }
            item { Card(Modifier.padding(horizontal = 16.dp).fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(26.dp)) { Row(Modifier.padding(18.dp), verticalAlignment = Alignment.CenterVertically) { Avatar(user?.optString("name", "فزعة") ?: "فزعة", 76.dp); Column(Modifier.padding(horizontal = 14.dp)) { Text(user?.optString("name", "حساب فزعة") ?: "حساب فزعة", color = FazaaNavy, fontSize = 18.sp, fontWeight = FontWeight.Black); Text(if (user?.optString("role") == "provider") "مقدم خدمة" else "عميل", color = Color(0xFF60728A), fontSize = 12.sp); Text(user?.optString("phone", "") ?: "", color = Color(0xFF60728A), fontSize = 12.sp) } } } }
            provider?.let { p -> item { Card(Modifier.padding(horizontal = 16.dp).fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(22.dp)) { Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceEvenly) { listOf("التقييم" to p.optString("rating", "0"), "مشاريع" to p.optString("completedJobs", "0"), "الخبرة" to p.optString("yearsExperience", "0")).forEach { (label, value) -> Column(horizontalAlignment = Alignment.CenterHorizontally) { Text(value, color = FazaaNavy, fontWeight = FontWeight.Black); Text(label, color = Color.Gray, fontSize = 11.sp) } } } } } }
            item { Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) { ProfileAction("طلباتي", "تتبع حالة طلباتك", Icons.Default.Description) { onNavigate("/my-requests") }; ProfileAction("المفضلة", "المهنيون المحفوظون", Icons.Default.Favorite) { onNavigate("/favorites") }; ProfileAction("الإشعارات", "إدارة التنبيهات", Icons.Default.Notifications) { onNavigate("/notifications") }; ProfileAction("الإعدادات", "الحساب والأمان", Icons.Default.Settings) { onNavigate("/settings") } } }
        }
    }
}

@Composable private fun ProfileAction(title: String, subtitle: String, icon: androidx.compose.ui.graphics.vector.ImageVector, onClick: () -> Unit) { Card(onClick = onClick, modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(18.dp)) { Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Box(Modifier.size(42.dp).background(Color(0xFFEAF0F7), RoundedCornerShape(14.dp)), contentAlignment = Alignment.Center) { Icon(icon, null, tint = FazaaNavy) }; Column(Modifier.weight(1f).padding(horizontal = 12.dp)) { Text(title, color = FazaaNavy, fontWeight = FontWeight.Bold); Text(subtitle, color = Color.Gray, fontSize = 11.sp) }; Icon(Icons.Default.ArrowForward, null, tint = Color.Gray) } } }

@Composable
fun ClientSettingsPage(onNavigate: (String) -> Unit, onBack: () -> Unit) {
    var dark by remember { mutableStateOf(false) }
    PageSurface { LazyColumn(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(14.dp)) { item { TopBar("الإعدادات", onBack) }; item { SettingGroup("حسابي") { SettingRow(Icons.Default.Person, "الملف الشخصي", "المعلومات والبيانات") { onNavigate("/profile") } } }; item { SettingGroup("المظهر") { SettingRow(Icons.Default.DarkMode, "الوضع الليلي", if (dark) "مفعّل" else "غير مفعّل", trailing = { Switch(dark, { dark = it }) }); SettingRow(Icons.Default.Info, "اللغة", "العربية") } }; item { SettingGroup("الأمان والخصوصية") { SettingRow(Icons.Default.Lock, "تغيير كلمة المرور", "إرسال رابط إعادة التعيين") { onNavigate("/auth/forgot-password") }; SettingRow(Icons.Default.Shield, "سياسة الخصوصية", "كيف نحمي بياناتك") { onNavigate("/privacy") }; SettingRow(Icons.Default.Description, "شروط الاستخدام", "القواعد المنظمة لاستخدام فزعة") { onNavigate("/terms") } } }; item { SettingGroup("الحساب") { SettingRow(Icons.Default.Logout, "تسجيل الخروج", "إزالة الجلسة من هذا الجهاز", danger = true) { ApiClient.setToken(null); onNavigate("/welcome") } } }; item { Text("فزعة FAZAAH v1.0.0 — صنعاء، اليمن", color = Color.Gray, fontSize = 11.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(16.dp)) } } }
}

@Composable private fun SettingGroup(title: String, content: @Composable () -> Unit) { Column(Modifier.padding(horizontal = 16.dp)) { Text(title, color = Color(0xFFA17B29), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(start = 4.dp, bottom = 6.dp)); Card(Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(22.dp)) { Column { content() } } } }
@Composable private fun SettingRow(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, subtitle: String, danger: Boolean = false, trailing: (@Composable () -> Unit)? = null, onClick: (() -> Unit)? = null) { Row(Modifier.fillMaxWidth().clickable { onClick?.invoke() }.padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Box(Modifier.size(38.dp).background(Color(0xFFF1F4F8), RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) { Icon(icon, null, tint = if (danger) Color(0xFFB3261E) else FazaaNavy, modifier = Modifier.size(18.dp)) }; Column(Modifier.weight(1f).padding(horizontal = 11.dp)) { Text(title, color = if (danger) Color(0xFFB3261E) else FazaaNavy, fontWeight = FontWeight.Bold); Text(subtitle, color = Color.Gray, fontSize = 11.sp) }; if (trailing != null) trailing() else Icon(Icons.Default.ArrowForward, null, tint = Color.LightGray) } }
