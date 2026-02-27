"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast";
import { signIn } from "next-auth/react";
import { GitHubButton } from "./github-button";

export function LoginForm(props: React.HTMLAttributes<HTMLDivElement>) {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  // 处理 URL 中的错误参数
  React.useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      let errorMessage = "登录失败，请稍后重试";

      if (error === "AccessDenied") {
        errorMessage = "注册已关闭，无法创建新账号";
      } else if (error === "Configuration") {
        errorMessage = "服务配置错误，请联系管理员";
      } else if (error === "Verification") {
        errorMessage = "验证失败，请重试";
      }

      toast({
        title: "登录失败",
        description: errorMessage,
        variant: "destructive",
      });

      // 清除 URL 中的 error 参数
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("error");
      router.replace(newUrl.pathname + newUrl.search);
    }
  }, [searchParams, toast, router]);

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);

    const target = event.target as typeof event.target & {
      username: { value: string };
      password: { value: string };
    };

    try {
      const result = await signIn("credentials", {
        username: target.username.value,
        password: target.password.value,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("用户名或密码错误");
      }

      const callbackUrl = searchParams.get("callbackUrl") || "/moe/endpoints";
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      toast({
        title: "登录失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6" {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-1">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              placeholder="请输入用户名"
              type="text"
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect="off"
              disabled={isLoading}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              placeholder="请输入密码"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              required
              minLength={8}
            />
          </div>
          <Button disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            登录
          </Button>
        </div>
      </form>
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
      <GitHubButton text="GitHub 登录" />
    </div>
  );
} 