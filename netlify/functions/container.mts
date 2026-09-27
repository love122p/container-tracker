import type { Config, Context } from "@netlify/functions";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { containers } from "../../db/schema.js";

export default async (req: Request, context: Context) => {
  const id = Number(context.params.id);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "Invalid container id" }, { status: 400 });
  }

  if (req.method === "PATCH") {
    const body = await req.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.containerNumber !== undefined) updates.containerNumber = body.containerNumber;
    if (body.originPort !== undefined) updates.originPort = body.originPort;
    if (body.destinationPort !== undefined) updates.destinationPort = body.destinationPort;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.eta !== undefined) updates.eta = new Date(body.eta);
    if (body.status !== undefined) {
      updates.status = body.status;
      updates.arrivedAt = body.status === "arrived" ? new Date() : null;
    }

    const [updated] = await db
      .update(containers)
      .set(updates)
      .where(eq(containers.id, id))
      .returning();

    if (!updated) {
      return Response.json({ error: "Container not found" }, { status: 404 });
    }

    return Response.json(updated);
  }

  if (req.method === "DELETE") {
    const [deleted] = await db.delete(containers).where(eq(containers.id, id)).returning();

    if (!deleted) {
      return Response.json({ error: "Container not found" }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/containers/:id",
};
