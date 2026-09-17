# جرد تطبيق فزعة الحالي قبل التحويل Native

> هذا الجرد قراءة فقط ولم يغيّر أي ملف من ملفات المشروع.

## الصفحات (36)

### `pages/admin/business.tsx`
- عناوين: أرقام وحسابات المحافظ | اعتماد إعلان برقم | الاشتراكات والإعلانات | طلبات تحويل الاشتراك

### `pages/admin/complaints.tsx`
- عناوين: الشكاوى والنزاعات

### `pages/admin/dashboard.tsx`
- عناوين: لوحة التحكم

### `pages/admin/providers.tsx`
- عناوين: إدارة المهنيين

### `pages/admin/taxonomy.tsx`
- عناوين: إدارة التخصصات والمهن

### `pages/admin/users.tsx`
- عناوين: إدارة المستخدمين

### `pages/auth-email.tsx`

### `pages/auth-phone.tsx`

### `pages/call.tsx`
- عناوين: اتصال آمن

### `pages/chat.tsx`

### `pages/discover.tsx`
- عناوين: اكتشف

### `pages/earnings.tsx`
- عناوين: أرباحي | الأرباح قيد التفعيل

### `pages/emergency.tsx`
- عناوين: تم إرسال طلبك! | خدمة الطوارئ

### `pages/favorites.tsx`
- عناوين: المفضلة | لا يوجد مهنيين مفضلين

### `pages/forgot-password.tsx`
- عناوين: استعادة كلمة المرور | تم الإرسال! | نسيت كلمة المرور؟

### `pages/home.tsx`
- عناوين: اختر نوع الخدمة | خدماتك الأخيرة | محتاج مساعدة أكثر؟ | مهنيون مميزون

### `pages/login.tsx`
- عناوين: تسجيل الدخول

### `pages/messages.tsx`
- عناوين: الرسائل | لا توجد رسائل

### `pages/my-requests.tsx`
- عناوين: طلباتي | لا يوجد طلبات

### `pages/new-request.tsx`
- عناوين: تم إرسال الطلب بنجاح! | طلب خدمة جديدة

### `pages/not-found.tsx`
- عناوين: 404 Page Not Found

### `pages/notifications.tsx`
- عناوين: الإشعارات | لا يوجد إشعارات

### `pages/privacy.tsx`
- عناوين: خصوصيتك أولوية | سياسة الخصوصية

### `pages/profile.tsx`
- عناوين: حسابي

### `pages/provider-business.tsx`
- عناوين: إنشاء إعلان مدفوع | اختر محفظة الدفع | الاشتراك والإعلانات | خطط اشتراك المهني | طلبات الدفع السابقة

### `pages/provider-dashboard.tsx`
- عناوين: آخر الطلبات | أكمل ملفك المهني

### `pages/provider-detail.tsx`
- عناوين: التقييمات والآراء | الملف الشخصي | معرض الأعمال | نبذة عن المهني

### `pages/provider-verify.tsx`
- عناوين: توثيق الملف المهني | طلبك قيد المراجعة

### `pages/providers.tsx`
- عناوين: استعرض المهنيين | لا توجد نتائج

### `pages/register.tsx`
- عناوين: التوثيق والتحقق | القسم والتخصص والخدمات | المعلومات الأساسية | تسجيل مهني في فزعة | تم حفظ طلبك بنجاح | معرض الأعمال

### `pages/request-detail.tsx`
- عناوين: تفاصيل الطلب

### `pages/settings.tsx`
- عناوين: الإعدادات

### `pages/sponsored-preview.tsx`
- عناوين: الإعلانات الممولة | معاينة الظهور المدفوع

### `pages/terms.tsx`
- عناوين: شروط الاستخدام | شروط واضحة للجميع

### `pages/wallet.tsx`
- عناوين: لا توجد وسائل دفع محفوظة | وسائل الدفع

### `pages/welcome.tsx`

## مسارات Wouter المسجلة

