import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/lib/db";
import { eq } from "drizzle-orm";
import { users, accounts } from "@/lib/db/schema";
import { authSchema } from "./validation";
import { comparePassword } from "./utils";
import { generateAvatarUrl } from "./avatar";

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut
} = NextAuth(() => ({
    secret: process.env.AUTH_SECRET!,
    adapter: DrizzleAdapter(getDb(), {
        usersTable: users,
            accountsTable: accounts,
        }),
        session: {
            strategy: "jwt",
        },
        pages: {
            signIn: "/login",
            error: "/login",
        },
        providers: [
            GithubProvider({
                clientId: process.env.AUTH_GITHUB_ID!,
                clientSecret: process.env.AUTH_GITHUB_SECRET!,
            }),
            CredentialsProvider({
                name: "credentials",
                credentials: {
                    username: { label: "用户名", type: "text", placeholder: "请输入用户名" },
                    password: { label: "密码", type: "password", placeholder: "请输入密码" },
                },
                async authorize(credentials) {
                    if (!credentials) {
                        throw new Error("请输入用户名和密码")
                    }

                    const { username, password } = credentials

                    try {
                        authSchema.parse({ username, password })
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (error) {
                        throw new Error("输入格式不正确")
                    }

                    const db = getDb()

                    const user = await db.query.users.findFirst({
                        where: eq(users.username, username as string),
                    })

                    if (!user) {
                        throw new Error("用户名或密码错误")
                    }

                    const isValid = await comparePassword(password as string, user.password as string)
                    if (!isValid) {
                        throw new Error("用户名或密码错误")
                    }

                    return {
                        ...user,
                        password: undefined,
                    }
                },
            })
        ],
        callbacks: {
            async signIn({ user, account }) {
                console.log('[SignIn] 登录尝试:', {
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    provider: account?.provider,
                });

                console.log('[SignIn] 环境变量:', {
                    DISABLE_CREDENTIALS_REGISTER: process.env.DISABLE_CREDENTIALS_REGISTER,
                    DISABLE_GITHUB_REGISTER: process.env.DISABLE_GITHUB_REGISTER,
                });

                // 检查是否禁用 GitHub 注册
                if (account?.provider === "github" && process.env.DISABLE_GITHUB_REGISTER === "true") {
                    console.log('[SignIn] GitHub 注册已禁用，检查用户是否已存在');

                    // 检查用户是否已存在
                    const db = getDb();
                    const existingUser = await db.query.users.findFirst({
                        where: eq(users.id, user.id as string),
                    });

                    console.log('[SignIn] 现有用户查询结果:', {
                        found: !!existingUser,
                        userId: existingUser?.id,
                    });

                    // 如果用户不存在，说明是新注册，拒绝登录
                    if (!existingUser) {
                        console.log('[SignIn] 拒绝新用户注册');
                        return false;
                    }

                    console.log('[SignIn] 允许现有用户登录');
                }

                console.log('[SignIn] 登录成功');
                return true;
            },
            async session({ token, session }) {
                if (token && session.user) {
                    session.user.id = token.id as string
                    session.user.name = token.name as string
                    session.user.username = token.username as string
                    session.user.image = token.image as string
                }
                return session;
            },
            async jwt({ token, user }) {
                if (user) {
                    token.id = user.id
                    token.name = user.name || user.username
                    token.username = user.username
                    token.image = user.image || generateAvatarUrl(token.name as string)
                }
                return token
            },
    }
}));