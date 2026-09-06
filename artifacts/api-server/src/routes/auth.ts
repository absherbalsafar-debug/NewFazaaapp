import { Router, type IRouter } from "express";
import { eq, and, or } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { db, usersTable, providersTable, categoriesTable, otpsTable, emailTokensTable } from "@workspace/db";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

function userResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email ?? null,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl ?? null,
    phoneVerified: user.phoneVerified,
    emailVerified: user.emailVerified,
    city: user.city ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

// ─── OTP: إرسال رمز التحقق ───────────────────────────────────────────────────
router.post("/auth/send-otp", async (req, res): Promise<void> => {
  const { phone } = req.body;
  if (!phone || typeof phone !== "string" || phone.trim().length < 7) {
    res.status(400).json({ error: "رقم الهاتف غير صحيح" });
    return;
  }
  const normalizedPhone = phone.trim().replace(/\s+/g, "");

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await db.insert(otpsTable).values({ phone: normalizedPhone, code, expiresAt });

  req.log.info({ phone: normalizedPhone }, "OTP generated");

  res.json({
    message: "تم إرسال رمز التحقق",
    otp: process.env.NODE_ENV !== "production" ? code : undefined,
  });
});

// ─── OTP: التحقق وتسجيل الدخول/إنشاء حساب ───────────────────────────────────
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const { phone, code, name, role, city } = req.body;
  if (!phone || !code) {
    res.status(400).json({ error: "الهاتف والرمز مطلوبان" });
    return;
  }
  const normalizedPhone = phone.trim().replace(/\s+/g, "");

  const [otp] = await db
    .select()
    .from(otpsTable)
    .where(
      and(
        eq(otpsTable.phone, normalizedPhone),
        eq(otpsTable.code, String(code)),
        eq(otpsTable.used, false),
      )
    )
    .orderBy(otpsTable.createdAt)
    .limit(1);

  if (!otp || otp.expiresAt < new Date()) {
    res.status(400).json({ error: "رمز التحقق غير صحيح أو منتهي الصلاحية" });
    return;
  }

  let [user] = await db.select().from(usersTable).where(eq(usersTable.phone, normalizedPhone));

  if (!user) {
    if (!name) {
      // Keep the OTP usable for the registration completion step.
      res.status(200).json({ needsRegistration: true, phone: normalizedPhone });
      return;
    }
    [user] = await db
      .insert(usersTable)
      .values({
        name: name.trim(),
        phone: normalizedPhone,
        phoneVerified: true,
        role: (role === "provider" ? "provider" : "client") as "client" | "provider",
        city: city ?? null,
        status: "active",
      })
      .returning();

    if (user.role === "provider") {
      const [defaultCategory] = await db.select().from(categoriesTable).limit(1);
      if (defaultCategory) {
        await db.insert(providersTable).values({
          userId: user.id,
          categoryId: defaultCategory.id,
          city: city ?? "صنعاء",
          district: "",
          bio: "",
          yearsExperience: 1,
        });
      }
    }
    await db.update(otpsTable).set({ used: true }).where(eq(otpsTable.id, otp.id));
  } else {
    await db.update(otpsTable).set({ used: true }).where(eq(otpsTable.id, otp.id));
    await db.update(usersTable).set({ phoneVerified: true }).where(eq(usersTable.id, user.id));
    [user] = await db.select().from(usersTable).where(eq(usersTable.id, user.id));
  }

  if (user.status === "banned") {
    res.status(403).json({ error: "تم إيقاف هذا الحساب" });
    return;
  }

  const token = generateToken(user.id);
  res.json({ token, user: userResponse(user) });
});