- `/welcome`
- `/auth/phone`
- `/auth/email`
- `/auth/forgot-password`
- `/login`
- `/register`
- `/admin`
- `/admin/users`
- `/admin/providers`
- `/admin/business`
- `/admin/complaints`
- `/admin/taxonomy`
- `/`
- `/provider-dashboard`
- `/provider-business`
- `/discover`
- `/providers`
- `/providers/:id`
- `/sponsored-preview`
- `/emergency`
- `/request/new`
- `/my-requests`
- `/my-requests/:id`
- `/favorites`
- `/notifications`
- `/profile`
- `/settings`
- `/earnings`
- `/wallet`
- `/privacy`
- `/terms`
- `/verify`

## استدعاءات API في الواجهة

- `components/call-manager.tsx` → `/calls/incoming`
- `lib/auth.tsx` → `/auth/me`
- `pages/admin/taxonomy.tsx` → `/taxonomy`
- `pages/auth-email.tsx` → `/auth/login/email`
- `pages/auth-email.tsx` → `/auth/register/email`
- `pages/auth-email.tsx` → `/categories`
- `pages/auth-phone.tsx` → `/auth/send-otp`
- `pages/auth-phone.tsx` → `/auth/verify-otp`
- `pages/auth-phone.tsx` → `/categories`
- `pages/call.tsx` → `/call/:id`
- `pages/chat.tsx` → `/calls`
- `pages/chat.tsx` → `/messages/:id`
- `pages/emergency.tsx` → `/requests`
- `pages/forgot-password.tsx` → `/auth/forgot-password`
- `pages/provider-dashboard.tsx` → `/providers/me`
- `pages/provider-detail.tsx` → `/providers/:id`
- `pages/provider-verify.tsx` → `/providers/me/verification-documents`
- `pages/provider-verify.tsx` → `/storage/uploads/request-url`
- `pages/register.tsx` → `/providers/me/taxonomy`
- `pages/register.tsx` → `/taxonomy`
- `pages/request-detail.tsx` → `/my-requests/:id`
- `pages/welcome.tsx` → `/auth/google`

## الحقول التفاعلية

### `components/call-manager.tsx`
- `"button" onClick={reject} className="h-12 rounded-2xl border border-border text-muted-foreground flex items-center justify-center gap-2"`
- `"button" onClick={accept} className="h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center gap-2 font-bold"`

### `components/ui/sidebar.tsx`
- `{toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:`

### `pages/admin/business.tsx`
- `{note} onChange={(event) =`
- `{draft.merchantName} onChange={(event) =`
- `{draft.merchantAccount} onChange={(event) =`
- `{draft.instructions} onChange={(event) =`

### `pages/admin/taxonomy.tsx`
- `{category} onChange={(e) =`
- `{specialization[item.id] ?? ""} onChange={(e) =`
- `{service[spec.id] ?? ""} onChange={(e) =`

### `pages/admin/users.tsx`
- `"بحث بالاسم أو رقم الهاتف..." 
            className="pl-3 pr-9" 
            value={search}
            onChange={(e) =`
- `{role} onValueChange={setRole}`
- `"تصفية حسب نوع الحساب" /`
- `"all"`
- `"client"`
- `"provider"`

### `pages/auth-email.tsx`
- `{() =`
- `{() =`
- `{() =`
- `"الاسم الكامل"
                value={name}
                onChange={e =`
- `{categoryId}
                      onChange={(event) =`
- `{bio}
                      onChange={(event) =`
- `"number"
                    min={0}
                    max={60}
                    inputMode="numeric"
                    placeholder="سنوات الخبرة (اختياري)"
                    value={yearsExperience}
                    onChange={(ev`
- `"email"
              autoComplete="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={e =`
- `{showPwd ? "text" : "password"}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              placeholder="كلمة المرور"
              value={password}
              onChange={e =`
- `"button"
              onClick={() =`
- `{() =`

### `pages/auth-phone.tsx`
- `"button"
            onClick={() =`
- `"tel"
                  placeholder="7XXXXXXXX"
                  value={phone}
                  onChange={e =`
