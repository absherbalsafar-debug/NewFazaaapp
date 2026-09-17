package com.fazaa.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

internal data class NativePageDefinition(val route: String, val title: String, val description: String, val icon: ImageVector)

internal val nativePageDefinitions = listOf(
    NativePageDefinition("/welcome", "الترحيب", "أهلاً وسهلاً بك في فزعة", Icons.Default.Home),
    NativePageDefinition("/auth/phone", "تسجيل الهاتف", "التسجيل والتحقق برقم الجوال", Icons.Default.Call),
    NativePageDefinition("/auth/email", "تسجيل البريد", "تسجيل الدخول أو إنشاء حساب بالبريد", Icons.Default.Person),
    NativePageDefinition("/auth/forgot-password", "استعادة كلمة المرور", "إعادة تعيين كلمة المرور", Icons.Default.Lock),
    NativePageDefinition("/", "الرئيسية", "خدماتك والمهنيون المميزون", Icons.Default.Home),
    NativePageDefinition("/discover", "اكتشف", "اكتشف الخدمات والمهنيين", Icons.Default.Search),
    NativePageDefinition("/providers", "المهنيون", "استعرض المهنيين وابحث عن الخدمة", Icons.Default.Person),
    NativePageDefinition("/providers/:id", "ملف المهني", "النبذة والتقييمات ومعرض الأعمال", Icons.Default.VerifiedUser),
    NativePageDefinition("/request/new", "طلب خدمة", "إنشاء طلب خدمة جديد", Icons.Default.Description),
    NativePageDefinition("/my-requests", "طلباتي", "متابعة طلبات الخدمات", Icons.Default.List),
    NativePageDefinition("/my-requests/:id", "تفاصيل الطلب", "تفاصيل ومراحل الطلب", Icons.Default.Description),
    NativePageDefinition("/favorites", "المفضلة", "المهنيون المحفوظون", Icons.Default.Favorite),
    NativePageDefinition("/notifications", "الإشعارات", "تنبيهات فزعة", Icons.Default.Notifications),
    NativePageDefinition("/profile", "حسابي", "بيانات الحساب والملف الشخصي", Icons.Default.Person),
    NativePageDefinition("/settings", "الإعدادات", "إعدادات التطبيق والحساب", Icons.Default.Settings),
    NativePageDefinition("/emergency", "الطوارئ", "إرسال طلب طوارئ", Icons.Default.Call),
    NativePageDefinition("/provider-dashboard", "لوحة المهني", "آخر الطلبات واستكمال الملف", Icons.Default.Home),
    NativePageDefinition("/provider-business", "الاشتراكات والإعلانات", "خطط الاشتراك والإعلانات", Icons.Default.ShoppingBag),
    NativePageDefinition("/provider-verify", "توثيق المهني", "رفع مستندات التوثيق", Icons.Default.VerifiedUser),
    NativePageDefinition("/earnings", "أرباحي", "متابعة الأرباح", Icons.Default.CreditCard),
    NativePageDefinition("/wallet", "المحفظة", "وسائل الدفع والتحويلات", Icons.Default.CreditCard),
    NativePageDefinition("/sponsored-preview", "الإعلانات الممولة", "معاينة ظهور الإعلان", Icons.Default.ShoppingBag),
    NativePageDefinition("/privacy", "الخصوصية", "سياسة الخصوصية", Icons.Default.Lock),
    NativePageDefinition("/terms", "الشروط", "شروط الاستخدام", Icons.Default.Gavel),
    NativePageDefinition("/admin", "لوحة الإدارة", "إدارة منصة فزعة", Icons.Default.Settings),
    NativePageDefinition("/admin/users", "إدارة المستخدمين", "المستخدمون والعملاء", Icons.Default.Person),
    NativePageDefinition("/admin/providers", "إدارة المهنيين", "المهنيون وحالاتهم", Icons.Default.VerifiedUser),
    NativePageDefinition("/admin/business", "إدارة الأعمال", "الاشتراكات والإعلانات والمحافظ", Icons.Default.CreditCard),
    NativePageDefinition("/admin/complaints", "الشكاوى والنزاعات", "متابعة الشكاوى", Icons.Default.Gavel),
    NativePageDefinition("/admin/taxonomy", "التخصصات والخدمات", "إدارة التصنيفات والخدمات", Icons.Default.List),
    NativePageDefinition("/verify", "التحقق", "حالة التحقق من الملف", Icons.Default.CheckCircle),
)

@Composable
internal fun NativePagesIndex(onOpen: (String) -> Unit) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item { Text("صفحات فزعة", color = FazaaNavy, fontSize = 27.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(bottom = 8.dp)) }
        items(nativePageDefinitions) { page ->
            Card(onClick = { onOpen(page.route) }, modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = androidx.compose.ui.graphics.Color.White)) {
                Row(modifier = Modifier.padding(15.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(page.icon, null, tint = FazaaNavy)
                    Column(modifier = Modifier.weight(1f).padding(horizontal = 14.dp)) { Text(page.title, color = FazaaNavy, fontWeight = FontWeight.Bold); Text(page.description, color = androidx.compose.ui.graphics.Color.Gray, fontSize = 12.sp) }
                    Icon(Icons.Default.ArrowForward, null, tint = FazaaGold)
                }
            }
        }
    }
}

@Composable
internal fun NativePageScreen(route: String, onBack: () -> Unit) {
    val page = nativePageDefinitions.firstOrNull { it.route == route }
    Column(modifier = Modifier.fillMaxSize().padding(20.dp)) {
        IconButton(onClick = onBack) { Icon(Icons.Default.ArrowForward, "رجوع", tint = FazaaNavy) }
        Text(page?.title ?: "فزعة", color = FazaaNavy, fontSize = 30.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(top = 18.dp))
        Text(page?.description ?: "صفحة فزعة Native", color = androidx.compose.ui.graphics.Color.Gray, modifier = Modifier.padding(top = 10.dp))
        Card(modifier = Modifier.fillMaxWidth().padding(top = 24.dp), colors = CardDefaults.cardColors(containerColor = FazaaNavy)) {
            Column(modifier = Modifier.padding(20.dp)) { Text("هذه الصفحة تعمل داخل تطبيق Android Native", color = androidx.compose.ui.graphics.Color.White, fontWeight = FontWeight.Bold); Text("تم نقل المسار إلى Compose مع الحفاظ على هوية فزعة والتنقل Native.", color = androidx.compose.ui.graphics.Color.White.copy(alpha = .75f), modifier = Modifier.padding(top = 8.dp)) }
        }
    }
}
