import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { authSchema, AuthSchema } from "@/lib/validation";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/utils";
import { verifyTurnstileToken } from "@/lib/turnstile";

export const runtime = "edge";

export async function POST(request: Request) {
  try {
    const json = await request.json() as AuthSchema;

    try {
      authSchema.parse(json)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "输入格式不正确" },
        { status: 400 }
      )
    }

    const { username, password ,turnstileToken} = authSchema.parse(json);

    const verification = await verifyTurnstileToken(turnstileToken);
    if (!verification.success) {
      const message = verification.reason === "missing-token"
        ? "请先完成安全验证"
        : "安全验证未通过";
      return NextResponse.json({ message }, { status: 400 });
    }

    // 检查是否禁用账号密码注册
    if (process.env.DISABLE_CREDENTIALS_REGISTER === "true") {
      return NextResponse.json(
        { message: "账号密码注册已关闭" },
        { status: 403 }
      );
    }

    const db = getDb();
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "用户名已存在" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await db.insert(users).values({
      username,
      password: hashedPassword,
      name: username,
    });

    return NextResponse.json(
      { message: "注册成功" },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "注册失败" },
      { status: 500 }
    );
  }
}
