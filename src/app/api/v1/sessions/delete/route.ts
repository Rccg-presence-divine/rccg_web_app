import prisma from "@/lib/prisma";
export async function DELETE(req: Request) {
  const { sessionId } = await req.json();

  await prisma.session.update({
    where: { id: sessionId },
    data: { revoked: true },
  });

  return Response.json({ message: "Session révoquée" });
}
