# مراجعة مشروع فزعة | FAZAAH

**تاريخ المراجعة:** 17 سبتمبر 2026  
**المستودع:** `absherbalsafar-debug/NewFazaaapp`  
**الفرع:** `main`  
**آخر commit تمت مراجعته:** `d546dcc` — `feat: enhance sponsored ads experience and metrics`

## الخلاصة التنفيذية

المشروع يحتوي على نواة جيدة لمنصة خدمات: واجهات للعميل والمهني والإدارة، خادم Express، PostgreSQL عبر Drizzle، عقود OpenAPI، مصادقة وصلاحيات، طلبات خدمات، رسائل، إشعارات، محافظ/اشتراكات وإعلانات تجارية.

لكن المستودع الحالي **ليس تطبيق Android قابلًا للبناء والنشر على Google Play**؛ لا توجد ملفات Android أو Flutter أو Capacitor أو Expo. الموجود حاليًا هو تطبيق ويب مع API. لذلك نحتاج أولًا إلى تثبيت الأساس الأمني والتقني، ثم بناء تطبيق جوال حقيقي يستهلك الـ API.

## نتيجة الفحص

| المجال | النتيجة |
|---|---|
| استنساخ المستودع | نجح |
| بنية المشروع | Workspace يضم واجهات، API، مكتبات مشتركة، وقاعدة بيانات |
| تطبيق Android | غير موجود في النسخة الحالية |
| CI/CD | لا يوجد workflow واضح تحت `.github/workflows` |
| ترحيلات قاعدة البيانات | لا توجد ملفات Drizzle migrations ظاهرة في المستودع |
| تثبيت الاعتماديات | توقف عند `esbuild` بسبب `Ignored build scripts` |
| TypeScript وBuild | لم يُنفذا في آخر محاولة لأن التثبيت توقف أولًا؛ التقرير السابق يذكر نجاح TypeScript وفشل build بسبب إعدادات Vite |

## المخاطر العاجلة P0

### 1. كلمات المرور والمصادقة

في `artifacts/api-server/src/lib/auth.ts` يتم استخدام SHA-256 لكلمات المرور مع secret افتراضي هو `fazaaah-development-secret`. هذا غير مناسب لتخزين كلمات المرور الإنتاجية.

**الإجراء:** استخدام Argon2id أو bcrypt، مع توافق انتقالي لكلمات المرور القديمة وإعادة hash عند أول دخول ناجح. يجب منع تشغيل production عند غياب `SESSION_SECRET` أو ضعفه.

### 2. حماية Express

في `artifacts/api-server/src/app.ts` يوجد `cors()` مفتوح ولا تظهر حماية Helmet أو rate limiting أو حدود لحجم body.

**الإجراء:** تقييد CORS بقائمة origins، إضافة Helmet، تحديد أحجام JSON وurlencoded، وإضافة rate limiting منفصل لتسجيل الدخول وOTP واستعادة كلمة المرور.

### 3. سلامة انتقالات الطلبات

في `artifacts/api-server/src/routes/requests.ts` يمكن قبول status بعد فحص صلاحية عام، لكن لا توجد آلة حالات تمنع الانتقالات غير المنطقية. كما أن تحديث الطلب وزيادة `completedJobs` وإنشاء الإشعار ليست داخل transaction واحدة.

**الإجراء المقترح:**

`pending -> accepted/rejected/cancelled`  
`accepted -> in_progress/cancelled`  
`in_progress -> completed`

يجب ربط كل انتقال بالدور المسموح، وتنفيذ التحديث والعداد والإشعار وسجل التدقيق داخل transaction مع idempotency.

### 4. رفع الملفات

في `artifacts/api-server/src/routes/storage.ts` يتم إصدار upload URL لمستخدم مصادق مع فحص MIME والحجم، لكن لا يظهر upload intent مرتبط بالمستخدم والدفعة قبل الرفع.

**الإجراء:** إنشاء intent في قاعدة البيانات، ربطه بالمالك والعملية، استخدام object key عشوائي، التحقق من المحتوى الفعلي والحجم، منع الوصول العام، وفحص الملفات عند الإمكان.

### 5. قابلية إعادة البناء

توقف `pnpm install --frozen-lockfile` عند build scripts الخاصة بـ `esbuild`. هذا يمنع CI وبيئات المطور من أن تكون قابلة للتكرار.

**الإجراء:** اعتماد سياسة pnpm/build scripts داخل المستودع، توحيد Node وpnpm، ثم تشغيل install وtypecheck وtest وbuild من بيئة نظيفة.

## تحسينات P1 قبل beta عامة

