"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { useToast } from "@/components/ui/use-toast";
// import { signIn } from "next-auth/react";

export function RegisterForm(props: React.HTMLAttributes<HTMLDivElement>) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);

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
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
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
    </div>
  );
}
