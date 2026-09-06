import { Router, type IRouter } from "express";
import { db, conversationsTable, messagesTable, usersTable, notificationsTable } from "@workspace/db";
import { eq, and, or, desc, count, ne } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { SendMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/conversations", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const convs = await db
    .select()
    .from(conversationsTable)
    .where(or(
      eq(conversationsTable.userAId, req.userId!),
      eq(conversationsTable.userBId, req.userId!),
    ))
    .orderBy(desc(conversationsTable.updatedAt));

  const result = await Promise.all(convs.map(async (conv) => {
    const otherId = conv.userAId === req.userId ? conv.userBId : conv.userAId;
    const [other] = await db.select().from(usersTable).where(eq(usersTable.id, otherId));
    const [unreadRow] = await db
      .select({ cnt: count(messagesTable.id) })
      .from(messagesTable)
      .where(and(
        eq(messagesTable.conversationId, conv.id),
        eq(messagesTable.isRead, false),
        ne(messagesTable.senderId, req.userId!),
      ));

    return {
      id: conv.id,
      otherUserId: otherId,
      otherUserName: other?.name ?? "",
      otherUserAvatarUrl: other?.avatarUrl ?? null,
      lastMessage: conv.lastMessage ?? null,
      unreadCount: Number(unreadRow?.cnt ?? 0),
      updatedAt: conv.updatedAt.toISOString(),
    };
  }));

  res.json(result);
});

router.get("/conversations/:id/messages", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, id));
  if (!conversation) { res.status(404).json({ error: "Conversation not found" }); return; }
  if (![conversation.userAId, conversation.userBId].includes(req.userId!)) {
    res.status(403).json({ error: "لا تملك صلاحية عرض هذه المحادثة" }); return;
  }

  const msgs = await db
    .select({ m: messagesTable, u: usersTable })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);

  // Mark messages as read
  await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(and(
      eq(messagesTable.conversationId, id),
      eq(messagesTable.isRead, false),
      ne(messagesTable.senderId, req.userId!),
    ));

  res.json(msgs.map(({ m, u }) => ({
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    senderName: u.name,
    content: m.content,
    imageUrl: m.imageUrl ?? null,
    isRead: m.isRead,
    createdAt: m.createdAt.toISOString(),
  })));
});

router.post("/conversations/:id/messages", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  if (![conv.userAId, conv.userBId].includes(req.userId!)) {
    res.status(403).json({ error: "لا تملك صلاحية الكتابة في هذه المحادثة" }); return;
  }

  const [msg] = await db.insert(messagesTable).values({
    conversationId: id,
    senderId: req.userId!,
    content: parsed.data.content,
    imageUrl: parsed.data.imageUrl ?? null,
  }).returning();

  await db
    .update(conversationsTable)
    .set({ lastMessage: parsed.data.content, updatedAt: new Date() })
    .where(eq(conversationsTable.id, id));

  const [sender] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  const recipientId = conv.userAId === req.userId ? conv.userBId : conv.userAId;

  await db.insert(notificationsTable).values({
    userId: recipientId,
    type: "new_message",
    title: "رسالة جديدة",
    body: `رسالة من ${sender?.name ?? "مستخدم"}`,
    relatedId: id,
  });

  res.status(201).json({
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: sender?.name ?? "",
    content: msg.content,
    imageUrl: msg.imageUrl ?? null,
    isRead: msg.isRead,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
