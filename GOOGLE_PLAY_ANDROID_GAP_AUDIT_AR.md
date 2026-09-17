# تدقيق فجوة Android وGoogle Play لتطبيق فزعة

**تاريخ التدقيق:** 17 سبتمبر 2026  
**المستودع:** absherbalsafar-debug/NewFazaaapp

## النتيجة الحالية

المستودع لا يحتوي حاليًا على مشروع Android أصلي أو مشروع Expo قابل للبناء. توجد تطبيقات ويب داخل `artifacts/sanad` و`artifacts/sanad-admin`، بينما لا توجد ملفات `app.json` أو `app.config.*` أو `eas.json` أو `AndroidManifest.xml` أو `build.gradle` ضمن بنية التطبيق الحالية.

لذلك لا يمكن اعتبار المشروع حاليًا جاهزًا لإنشاء APK/AAB أو للنشر على Google Play. يجب أولًا اعتماد هوية Android ثابتة، ثم إنشاء تطبيق جوال حقيقي يستهلك API الحالي ويحتوي على تدفقات العميل والمهني المناسبة للشاشات الصغيرة.

## متطلبات Google Play الرسمية ذات الصلة

وفق صفحة Android Developers الرسمية، ابتداءً من **31 أغسطس 2026** يجب أن تستهدف التطبيقات الجديدة وتحديثات التطبيقات Android 16، أي **API level 36** أو أعلى، مع استثناءات محددة لبعض أنواع الأجهزة المتخصصة.

يجب رفع التطبيق بصيغة **Android App Bundle (AAB)**، واستخدام Play App Signing مع مفتاح رفع محفوظ خارج المستودع. لا يجوز رفع keystore أو كلمات المرور أو مفاتيح التوقيع إلى GitHub.

تتطلب Google Play أيضًا إكمال Data Safety، وتوفير إفصاحات دقيقة عن البيانات، وتوفير مسار لحذف الحساب والبيانات عندما يدعم التطبيق إنشاء حسابات. يجب أن يكون مسار الحذف واضحًا داخل التطبيق، وأن يتوفر رابط ويب صالح عند الحاجة في إعدادات Play Console.

## مصادر رسمية

1. [Meet Google Play's target API level requirement](https://developer.android.com/google/play/requirements/target-sdk)
2. [Target API level requirements for Google Play apps](https://support.google.com/googleplay/android-developer/answer/11926878)
3. [Google Play account deletion and data deletion](https://support.google.com/googleplay/android-developer/answer/13327111)
4. [Sign your app](https://developer.android.com/studio/publish/app-signing)
5. [Play App Signing](https://support.google.com/googleplay/android-developer/answer/9842756)

## فجوات يجب إغلاقها قبل إعلان الجاهزية

| المجال | الحالة الحالية | الإجراء المطلوب |
|---|---|---|
| تطبيق Android | غير موجود | إنشاء مشروع Expo/React Native أو Android أصلي |
| Application ID | غير معتمد | اعتماد معرف ثابت قبل البناء |
| Target SDK | غير موجود | ضبط API 36 وفق متطلبات 2026 |
| AAB والتوقيع | غير موجود | إعداد EAS/Gradle وPlay App Signing |
| الأيقونة وSplash | غير موجودان كتكوين Android | تجهيز أصول وهوية نهائية |
| حذف الحساب | يحتاج تنفيذًا | إضافة API وواجهة وسياسة حذف |
| Data Safety | غير معد | جرد البيانات وملء النموذج بعد تثبيت السلوك النهائي |
| اختبار Android | غير موجود | اختبار تسجيل الدخول والتوثيق والبحث والاتصال والملفات |
| Staging Android | غير موجود | ربط نسخة Staging بـ API وCORS منفصلين |

## قرارات مطلوبة قبل إنشاء Android

1. اعتماد Application ID نهائي، والمقترح المبدئي: `com.fazaa.app`، بشرط ألا يكون مستخدمًا في Google Play.
2. اعتماد اسم المتجر النهائي: `فزعة` أو `FAZAAH` أو اسم ثنائي اللغة.
3. اعتماد الشعار والأيقونة ودرجات الألوان وSplash.
4. تحديد الحساب/المؤسسة التي ستملك Google Play Console.
5. تحديد ما إذا كان الإصدار الأول سيضم العميل والمهني في تطبيق واحد، وهو الخيار المتوافق مع الرؤية الحالية.

لا ينبغي إنشاء معرف تجريبي ثم تغييره، لأن Application ID يحدد هوية الحزمة في Android وGoogle Play ويصعب تغييره بعد النشر.
