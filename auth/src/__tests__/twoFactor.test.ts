import { beforeEach, describe, expect, it, vi } from "vitest";
import { generate, generateSecret } from "otplib";

// ---- tiny in-memory fake of the parts of prisma the 2FA service uses ----
type Row = Record<string, any>;
let row: Row;

function matches(r: Row, where: any): boolean {
  return Object.entries(where).every(([k, v]: [string, any]) => {
    if (k === "AND") return (v as any[]).every((w) => matches(r, w));
    if (k === "OR") return (v as any[]).some((w) => matches(r, w));
    if (v !== null && typeof v === "object" && !(v instanceof Date)) {
      if ("lt" in v) return r[k] !== null && r[k] < v.lt;
      return true;
    }
    return r[k] === v;
  });
}

function apply(data: any) {
  for (const [k, v] of Object.entries<any>(data)) {
    if (v && typeof v === "object" && "increment" in v) row[k] += v.increment;
    else row[k] = v;
  }
}

vi.mock("../prisma", () => ({
  prisma: {
    user: {
      findUnique: async () => ({ ...row }),
      update: async ({ data }: any) => (apply(data), { ...row }),
      updateMany: async ({ where, data }: any) =>
        matches(row, where) ? (apply(data), { count: 1 }) : { count: 0 },
    },
    twoFactorRecoveryCode: { deleteMany: async () => ({ count: 0 }) },
    $transaction: async (ops: Promise<unknown>[]) => Promise.all(ops),
  },
}));

vi.mock("../sessionTokens", () => ({ createSession: () => "access-token" }));

import jwt from "jsonwebtoken";
import {
  disableTwoFactor,
  setupTwoFactor,
  verifyTwoFactorLogin,
} from "../services/twoFactor.service";

const res: any = {};
const secret = generateSecret();

function challenge(issuedAtMs = Date.now()) {
  return jwt.sign(
    { userId: 1, purpose: "2fa", issuedAtMs },
    process.env.TWO_FACTOR_CHALLENGE_SECRET!,
    { algorithm: "HS256", expiresIn: "5m" },
  );
}

beforeEach(() => {
  process.env.TWO_FACTOR_CHALLENGE_SECRET = "test-challenge-secret";
  row = {
    id: 1,
    email: "a@b.c",
    username: "a",
    twoFactorEnabled: true,
    twoFactorSecret: secret,
    twoFactorFailedAttempts: 0,
    twoFactorLockedUntil: null,
    twoFactorLastUsedStep: null,
    twoFactorChallengeConsumedAt: null,
  };
});

describe("2FA hardening", () => {
  it("setup is refused while 2FA is enabled and leaves the user untouched", async () => {
    await expect(setupTwoFactor(1)).rejects.toThrow("TWO_FACTOR_ALREADY_ENABLED");
    expect(row.twoFactorEnabled).toBe(true);
    expect(row.twoFactorSecret).toBe(secret);
  });

  it("disable refuses a wrong code and keeps 2FA on", async () => {
    await expect(disableTwoFactor(1, "000000")).rejects.toThrow("INVALID_2FA_CODE");
    expect(row.twoFactorEnabled).toBe(true);
  });

  it("disable works with a valid code", async () => {
    await disableTwoFactor(1, await generate({ secret }));
    expect(row.twoFactorEnabled).toBe(false);
    expect(row.twoFactorSecret).toBeNull();
  });

  it("locks after 5 wrong codes, even if the next code is valid", async () => {
    const c = challenge();
    for (let i = 0; i < 4; i++) {
      await expect(verifyTwoFactorLogin(c, "000000", res)).rejects.toThrow("INVALID_2FA_CODE");
    }
    await expect(verifyTwoFactorLogin(c, "000000", res)).rejects.toThrow("TWO_FACTOR_LOCKED");
    await expect(
      verifyTwoFactorLogin(c, await generate({ secret }), res),
    ).rejects.toThrow("TWO_FACTOR_LOCKED");
  });

  it("the lockout also covers a brand new challenge (re-login does not reset it)", async () => {
    for (let i = 0; i < 5; i++) {
      await verifyTwoFactorLogin(challenge(), "000000", res).catch(() => {});
    }
    await expect(
      verifyTwoFactorLogin(challenge(Date.now() + 1), await generate({ secret }), res),
    ).rejects.toThrow("TWO_FACTOR_LOCKED");
  });

  it("a valid code works once; the same code and the same challenge cannot be reused", async () => {
    const c = challenge();
    const code = await generate({ secret });

    const ok = await verifyTwoFactorLogin(c, code, res);
    expect(ok.token).toBe("access-token");

    // same challenge + same code
    await expect(verifyTwoFactorLogin(c, code, res)).rejects.toThrow();
    // same challenge, even with a fresh (different time-step) code
    row.twoFactorLastUsedStep -= 1;
    await expect(verifyTwoFactorLogin(c, code, res)).rejects.toThrow(
      "INVALID_OR_EXPIRED_2FA_CHALLENGE",
    );
  });

  it("a successful login resets the failed-attempt counter", async () => {
    await verifyTwoFactorLogin(challenge(), "000000", res).catch(() => {});
    expect(row.twoFactorFailedAttempts).toBe(1);
    await verifyTwoFactorLogin(challenge(Date.now() + 1), await generate({ secret }), res);
    expect(row.twoFactorFailedAttempts).toBe(0);
  });
});