- `"text"
                    inputMode="numeric"
                    placeholder="000000"
                    maxLength={6}
                    value={otp}
                    onChange={e =`
- `"button" onClick={sendOtp} className="w-full text-center text-sm font-bold text-[#a17b29]"`
- `"الاسم الكامل"
                  value={name}
                  onChange={e =`
- `{categoryId}
                        onChange={(event) =`
- `{bio}
                        onChange={(event) =`
- `"number"
                      min={0}
                      max={60}
                      inputMode="numeric"
                      placeholder="سنوات الخبرة (اختياري)"
                      value={yearsExperience}
                      o`

### `pages/call.tsx`
- `"button"
          onClick={endCall}
          className="mx-auto w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors"
          aria-label="إنهاء المكالمة"`

### `pages/chat.tsx`
- `"button"
          onClick={handleCall}
          aria-label="اتصال"
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center shrink-0"`
- `{content}
            onChange={e =`

### `pages/earnings.tsx`
- `{() =`

### `pages/emergency.tsx`
- `{() =`

### `pages/forgot-password.tsx`
- `{() =`
- `"email"
              placeholder="بريدك الإلكتروني"
              value={email}
              onChange={e =`

### `pages/home.tsx`
- `"button"
            className="flex items-center gap-1.5 rounded-full bg-[#f3f6fa] px-3 py-2 text-[11px] font-bold text-[#0e2f62]"
            aria-label="اختيار المدينة"`
- `"button"
            onClick={handleSearch}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5b916] text-[#0e2f62] transition-transform active:scale-95"
            aria-label="بحث"`
- `"text"
            placeholder="ما الذي تحتاجه؟ ابحث عن الخدمة أو المهني..."
            className="h-11 border-0 bg-transparent px-3 text-right text-xs font-medium shadow-none focus-visible:ring-0"
            value={searchQuery}`
- `"button" onClick={() =`
- `"button"
              onClick={() =`

### `pages/login.tsx`
- `"7xxxxxxxx" type="tel" dir="ltr" className="text-left" {...field} /`
- `"••••••••" type="password" dir="ltr" className="text-left" {...field} /`

### `pages/messages.tsx`
- `{search}
              onChange={e =`

### `pages/new-request.tsx`
- `"مثال: إصلاح تسريب مياه، تأسيس كهرباء..." {...field} /`
- `"اشرح المشكلة بالتفصيل لمساعدة المهني على فهم المطلوب..." 
                        className="min-h-[120px] resize-none" 
                        {...field} 
                      /`
- `"مثال: حدة، شعوب..." {...field} /`
- `"datetime-local" {...field} value={field.value || ''} /`

### `pages/privacy.tsx`
- `"button" onClick={() =`

### `pages/profile.tsx`
- `{() =`
- `{() =`
- `{phone}
                      onChange={event =`
- `{whatsapp}
                      onChange={event =`
- `{() =`
- `{() =`
- `{() =`
- `{() =`

### `pages/provider-business.tsx`
- `"button" onClick={() =`
- `"button" onClick={() =`
- `{adForm.title} onChange={(event) =`
- `{adForm.description} onChange={(event) =`
- `{adForm.city} onChange={(event) =`
- `{adForm.district} onChange={(event) =`
- `"button"
                    onClick={() =`
- `"number" min="1" step="1" value={adForm.budget} onChange={(event) =`

### `pages/provider-verify.tsx`
- `{() =`

### `pages/providers.tsx`
- `"search"
                placeholder="ابحث عن مهني أو خدمة..."
                className="h-11 pr-10 pl-4 rounded-xl bg-background border-0 text-sm"
                value={search}
                onChange={e =`
- `{() =`
- `{() =`
- `{() =`
- `{() =`
- `{() =`
- `{() =`

