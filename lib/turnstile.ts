interface TurnstileConfig {
  enabled: boolean
  siteKey: string
  secretKey: string
}

export function getTurnstileConfig(): TurnstileConfig {
  return {
    enabled: process.env.TURNSTILE_ENABLED === "true",
    siteKey: process.env.TURNSTILE_SITE_KEY || "",
    secretKey: process.env.TURNSTILE_SECRET_KEY || "",
  }
}

export interface TurnstileVerificationResult {
  success: boolean
  reason?: "missing-token" | "verification-failed"
}

export async function verifyTurnstileToken(token?: string | null): Promise<TurnstileVerificationResult> {
  const config = getTurnstileConfig()

  console.log('[Turnstile] 验证配置:', {
    enabled: config.enabled,
    hasSiteKey: !!config.siteKey,
    hasSecretKey: !!config.secretKey,
    hasToken: !!token,
  });

  if (!config.enabled || !config.siteKey || !config.secretKey) {
    console.log('[Turnstile] 验证跳过（未启用或配置不完整）');
    return { success: true }
  }

  const trimmedToken = token?.trim()
  if (!trimmedToken) {
    console.log('[Turnstile] 验证失败：缺少 token');
    return { success: false, reason: "missing-token" }
  }

  try {
    console.log('[Turnstile] 开始调用 Cloudflare API');
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${encodeURIComponent(config.secretKey)}&response=${encodeURIComponent(trimmedToken)}`,
    })

    console.log('[Turnstile] API 响应状态:', response.status);

    if (!response.ok) {
      console.log('[Turnstile] API 响应失败');
      return { success: false, reason: "verification-failed" }
    }

    const data = await response.json() as { success: boolean }
    console.log('[Turnstile] API 响应数据:', data);

    if (!data.success) {
      console.log('[Turnstile] 验证失败：Cloudflare 返回 success=false');
      return { success: false, reason: "verification-failed" }
    }

    console.log('[Turnstile] 验证成功');
    return { success: true }
  } catch (error) {
    console.error("[Turnstile] 验证异常:", error)
    return { success: false, reason: "verification-failed" }
  }
}