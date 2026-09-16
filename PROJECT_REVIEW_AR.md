# مراجعة مشروع فزعة — 17 سبتمبر 2026

## الملخص التنفيذي

المشروع منصة خدمات تضم واجهة عميل، لوحة مهني، لوحة إدارة، خادم Express، PostgreSQL عبر Drizzle، وعقود OpenAPI مع مولدات React Query وZod. البنية مناسبة كنواة MVP، لكن المشروع يحتاج تثبيت الأمن والاختبارات والبناء قبل الإطلاق التجاري الواسع.

## ما تم التحقق منه

| المجال | النتيجة |
|---|---|
| TypeScript | يمر بنجاح عبر جميع الحزم |
| البناء الكامل | يفشل لأن إعداد Vite يطلب `PORT` و`BASE_PATH` أثناء `vite build` |
| الاختبارات | لا تعمل لأن سكربت الاختبار يستدعي `tsx` غير متاح في workspace المستدعي |
| الاختبارات الموجودة | محدودة جدًا ولا تغطي API وقاعدة البيانات وتدفقات الدفع والملفات |
| README | مختصر ولا يشرح التشغيل أو البيئة أو النشر |
| CI/CD | لا يوجد workflow ظاهر في `.github/workflows` |

## الأولويات العاجلة P0

### الأمن والمصادقة

- استبدال SHA-256 لكلمات المرور بـ Argon2id أو bcrypt.
- حذف السر الافتراضي `fazaaah-development-secret` ومنع تشغيل الإنتاج عند غياب `SESSION_SECRET` قوي.
- إضافة rate limiting وlockout تدريجي لتسجيل الدخول وOTP واستعادة كلمة المرور.
- مراجعة تخزين التوكن في `localStorage`؛ الأفضل استخدام جلسات HttpOnly Secure SameSite للويب.
- تقييد CORS بدل `cors()` المفتوح، وإضافة Helmet وحدود لأحجام body.

### رفع الملفات

مسار طلب رابط الرفع يسمح لأي مستخدم مصادق بإنشاء رابط، بينما الربط بالدفع يتم لاحقًا. يجب إنشاء upload intent مرتبط بالمستخدم والدفعة، والتحقق من MIME والحجم عند الخادم، واستخدام أسماء عشوائية، ومنع الوصول العام، وفحص الملفات إن أمكن.

### البناء والاختبارات

- جعل `PORT` و`BASE_PATH` مطلوبين للتشغيل والمعاينة فقط، لا لتحميل إعداد Vite أثناء البناء، أو توفير قيم بناء صريحة.
- إضافة `tsx` كاعتمادية تطوير مشتركة أو توحيد الاختبارات على Vitest.
- إضافة GitHub Actions يشغل install وtypecheck وtest وbuild.
- كتابة اختبارات API للمصادقة والصلاحيات والطلبات والرسائل ورفع الملفات ومراجعة الدفع.

## الأولويات القصيرة P1

### سلامة الطلبات والبيانات

حاليًا منطق تغيير حالة الطلب يحتاج آلة حالات صريحة مثل:

`pending -> accepted/rejected -> in_progress -> completed`

يجب منع الانتقالات غير المنطقية، وربط كل انتقال بالفاعل المسموح، وإضافة audit log. تحديث الطلب وزيادة `completedJobs` وإرسال الإشعار يجب أن يحدث داخل transaction واحدة.

تخصيص أول 300 مقعد مجاني يعتمد على العد قبل الإنشاء؛ يجب حمايته من السباق المتزامن بقفل أو قيد ومعاملة.

### الأداء

قائمة الطلبات تنفذ استعلامات متعددة لكل طلب، وهو نمط N+1. يجب استخدام joins أو استعلامات مجمعة مع pagination وفهارس على `clientId`, `providerId`, `status`, و`createdAt`. وينطبق ذلك على المهنيين والرسائل والإشعارات وسجلات الإدارة.

### قاعدة البيانات والتشغيل

يجب اعتماد Drizzle migrations محفوظة في Git، مع أوامر ترحيل موثقة وفهارس واضحة. كما يلزم إضافة health/readiness checks، logging منظم، مراقبة أخطاء، نسخ احتياطية مجربة، وبيئات منفصلة لـ staging وproduction.

