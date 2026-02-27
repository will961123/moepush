"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast";
import { Turnstile } from "./turnstile";
// import { signIn } from "next-auth/react";

interface TurnstileConfig {
  enabled: boolean;
  siteKey: string;
}

interface RegisterFormProps extends React.HTMLAttributes<HTMLDivElement> {
  turnstile?: TurnstileConfig;
}

export function RegisterForm({ turnstile, ...props }: RegisterFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = React.useState("");
  const [turnstileResetCounter, setTurnstileResetCounter] = React.useState(0);

  const turnstileSiteKey = turnstile?.siteKey ?? "";
  const turnstileEnabled = Boolean(turnstile?.enabled && turnstileSiteKey);

  const resetTurnstile = React.useCallback(() => {
    setTurnstileToken("");
    setTurnstileResetCounter((prev) => prev + 1);
  }, []);

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();

    const target = event.target as typeof event.target & {
      username: { value: string };
      password: { value: string };
      confirmPassword: { value: string };
    };

    const username = target.username.value;
    const password = target.password.value;
    const confirmPassword = target.confirmPassword.value;

    if (password !== confirmPassword) {
      toast({
        title: "错误",
        description: "两次输入的密码不一致",
        variant: "destructive",
      });
      return;
    }

    // 检查 Turnstile 验证
    if (turnstileEnabled && !turnstileToken) {
      toast({
        title: "验证失败",
        description: "请先完成安全验证",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json() as { message: string };
        throw new Error(error.message);
      }

      // 注册成功后跳转到登录页
      // const result = await signIn("credentials", {
      //   username,
      //   password,
      //   redirect: false,
      // });
      //
      // if (result?.error) {
      //   throw new Error("登录失败");
      // }

      toast({
        title: "注册成功",
        description: "请使用您的账号登录",
      });

      router.push("/login");
      router.refresh();
    } catch (error) {
      toast({
        title: "注册失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
      resetTurnstile();
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
              minLength={3}
              maxLength={20}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              placeholder="请输入密码（至少8位）"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              required
              minLength={8}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              placeholder="请再次输入密码"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              required
              minLength={8}
            />
          </div>
          <Button disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            注册
          </Button>
        </div>
      </form>
      {turnstileEnabled && turnstileSiteKey && (
        <Turnstile
          siteKey={turnstileSiteKey}
          onVerify={setTurnstileToken}
          onExpire={resetTurnstile}
          resetSignal={turnstileResetCounter}
        />
      )}
    </div>
  );
}
