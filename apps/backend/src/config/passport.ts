import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "../infrastructure/database/prisma.js";

export const configurePassport = (): void => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientID || !clientSecret) {
    console.warn("[Passport] Google OAuth credentials missing. Redirect flow disabled.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: "/api/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase().trim();

          if (!email) {
            return done(new Error("Google account email is unavailable"), undefined);
          }

          let user = await prisma.user.findUnique({ where: { email } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                name: profile.displayName,
                email,
                googleId: profile.id,
                avatar: profile.photos?.[0]?.value || "",
                isVerified: true,
              },
            });
          } else {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                googleId: profile.id,
                avatar: user.avatar || profile.photos?.[0]?.value || "",
                isVerified: true,
              },
            });
            await prisma.otp.deleteMany({ where: { userId: user.id } });
          }

          return done(null, user);
        } catch (err: any) {
          return done(err, undefined);
        }
      },
    ),
  );
};

export default configurePassport;