### تنظيم الواجهة

يوجد تكرار كبير بين `sanad` و`sanad-admin` في مكونات UI، وبعض الصفحات والملفات كبيرة جدًا. يستحسن نقل المكونات المشتركة إلى حزمة UI وتقسيم الصفحات إلى مكونات وhooks أصغر، مع توحيد الترجمة العربية والإنجليزية.

## تطويرات المنتج بعد تثبيت الأساس

1. تتبع حي لحالة الطلب وETA وسجل زمني وإلغاء مع سبب وإعادة الطلب.
2. توثيق المهنيين وشارات الثقة والتقييم بعد إكمال الطلب وبلاغات النزاع.
3. إشعارات FCM ورسائل فورية عبر WebSocket أو خدمة Realtime وحالة القراءة.
4. بوابة دفع أو تكامل محافظ حقيقي مع webhooks موقعة وidempotency واسترداد وعمولات.
5. بحث وفلاتر حسب الموقع والتخصص والتقييم والتوفر، مع المفضلة والعروض والكوبونات.
6. صلاحيات إدارية متعددة، audit log، إدارة النزاعات، وتقارير مالية.
7. تطبيقات هاتف أصلية بعد استقرار الويب وواجهة API.

## خطة التنفيذ المقترحة

| المرحلة | النطاق |
|---|---|
| المرحلة 1 | Argon2id، CORS/Helmet/rate limiting، إصلاح build/test، CI، migrations، واختبارات API |
| المرحلة 2 | آلة حالات الطلبات، transactions، pagination والفهارس، رفع ملفات آمن، وتحسين لوحة الإدارة |
| المرحلة 3 | SMS وFCM وObject Storage دائم وبوابة الدفع وبيئة staging/production ومراقبة ونسخ احتياطي |
| المرحلة 4 | التتبع الحي، البحث الجغرافي، التحليلات، النزاعات، وتطبيقات الهاتف |

## أول 10 تذاكر مقترحة

1. `security: replace password hashing with argon2id`
2. `security: require production secrets and restrict cors`
3. `build: make vite build independent from runtime PORT`
4. `test: add shared test runner and API integration tests`
5. `ci: add GitHub Actions typecheck test build`
6. `db: add committed Drizzle migrations and indexes`
7. `api: enforce request status transition state machine`
8. `storage: bind upload intents to authenticated payment owner`
9. `perf: remove N+1 queries and add pagination`
10. `ops: add staging env, health checks, backups, and monitoring`

## القرار المقترح

لا أنصح بإضافة شاشات كثيرة الآن. أفضل PR تالٍ هو حزمة: **أمان المصادقة + إصلاح البناء والاختبارات + CI + ترحيلات قاعدة البيانات**، ثم الانتقال إلى المدفوعات والإشعارات الفعلية.

## الملفات التي تمت مراجعتها

- `artifacts/api-server/src/lib/auth.ts`
- `artifacts/api-server/src/app.ts`
- `artifacts/api-server/src/routes/requests.ts`
- `artifacts/api-server/src/routes/storage.ts`
- `artifacts/api-server/src/routes/subscriptions.ts`
- `artifacts/mockup-sandbox/vite.config.ts`
- `lib/db/src/schema/payments.ts`
- `TECHNICAL_AUDIT_REPORT.md`

## ملاحظات التحقق

- `pnpm run typecheck`: **نجح**.
- `pnpm run build`: **فشل** بسبب طلب `PORT` أثناء بناء Vite.
- اختبار الخادم: **فشل** لأن `tsx` غير متاح في workspace المستدعي.
- لم يتم تعديل منطق التطبيق أو رفع تغييرات إلى GitHub؛ تم إنشاء هذا التقرير المحلي فقط.

المستودع: `absherbalsafar-debug/NewFazaaapp` — الفرع: `main` — آخر commit تمت مراجعته: `31f9325`.

> **الخلاصة:** المشروع أساس جيد لـ MVP، لكن الأولوية الآن جعل الأساس آمنًا، قابلًا للاختبار، وقابلًا للنشر بثبات قبل التوسع في المزايا.