1. إزالة نمط N+1 من قائمة الطلبات باستخدام joins أو استعلامات مجمعة.
2. إضافة pagination لكل القوائم، مع فهارس على `clientId`, `providerId`, `status`, و`createdAt`.
3. إضافة Drizzle migrations محفوظة في Git وآلية backup/restore مجربة.
4. كتابة اختبارات API للمصادقة والصلاحيات والطلبات والرسائل والملفات والمدفوعات وwebhooks.
5. إضافة health/readiness checks، logging منظم، error monitoring، metrics وتنبيهات.
6. إضافة staging منفصل عن production وعدم خلط بيانات seed مع بيانات الإنتاج.

## فجوة Google Play

قبل النشر في Google Play يلزم مشروع Android فعلي، حزمة موقعة، application ID ثابت، target SDK حديث، سياسة خصوصية، Data Safety دقيق، حذف الحساب والبيانات، وصف ولقطات شاشة، واختبارات داخلية ثم مغلقة.

### خيارات بناء تطبيق الجوال

| المسار | التقييم |
|---|---|
| Capacitor | الأسرع لإعادة استخدام الويب، لكنه ليس مجرد WebView ويحتاج مراجعة الإشعارات والموقع وتجربة الهاتف |
| Flutter | أفضل لتجربة أصلية قوية والخرائط والإشعارات، مع وقت تطوير أكبر |
| React Native/Expo | مناسب لفريق React/TypeScript ويتطلب مشروع mobile مستقل |

**توصيتي:** بناء تطبيق جوال مستقل فوق API مستقر، واستخدام Capacitor فقط إذا كان الهدف MVP سريعًا مع قبول قيود التجربة.

## خطة التنفيذ

### المرحلة الأولى: الأساس الأمني والتقني

- إصلاح سياسة pnpm وesbuild.
- Argon2id وإجبار أسرار production.
- CORS مقيد وHelmet وbody limits وrate limiting.
- GitHub Actions للتثبيت والنوع والاختبارات والبناء.
- migrations وفهارس واختبارات API أساسية.

### المرحلة الثانية: سلامة العمليات التجارية

- آلة حالات الطلبات مع transaction وaudit log.
- idempotency للطلبات والمدفوعات وwebhooks.
- upload intents آمنة.
- pagination وإزالة N+1.
- الإلغاء والاسترداد والعمولات وإدارة النزاعات.

### المرحلة الثالثة: تكاملات الإنتاج

- SMS/OTP حقيقي.
- FCM.
- Object Storage دائم.
- بوابة دفع مع webhooks موقعة.
- staging وproduction وmonitoring وbackup/restore.

### المرحلة الرابعة: Android وGoogle Play

- اختيار Flutter أو React Native أو Capacitor.
- بناء تدفقات العميل والمهني الأساسية.
- اختبارات RTL والأجهزة الحقيقية والشبكات الضعيفة والأذونات.
- إعداد Privacy Policy وData Safety وAccount Deletion.
- Internal testing ثم Closed testing ثم Production.

## أول PR أقترحه

**`security/build: harden authentication and make CI reproducible`**

نطاقه:

- معالجة سياسة `esbuild` وpnpm.
- إضافة CI للتثبيت والنوع والاختبارات والبناء.
- منع secret الافتراضي في production.
- استبدال SHA-256 بـ Argon2id مع توافق انتقالي.
- إضافة rate limiting وCORS/Helmet وحدود body.
- إضافة اختبارات المصادقة والصلاحيات.

بعد نجاحه ننتقل إلى آلة حالات الطلبات، ثم نقرر إطار تطبيق Android بالتفصيل.

## القرار الحالي

المشروع **مناسب كنواة MVP قابلة للتطوير**، لكنه **غير جاهز بعد للنشر التجاري أو Google Play**. الأولوية هي إغلاق P0 قبل إضافة مزايا تجارية جديدة. لم أعدّل منطق التطبيق أو أرفع commit إلى GitHub في هذه المراجعة؛ أعددت هذا التقرير كأساس لأول PR مشترك.

## الملفات التي تمت مراجعتها

- `artifacts/api-server/src/lib/auth.ts`
- `artifacts/api-server/src/app.ts`
- `artifacts/api-server/src/routes/requests.ts`
- `artifacts/api-server/src/routes/storage.ts`
- `lib/db/src/schema/`
- `package.json` وملفات workspace
- `PROJECT_REVIEW_AR.md`
- `TECHNICAL_AUDIT_REPORT.md`

**انتهى التقرير.**

> ملاحظة: التقرير السابق الموجود في المستودع مفيد ومتوافق مع معظم هذه النتائج، لكن هذه المراجعة تحققت أيضًا من آخر commit وبنية Android الفعلية وسياسة تثبيت الاعتماديات الحالية.