// ─── تسجيل ببريد إلكتروني وكلمة مرور ────────────────────────────────────────
router.post("/auth/register/email", async (req, res): Promise<void> => {
  const { name, email, password, phone, role, city, categoryId, district, bio, yearsExperience, hourlyRate, lat, lng } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: "الاسم والبريد وكلمة المرور مطلوبة" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPhone = phone ? phone.trim().replace(/\s+/g, "") : `email_${Date.now()}`;

  const existing = await db
    .select()
    .from(usersTable)
    .where(or(eq(usersTable.email, normalizedEmail), eq(usersTable.phone, normalizedPhone)));

  if (existing.length > 0) {
    const conflict = existing[0].email === normalizedEmail ? "البريد الإلكتروني" : "رقم الهاتف";
    res.status(400).json({ error: `${conflict} مسجل بالفعل` });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      name: name.trim(),
      phone: normalizedPhone,
      email: normalizedEmail,
      passwordHash: hashPassword(password),
      phoneVerified: !!phone,
      emailVerified: false,
      role: (role === "provider" ? "provider" : "client") as "client" | "provider",
      city: city ?? null,
      status: "active",
    })
    .returning();

  if (role === "provider") {
    const [defaultCategory] = await db.select().from(categoriesTable).limit(1);
    await db.insert(providersTable).values({
      userId: user.id,
      categoryId: categoryId ? Number(categoryId) : defaultCategory?.id ?? 1,
      city: city ?? "صنعاء",
      district: district ?? "",
      bio: bio ?? "",
      yearsExperience: yearsExperience ? Number(yearsExperience) : 1,
      hourlyRate: hourlyRate != null ? String(hourlyRate) : null,
      lat: lat != null ? String(lat) : null,
      lng: lng != null ? String(lng) : null,
    });
  }

  // إنشاء رمز تأكيد البريد
  const verifyToken = generateSecureToken();
  await db.insert(emailTokensTable).values({
    userId: user.id,
    token: verifyToken,
    type: "email_verify",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  const token = generateToken(user.id);
  res.status(201).json({
    token,
    user: userResponse(user),
    emailVerifyToken: process.env.NODE_ENV !== "production" ? verifyToken : undefined,
  });
});

// ─── تسجيل دخول ببريد إلكتروني ───────────────────────────────────────────────
router.post("/auth/login/email", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "البريد وكلمة المرور مطلوبان" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.trim().toLowerCase()));

  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    return;
  }
  if (user.status === "banned") {
    res.status(403).json({ error: "تم إيقاف هذا الحساب" });
    return;
  }

  const token = generateToken(user.id);
  res.json({ token, user: userResponse(user) });
});

// ─── تأكيد البريد الإلكتروني ─────────────────────────────────────────────────
router.post("/auth/verify-email", async (req, res): Promise<void> => {
  const { token } = req.body;
  if (!token) {
    res.status(400).json({ error: "الرمز مطلوب" });
    return;
  }

  const [emailToken] = await db
    .select()
    .from(emailTokensTable)
    .where(
      and(
        eq(emailTokensTable.token, token),
        eq(emailTokensTable.type, "email_verify"),
        eq(emailTokensTable.used, false),
      )
    );

  if (!emailToken || emailToken.expiresAt < new Date()) {
    res.status(400).json({ error: "رمز التفعيل غير صحيح أو منتهي الصلاحية" });
    return;
  }

  await db.update(emailTokensTable).set({ used: true }).where(eq(emailTokensTable.id, emailToken.id));
  await db.update(usersTable).set({ emailVerified: true }).where(eq(usersTable.id, emailToken.userId));

  res.json({ message: "تم تأكيد البريد الإلكتروني بنجاح" });
});

// ─── تسجيل/دخول بجوجل ────────────────────────────────────────────────────────
router.post("/auth/google", async (req, res): Promise<void> => {
  const { googleId, email, name, avatarUrl } = req.body;
  if (!googleId || !email) {
    res.status(400).json({ error: "بيانات جوجل غير مكتملة" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  let [user] = await db.select().from(usersTable).where(eq(usersTable.googleId, googleId));

  if (!user) {
    const [byEmail] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
    if (byEmail) {
      await db.update(usersTable).set({ googleId, emailVerified: true, avatarUrl: avatarUrl ?? byEmail.avatarUrl }).where(eq(usersTable.id, byEmail.id));
      [user] = await db.select().from(usersTable).where(eq(usersTable.id, byEmail.id));
    } else {
      const tempPhone = `g_${googleId.substring(0, 15)}`;
      [user] = await db
        .insert(usersTable)
        .values({
          name: name ?? normalizedEmail.split("@")[0],
          phone: tempPhone,
          email: normalizedEmail,
          googleId,
          emailVerified: true,
          phoneVerified: false,
          avatarUrl: avatarUrl ?? null,
          role: "client",
          status: "active",
        })
        .returning();
    }
  }

  if (user.status === "banned") {
    res.status(403).json({ error: "تم إيقاف هذا الحساب" });
    return;
  }

  const token = generateToken(user.id);
  res.json({ token, user: userResponse(user) });
});

// ─── ربط طريقة دخول إضافية ───────────────────────────────────────────────────
router.post("/auth/link", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const { method, email, password, googleId, googleEmail, googleName, googleAvatar } = req.body;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }

  if (method === "email") {
    if (!email || !password) {
      res.status(400).json({ error: "البريد وكلمة المرور مطلوبان" });
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail));
    if (existing && existing.id !== user.id) {
      res.status(400).json({ error: "البريد الإلكتروني مرتبط بحساب آخر" });
      return;
    }
    await db.update(usersTable).set({
      email: normalizedEmail,
      passwordHash: hashPassword(password),
    }).where(eq(usersTable.id, user.id));

    const verifyToken = generateSecureToken();
    await db.insert(emailTokensTable).values({
      userId: user.id,
      token: verifyToken,
      type: "email_verify",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    res.json({
      message: "تم ربط البريد الإلكتروني بنجاح",
      emailVerifyToken: process.env.NODE_ENV !== "production" ? verifyToken : undefined,
    });
  } else if (method === "google") {
    if (!googleId || !googleEmail) {
      res.status(400).json({ error: "بيانات جوجل غير مكتملة" });
      return;
    }
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.googleId, googleId));
    if (existing && existing.id !== user.id) {
      res.status(400).json({ error: "حساب جوجل هذا مرتبط بحساب آخر" });
      return;
    }
    await db.update(usersTable).set({
      googleId,
      email: user.email ?? googleEmail.trim().toLowerCase(),
      emailVerified: true,
      avatarUrl: user.avatarUrl ?? googleAvatar ?? null,
    }).where(eq(usersTable.id, user.id));
    res.json({ message: "تم ربط حساب جوجل بنجاح" });
  } else {
    res.status(400).json({ error: "طريقة الربط غير معروفة" });
  }
});

