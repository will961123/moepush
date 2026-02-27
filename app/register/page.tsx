import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { GitHubButton } from "@/components/auth/github-button";
import { getTurnstileConfig } from "@/lib/turnstile";

export const metadata: Metadata = {
  title: "注册 - MoePush",
  description: "创建新账号",
};

export default function RegisterPage() {
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
              创建账号
            </h1>
          </div>
          <div className="grid gap-6">
            <div className="grid gap-2">
              <RegisterForm turnstile={turnstileConfig} />
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  或者
                </span>
              </div>
            </div>
            <GitHubButton />
            <p className="px-8 text-center text-sm text-muted-foreground">
              已有账号?{" "}
              <Link
                href="/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 