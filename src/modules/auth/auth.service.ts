import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";
import { authRepository } from "./auth.repository.js";
import { OAuthClient } from "../../config/googleClient.js";
import { AppError } from "../../shared/errors/AppError.js";
import type {
  RegisterDto,
  LoginDto,
  AuthResult,
  AuthTokenPayload,
  CurrentUserDto,
} from "./auth.types.js";

// Cost factor 12 - a good balance of security vs. login latency for bcrypt
// in 2026 (10 is the old default, 12 is the current common recommendation).
const BCRYPT_ROUNDS = 12;

// At least 8 characters, one letter and one number. Adjust to taste, but
// don't go below this - it's already a fairly low bar.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

function signToken(user: User): AuthResult {
  const payload: AuthTokenPayload = { id: user.id, email: user.email, role: user.role };
  if (!process.env.SECRET) {
    throw new Error("SECRET env var is not set");
  }
  // 7-day expiry: long enough to not be annoying, short enough that a
  // leaked token doesn't stay valid forever. Adjust via env if you want a
  // refresh-token flow instead - out of scope for now.
  const token = jwt.sign(payload, process.env.SECRET, { expiresIn: "7d" });
  return { payload, token };
}

export const authService = {
  async register(dto: RegisterDto): Promise<AuthResult> {
    if (!dto.email) {
      throw AppError.badRequest("Email is required!!!");
    }
    if (!dto.password) {
      throw AppError.badRequest("Password is required!!!");
    }
    if (!PASSWORD_RULE.test(dto.password)) {
      throw AppError.badRequest(
        "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีทั้งตัวอักษรและตัวเลข"
      );
    }

    const email = dto.email.trim().toLowerCase();
    const name = dto.name?.trim();

    const existing = await authRepository.findByEmail(email);
    if (existing) {
      throw AppError.badRequest("Email already exists!!!");
    }

    const hashPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await authRepository.create({ email, password: hashPassword, name });

    // Log the user straight in after registering (same token shape as
    // login), so the client doesn't need a separate "please log in now" step.
    return signToken(user);
  },

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = (dto.email || "").trim().toLowerCase();
    const user = await authRepository.findByEmail(email);

    if (!user || !user.enabled) {
      throw AppError.badRequest("User Not found or not Enabled");
    }
    if (!user.password) {
      // Account was created via Google Sign-In and has no password set
      throw AppError.badRequest(
        'บัญชีนี้สมัครด้วย Google กรุณาเข้าสู่ระบบด้วยปุ่ม "เข้าสู่ระบบด้วย Google"'
      );
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw AppError.badRequest("Password Invalid!!!");
    }

    return signToken(user);
  },

  // credential = the Google ID token from the client's <GoogleLogin/>
  async googleLogin(credential: string): Promise<AuthResult> {
    if (!credential) {
      throw AppError.badRequest("Missing Google credential");
    }

    // Verifies the token's signature, audience (our client ID) and expiry
    // against Google's public keys - this is what makes it safe to trust
    // the email/name/picture that come back.
    const ticket = await OAuthClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const googlePayload = ticket.getPayload();
    if (!googlePayload) {
      throw AppError.badRequest("Google email is not verified");
    }
    if (!googlePayload.email_verified || !googlePayload.email) {
      throw AppError.badRequest("Google email is not verified");
    }

    const email = googlePayload.email.toLowerCase();
    let user = await authRepository.findByEmail(email);

    if (!user) {
      user = await authRepository.create({
        email,
        name: googlePayload.name || undefined,
        picture: googlePayload.picture || undefined,
        // no password - this account can only sign in via Google
      });
    } else if (!user.enabled) {
      throw AppError.badRequest("This account cannot access");
    } else if (!user.picture && googlePayload.picture) {
      // Keep the profile picture in sync on subsequent Google logins
      user = await authRepository.updatePicture(user.id, googlePayload.picture);
    }

    return signToken(user);
  },

  async currentUser(email: string): Promise<CurrentUserDto> {
    const user = await authRepository.findByEmailWithRole(email);
    if (!user) {
      throw AppError.notFound("User not found");
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      role: user.role,
      roleId: user.roleId,
      roleName: user.roleRef?.name ?? null,
      permissions: user.roleRef?.permissions.map((p) => p.key) ?? [],
    };
  },
};
