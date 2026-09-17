# فصل بيئة Staging عن Production

## الهدف

تُستخدم بيئة **Staging** لاختبار تغييرات فزعة قبل وصولها إلى المستخدمين. يجب أن تكون قاعدة بياناتها ومخزن ملفاتها وأسرارها ونطاقاتها منفصلة تمامًا عن Production.

## المتطلبات

يجب إنشاء قاعدة بيانات مستقلة باسم `fazaa_staging`، ومخزن ملفات مستقل مثل `/fazaa-staging-private`، وسر جلسة مختلف عن Production، ونطاقين منفصلين مثل `staging-app.fazaa.com` و`staging-admin.fazaa.com`.

لا يجوز نسخ أسرار Production إلى Staging، ولا يجوز توجيه Staging إلى قاعدة بيانات Production. كما يجب استخدام حسابات اختبار وبيانات غير حقيقية، خصوصًا في الهويات والوثائق والصور.

## المتغيرات

يُستخدم `.env.staging.example` كقائمة مرجعية فقط. القيم الفعلية تحفظ في Secret Manager الخاص بمزود الاستضافة، ولا ترفع إلى GitHub. يجب ضبط `NODE_ENV=staging` و`CORS_ORIGINS` على نطاقات Staging فقط، مع `TRUST_PROXY=true` عند التشغيل خلف proxy موثوق.

## نشر قاعدة البيانات

بعد تشغيل نسخة Staging من التطبيق، يُشغّل الأمر التالي باستخدام `DATABASE_URL` الخاص بـ Staging فقط:

```bash
pnpm --filter @workspace/scripts migrate
```

يسجل المشغل الملفات المطبقة داخل جدول `schema_migrations` ويمنع إعادة تشغيل migration ناجح.

## بوابة Production

لا تُطبق migrations على Production تلقائيًا من كل Pull Request. يجب إنشاء نسخة احتياطية، ثم مراجعة migration، ثم تشغيله من بيئة نشر محمية، ثم فحص health endpoint وسجلات التطبيق. لا يُسمح بتجاوز فشل migration أو تشغيل `push-force` على Production.

## تسلسل الترقية

يُختبر Pull Request في GitHub Actions، ثم يُنشر إلى Staging، ثم تُجرى اختبارات القبول الأمنية والتشغيلية، وبعدها فقط يُرقّى الإصدار نفسه إلى Production. يجب أن يبقى commit المنشور في البيئتين متطابقًا لتسهيل التراجع.
