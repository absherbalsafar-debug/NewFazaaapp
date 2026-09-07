import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

type CallDescription = {
  type?: string;
  sdp?: string;
};

type CallCandidate = {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
};

type CallRecord = {
  id: string;
  callerId: number;
  calleeId: number;
  status: "ringing" | "active" | "ended";
  offer?: CallDescription;
  answer?: CallDescription;
  callerCandidates: CallCandidate[];
  calleeCandidates: CallCandidate[];
  createdAt: number;
};

const calls = new Map<string, CallRecord>();
const CALL_TTL_MS = 10 * 60 * 1000;

function cleanExpiredCalls() {
  const cutoff = Date.now() - CALL_TTL_MS;
  for (const [id, call] of calls) {
    if (call.createdAt < cutoff || call.status === "ended") calls.delete(id);
  }
}

function getCallForUser(idParam: string | string[], userId: number, res: any): CallRecord | null {
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const call = calls.get(id);
  if (!call) {
    res.status(404).json({ error: "المكالمة غير موجودة أو انتهت" });
    return null;
  }
  if (call.callerId !== userId && call.calleeId !== userId) {
    res.status(403).json({ error: "لا تملك صلاحية هذه المكالمة" });
    return null;
  }
  return call;
}

const router: IRouter = Router();

router.post("/calls", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  cleanExpiredCalls();
  const calleeId = Number(req.body?.calleeId);
  if (!Number.isInteger(calleeId) || calleeId === req.userId) {
    res.status(400).json({ error: "مستخدم الاتصال غير صالح" });
    return;
  }

  const [callee] = await db.select().from(usersTable).where(eq(usersTable.id, calleeId));
  if (!callee || callee.status === "banned") {
    res.status(404).json({ error: "المستخدم غير متاح للاتصال" });
    return;
  }

  const call: CallRecord = {
    id: randomUUID(),
    callerId: req.userId!,
    calleeId,
    status: "ringing",
    callerCandidates: [],
    calleeCandidates: [],
    createdAt: Date.now(),
  };
  calls.set(call.id, call);
  res.status(201).json({ id: call.id, status: call.status });
});

router.get("/calls/incoming", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  cleanExpiredCalls();
  const incoming = [...calls.values()]
    .filter((call) => call.calleeId === req.userId && call.status === "ringing")
    .sort((a, b) => b.createdAt - a.createdAt);

  const result = await Promise.all(incoming.map(async (call) => {
    const [caller] = await db.select().from(usersTable).where(eq(usersTable.id, call.callerId));
    return {
      id: call.id,
      callerId: call.callerId,
      callerName: caller?.name ?? "مستخدم",
      callerAvatarUrl: caller?.avatarUrl ?? null,
    };
  }));
  res.json(result);
});

router.get("/calls/:id", requireAuth, (req: AuthRequest, res): void => {
  cleanExpiredCalls();
  const call = getCallForUser(req.params.id, req.userId!, res);
  if (!call) return;

  const isCaller = call.callerId === req.userId;
  res.json({
    id: call.id,
    role: isCaller ? "caller" : "callee",
    callerId: call.callerId,
    calleeId: call.calleeId,
    status: call.status,
    offer: call.offer ?? null,
    answer: call.answer ?? null,
    remoteCandidates: isCaller ? call.calleeCandidates : call.callerCandidates,
  });
});

router.post("/calls/:id/offer", requireAuth, (req: AuthRequest, res): void => {
  const call = getCallForUser(req.params.id, req.userId!, res);
  if (!call) return;
  if (call.callerId !== req.userId) {
    res.status(403).json({ error: "فقط المتصل يستطيع بدء المكالمة" });
    return;
  }
  call.offer = req.body?.offer;
  res.json({ success: true });
});

router.post("/calls/:id/answer", requireAuth, (req: AuthRequest, res): void => {
  const call = getCallForUser(req.params.id, req.userId!, res);
  if (!call) return;
  if (call.calleeId !== req.userId) {
    res.status(403).json({ error: "فقط الطرف المستلم يستطيع قبول المكالمة" });
    return;
  }
  call.answer = req.body?.answer;
  call.status = "active";
  res.json({ success: true });
});

router.post("/calls/:id/candidates", requireAuth, (req: AuthRequest, res): void => {
  const call = getCallForUser(req.params.id, req.userId!, res);
  if (!call) return;
  const candidate = req.body?.candidate as CallCandidate | undefined;
  if (!candidate) {
    res.status(400).json({ error: "بيانات الاتصال غير صالحة" });
    return;
  }
  if (call.callerId === req.userId) call.callerCandidates.push(candidate);
  else call.calleeCandidates.push(candidate);
  res.json({ success: true });
});

router.post("/calls/:id/end", requireAuth, (req: AuthRequest, res): void => {
  const call = getCallForUser(req.params.id, req.userId!, res);
  if (!call) return;
  call.status = "ended";
  res.json({ success: true });
});

export default router;