// ─── نسيت كلمة المرور ─────────────────────────────────────────────────────────
router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: "البريد الإلكتروني مطلوب" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.trim().toLowerCase()));

  if (!user) {
    res.json({ message: "إذا كان البريد مسجلاً ستصلك رسالة" });
    return;
  }

  const resetToken = generateSecureToken();
  await db.insert(emailTokensTable).values({
    userId: user.id,
    token: resetToken,
    type: "password_reset",
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  res.json({
    message: "تم إرسال رابط إعادة تعيين كلمة المرور",
    resetToken: process.env.NODE_ENV !== "production" ? resetToken : undefined,
  });
});

// ─── إعادة تعيين كلمة المرور ─────────────────────────────────────────────────
router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ error: "الرمز وكلمة المرور الجديدة مطلوبان" });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
    return;
  }

  const [emailToken] = await db
    .select()
    .from(emailTokensTable)
    .where(
      and(
        eq(emailTokensTable.token, token),
        eq(emailTokensTable.type, "password_reset"),
        eq(emailTokensTable.used, false),
      )
    );

  if (!emailToken || emailToken.expiresAt < new Date()) {
    res.status(400).json({ error: "الرمز غير صحيح أو منتهي الصلاحية" });
    return;
  }

  await db.update(emailTokensTable).set({ used: true }).where(eq(emailTokensTable.id, emailToken.id));
  await db.update(usersTable).set({ passwordHash: hashPassword(newPassword) }).where(eq(usersTable.id, emailToken.userId));

  res.json({ message: "تم تغيير كلمة المرور بنجاح" });
});

// ─── تسجيل خروج من جميع الأجهزة ─────────────────────────────────────────────
router.post("/auth/logout-all", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  await db
    .update(usersTable)
    .set({ updatedAt: new Date() })
    .where(eq(usersTable.id, req.userId!));
  res.json({ message: "تم تسجيل الخروج من جميع الأجهزة" });
});

// ─── بيانات المستخدم الحالي ───────────────────────────────────────────────────
router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) { res.status(404).json({ error: "المستخدم غير موجود" }); return; }
  res.json(userResponse(user));
});

// ─── الدعم للمسار القديم ──────────────────────────────────────────────────────
router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, phone, password, role, categoryId, city, district, bio, yearsExperience, hourlyRate, lat, lng } = req.body;
  if (!name || !phone || !password) {
    res.status(400).json({ error: "الاسم ورقم الهاتف وكلمة المرور مطلوبة" });
    return;
  }
  const normalizedPhone = phone.trim().replace(/\s+/g, "");
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.phone, normalizedPhone));
  if (existing) {
    res.status(400).json({ error: "رقم الهاتف مسجل بالفعل" });
    return;
  }
  const [user] = await db.insert(usersTable).values({
    name: name.trim(),
    phone: normalizedPhone,
    passwordHash: hashPassword(password),
    role: (role === "provider" ? "provider" : "client") as "client" | "provider",
    city: city ?? null,
    status: "active",
  }).returning();

  if (role === "provider" && categoryId) {
    await db.insert(providersTable).values({
      userId: user.id,
      categoryId: Number(categoryId),
      city: city ?? "صنعاء",
      district: district ?? "",
      bio: bio ?? "",
      yearsExperience: yearsExperience ? Number(yearsExperience) : 1,
      hourlyRate: hourlyRate != null ? String(hourlyRate) : null,
      lat: lat != null ? String(lat) : null,
      lng: lng != null ? String(lng) : null,
    });
  }
  const token = generateToken(user.id);
  res.status(201).json({ token, user: userResponse(user) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    res.status(400).json({ error: "رقم الهاتف وكلمة المرور مطلوبان" });
    return;
  }
  const normalizedPhone = phone.trim().replace(/\s+/g, "");
  const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, normalizedPhone));
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" });
    return;
  }
  if (user.status === "banned") {
    res.status(403).json({ error: "تم إيقاف هذا الحساب" });
    return;
  }
  const token = generateToken(user.id);
  res.json({ token, user: userResponse(user) });
});

export default router;
