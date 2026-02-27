import { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getTurnstileConfig } from "@/lib/turnstile";

export const metadata: Metadata = {
  title: "登录 - MoePush",
  description: "登录到 MoePush",
};

export default function LoginPage() {
  const turnstileConfig = getTurnstileConfig();
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-blue-600" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-white to-blue-100 text-transparent bg-clip-text">
              MoePush
            </span>
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              简单易用的消息推送服务
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              欢迎回来
            </h1>
            <p className="text-sm text-muted-foreground">
              请选择以下方式登录
            </p>
          </div>
          <Suspense>
            <LoginForm turnstile={turnstileConfig} />
          </Suspense>
          <p className="px-8 text-center text-sm text-muted-foreground">
            还没有账号?{" "}
            <Link
              href="/register"
              className="underline underline-offset-4 hover:text-primary"
            >
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 