### `pages/register.tsx`
- `"button" onClick={() =`
- `"button" onClick={() =`
- `"الاسم الكامل" {...form.register("name")} /`
- `"رقم الهاتف" dir="ltr" className="text-left" {...form.register("phone")} /`
- `"password" placeholder="كلمة المرور" dir="ltr" className="text-left" {...form.register("password")} /`
- `{String(form.watch("categoryId") ?? "")} onValueChange={(value) =`
- `"1. اختر القسم الرئيسي" /`
- `{String(category.id)}`
- `"button" key={specialization.id} onClick={() =`
- `"button" key={service.id} onClick={() =`
- `"المحافظة / المدينة" {...form.register("city")} /`
- `"المديرية" {...form.register("district")} /`
- `"number" placeholder="سنوات الخبرة" {...form.register("yearsExperience")} /`
- `"نبذة مهنية مختصرة عن خبرتك وخدماتك" className="min-h-28" {...form.register("bio")} /`

### `pages/settings.tsx`
- `"button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-primary/[0.04] ${danger ? 'text-destructive' : ''}`}`
- `"button" onClick={() =`
- `"button"
                  onClick={() =`

### `pages/terms.tsx`
- `"button" onClick={() =`

### `pages/wallet.tsx`
- `{() =`

### `pages/welcome.tsx`
- `{() =`
- `"button"
                  onClick={() =`
- `"button" onClick={() =`
- `"button"
                  onClick={() =`
- `"button"
                    onClick={() =`

## ملفات المكونات والتخطيط

- `components/brand-logo.tsx`
- `components/call-manager.tsx`
- `components/city-selector.tsx`
- `components/layout/bottom-nav.tsx`
- `components/layout/header.tsx`
- `components/layout/page-transition.tsx`
- `components/layout/protected-route.tsx`
- `components/provider-card.tsx`
- `components/theme-provider.tsx`
- `components/theme-toggle.tsx`
- `components/ui/accordion.tsx`
- `components/ui/alert-dialog.tsx`
- `components/ui/alert.tsx`
- `components/ui/aspect-ratio.tsx`
- `components/ui/avatar.tsx`
- `components/ui/badge.tsx`
- `components/ui/breadcrumb.tsx`
- `components/ui/button-group.tsx`
- `components/ui/button.tsx`
- `components/ui/calendar.tsx`
- `components/ui/card.tsx`
- `components/ui/carousel.tsx`
- `components/ui/chart.tsx`
- `components/ui/checkbox.tsx`
- `components/ui/collapsible.tsx`
- `components/ui/command.tsx`
- `components/ui/context-menu.tsx`
- `components/ui/dialog.tsx`
- `components/ui/drawer.tsx`
- `components/ui/dropdown-menu.tsx`
- `components/ui/empty.tsx`
- `components/ui/field.tsx`
- `components/ui/form.tsx`
- `components/ui/hover-card.tsx`
- `components/ui/input-group.tsx`
- `components/ui/input-otp.tsx`
- `components/ui/input.tsx`
- `components/ui/item.tsx`
- `components/ui/kbd.tsx`
- `components/ui/label.tsx`
- `components/ui/menubar.tsx`
- `components/ui/navigation-menu.tsx`
- `components/ui/pagination.tsx`
- `components/ui/popover.tsx`
- `components/ui/progress.tsx`
- `components/ui/radio-group.tsx`
- `components/ui/resizable.tsx`
- `components/ui/scroll-area.tsx`
- `components/ui/select.tsx`
- `components/ui/separator.tsx`
- `components/ui/sheet.tsx`
- `components/ui/sidebar.tsx`
- `components/ui/skeleton.tsx`
- `components/ui/slider.tsx`
- `components/ui/sonner.tsx`
- `components/ui/spinner.tsx`
- `components/ui/switch.tsx`
- `components/ui/table.tsx`
- `components/ui/tabs.tsx`
- `components/ui/textarea.tsx`
- `components/ui/toast.tsx`
- `components/ui/toaster.tsx`
- `components/ui/toggle-group.tsx`
- `components/ui/toggle.tsx`
- `components/ui/tooltip.tsx`

## ملفات الاختبارات والإعدادات

- `android/app/build/intermediates/annotation_processor_list/debug/javaPreCompileDebug/annotationProcessors.json`
- `android/app/build/intermediates/assets/debug/mergeDebugAssets/capacitor.config.json`
- `android/app/build/intermediates/assets/debug/mergeDebugAssets/capacitor.plugins.json`
- `android/app/build/intermediates/compatible_screen_manifest/debug/createDebugCompatibleScreenManifests/output-metadata.json`
- `android/app/build/intermediates/linked_resources_binary_format/debug/processDebugResources/output-metadata.json`
- `android/app/build/intermediates/merged_manifests/debug/processDebugManifest/output-metadata.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/mergeDebugResources.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-af.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-am.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ar.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-as.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-az.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-b+sr+Latn.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-be.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-bg.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-bn.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-bs.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ca.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-cs.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-da.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-de.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-el.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-en-rAU.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-en-rCA.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-en-rGB.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-en-rIN.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-en-rXC.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-es-rUS.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-es.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-et.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-eu.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-fa.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-fi.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-fr-rCA.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-fr.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-gl.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-gu.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-h720dp-v13.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-hdpi-v4.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-hi.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-hr.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-hu.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-hy.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-in.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-is.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-it.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-iw.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ja.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ka.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-kk.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-km.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-kn.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ko.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ky.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-land.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-large-v4.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ldltr-v21.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-lo.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-lt.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-lv.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-mk.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ml.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-mn.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-mr.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ms.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-my.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-nb.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ne.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-night-v33.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-night-v8.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-nl.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-or.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-pa.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-pl.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-port.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-pt-rBR.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-pt-rPT.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-pt.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ro.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ru.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-si.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-sk.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-sl.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-sq.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-sr.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-sv.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-sw.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-sw600dp-v13.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ta.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-te.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-th.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-tl.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-tr.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-uk.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-ur.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-uz.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v16.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v17.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v18.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v21.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v22.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v23.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v24.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v25.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v26.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v27.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v28.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v29.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v30.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v31.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-v33.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-vi.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-watch-v20.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-watch-v21.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-xlarge-v4.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-zh-rCN.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-zh-rHK.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-zh-rTW.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values-zu.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/multi-v2/values.json`
- `android/app/build/intermediates/merged_res_blame_folder/debug/mergeDebugResources/out/single/mergeDebugResources.json`
- `android/app/build/intermediates/navigation_json/debug/extractDeepLinksDebug/navigation.json`
- `android/app/build/intermediates/packaged_manifests/debug/processDebugManifestForPackage/output-metadata.json`
- `android/app/build/intermediates/signing_config_versions/debug/writeDebugSigningConfigVersions/signing-config-versions.json`
- `android/app/build/outputs/apk/debug/output-metadata.json`
- `android/app/build.gradle`
- `android/app/capacitor.build.gradle`
- `android/app/src/main/assets/capacitor.config.json`
- `android/app/src/main/assets/capacitor.plugins.json`
- `android/build.gradle`
- `android/capacitor-cordova-android-plugins/build/intermediates/aapt_friendly_merged_manifests/debug/processDebugManifest/aapt/output-metadata.json`
- `android/capacitor-cordova-android-plugins/build/intermediates/annotation_processor_list/debug/javaPreCompileDebug/annotationProcessors.json`
- `android/capacitor-cordova-android-plugins/build/intermediates/navigation_json/debug/extractDeepLinksDebug/navigation.json`
- `android/capacitor-cordova-android-plugins/build.gradle`
- `android/capacitor-cordova-android-plugins/cordova.variables.gradle`
- `android/capacitor.settings.gradle`
- `android/settings.gradle`
- `android/variables.gradle`
- `capacitor.config.ts`
- `components.json`
- `node_modules/.vite/deps/_metadata.json`
- `node_modules/.vite/deps/package.json`
- `package.json`
- `src/hooks/use-toast.ts`
- `src/lib/contact.ts`
- `src/lib/registration.test.ts`
- `src/lib/registration.ts`
- `src/lib/utils.ts`
- `tsconfig.json`
- `vite.config.ts`
