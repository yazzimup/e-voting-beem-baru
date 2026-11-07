
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";

const supabaseUrl = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const sessionSecret = process.env.APP_SESSION_SECRET;

const adminDb = createClient(supabaseUrl, secretKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

const authClient = createClient(supabaseUrl, publishableKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

function normalizeName(value) {
    return value.trim().replace(/\s+/g, " ").toUpperCase();
}

async function createSession(payload) {
    const key = new TextEncoder().encode(sessionSecret);

    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("4h")
        .sign(key);
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            message: "Metode tidak diizinkan."
        });
    }

    if (!supabaseUrl || !secretKey || !publishableKey ||
        !sessionSecret || sessionSecret.length < 32) {
        return res.status(500).json({
            message: "Konfigurasi server belum lengkap."
        });
    }

    try {
        const { role } = req.body || {};

        let sessionPayload;

        // LOGIN ADMIN
        if (role === "admin") {
            const { username, password } = req.body;

            if (
                !username ||
                !password ||
                username !== process.env.ADMIN_USERNAME
            ) {
                return res.status(401).json({
                    message: "Username atau password salah."
                });
            }

            const { data, error } =
                await authClient.auth.signInWithPassword({
                    email: process.env.ADMIN_LOGIN_EMAIL,
                    password
                });

            if (error || !data.user) {
                return res.status(401).json({
                    message: "Username atau password salah."
                });
            }

            const { data: profile, error: profileError } =
                await adminDb
                    .from("admin_profiles")
                    .select("role")
                    .eq("user_id", data.user.id)
                    .maybeSingle();

            if (
                profileError ||
                !profile ||
                !["admin", "panitia"].includes(profile.role)
            ) {
                return res.status(403).json({
                    message: "Akun tidak memiliki akses admin."
                });
            }

            sessionPayload = {
                sub: data.user.id,
                role: profile.role
            };
        }

        // LOGIN MAHASISWA
        else if (role === "student") {
            const { nim, fullName } = req.body;

            if (!nim || !fullName) {
                return res.status(400).json({
                    message: "NIM dan nama lengkap wajib diisi."
                });
            }

            const { data: student, error } = await adminDb
                .from("students")
                .select("nim, full_name")
                .eq("nim", nim.trim())
                .maybeSingle();

            if (
                error ||
                !student ||
                normalizeName(student.full_name) !==
                    normalizeName(fullName)
            ) {
                return res.status(401).json({
                    message: "NIM atau nama lengkap tidak sesuai."
                });
            }

            sessionPayload = {
                sub: student.nim,
                role: "student"
            };
        } else {
            return res.status(400).json({
                message: "Jenis login tidak valid."
            });
        }

        const token = await createSession(sessionPayload);

        res.setHeader("Set-Cookie", [
            `beem_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=14400`
        ]);

        return res.status(200).json({
            success: true,
            role: sessionPayload.role,
            redirect:
                sessionPayload.role === "student"
                    ? "/voting.html"
                    : "/admin-dashboard.html"
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server."
        });
    }
}
