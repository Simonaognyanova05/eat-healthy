import { Router } from "express";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { PlanRequest } from "../models/PlanRequest.js";
import { User } from "../models/User.js";
import { getSession } from "../services/sessionService.js";
import { createPlanRequestSchema, decidePlanRequestSchema } from "../validation/planRequestSchemas.js";

const router = Router();
const PRICES = Object.freeze({ starter: 1500, pro: 4900 });
const requestLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });

async function requireUser(req, res, next) {
  try {
    const session = await getSession(req.cookies.eh_session, req.app.locals.env.SESSION_SECRET);
    if (!session?.userId || session.userId.status !== "active") {
      return res.status(401).json({ error: { code: "AUTH_REQUIRED", message: "Влез в профила си." } });
    }
    req.authUser = session.userId;
    return next();
  } catch (error) { return next(error); }
}

function requireAdmin(req, res, next) {
  if (req.authUser.role !== "admin") {
    return res.status(403).json({ error: { code: "ADMIN_REQUIRED", message: "Нямаш достъп до тази секция." } });
  }
  return next();
}

router.post("/", requireUser, requestLimit, async (req, res, next) => {
  try {
    const parsed = createPlanRequestSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: { code: "INVALID_PLAN", message: "Избери валиден платен план." } });
    if (req.authUser.plan === parsed.data.plan && req.authUser.planStatus === "active" && req.authUser.planExpiresAt > new Date()) {
      return res.status(409).json({ error: { code: "PLAN_ALREADY_ACTIVE", message: "Този план вече е активен." } });
    }
    const planRequest = await PlanRequest.create({
      owner: req.authUser._id,
      requestedPlan: parsed.data.plan,
      priceCents: PRICES[parsed.data.plan]
    });
    return res.status(201).json({ data: { request: serializeRequest(planRequest) } });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: { code: "PLAN_REQUEST_PENDING", message: "Вече имаш заявка, която чака одобрение." } });
    }
    return next(error);
  }
});

router.get("/mine", requireUser, async (req, res, next) => {
  try {
    const planRequest = await PlanRequest.findOne({ owner: req.authUser._id }).sort({ createdAt: -1 }).lean();
    return res.json({ data: { request: planRequest ? serializeRequest(planRequest) : null } });
  } catch (error) { return next(error); }
});

router.get("/admin", requireUser, requireAdmin, async (_req, res, next) => {
  try {
    const requests = await PlanRequest.find({ status: "pending" })
      .sort({ createdAt: 1 })
      .limit(100)
      .populate("owner", "email displayName")
      .lean();
    return res.json({ data: { requests: requests.map(serializeRequest) } });
  } catch (error) { return next(error); }
});

router.patch("/admin/:id", requireUser, requireAdmin, async (req, res, next) => {
  const parsed = decidePlanRequestSchema.safeParse(req.body);
  if (!parsed.success || !mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: { code: "INVALID_DECISION", message: "Невалидно решение." } });
  }
  const dbSession = await mongoose.startSession();
  try {
    let decidedRequest;
    await dbSession.withTransaction(async () => {
      decidedRequest = await PlanRequest.findOneAndUpdate(
        { _id: req.params.id, status: "pending" },
        { $set: { status: parsed.data.decision, decidedBy: req.authUser._id, decidedAt: new Date() } },
        { new: true, session: dbSession }
      );
      if (!decidedRequest) return;
      if (parsed.data.decision === "approved") {
        const planExpiresAt = new Date();
        planExpiresAt.setUTCMonth(planExpiresAt.getUTCMonth() + 1);
        await User.updateOne(
          { _id: decidedRequest.owner, status: "active" },
          { $set: { plan: decidedRequest.requestedPlan, planStatus: "active", planExpiresAt } },
          { session: dbSession }
        );
      }
    });
    if (!decidedRequest) return res.status(409).json({ error: { code: "REQUEST_ALREADY_DECIDED", message: "Заявката вече е обработена." } });
    return res.json({ data: { request: serializeRequest(decidedRequest) } });
  } catch (error) { return next(error); }
  finally { await dbSession.endSession(); }
});

function serializeRequest(item) {
  const owner = item.owner && typeof item.owner === "object" && item.owner.email
    ? { id: item.owner._id.toString(), email: item.owner.email, displayName: item.owner.displayName }
    : undefined;
  return {
    id: item._id.toString(),
    plan: item.requestedPlan,
    priceCents: item.priceCents,
    currency: item.currency,
    status: item.status,
    createdAt: item.createdAt,
    decidedAt: item.decidedAt,
    ...(owner && { owner })
  };
}

export default router;
