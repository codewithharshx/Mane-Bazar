const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const OTP = require("../models/OTPModel");

module.exports = function configurePassport() {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase().trim();

      if (!email) {
        return done(new Error("Google account email is unavailable"), null);
      }

      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          name: profile.displayName,
          email,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value || "",
          isVerified: true
        });
      } else {
        user.googleId = profile.id;
        user.avatar = user.avatar || profile.photos?.[0]?.value || "";
        if (!user.isVerified) {
          user.isVerified = true;
          await OTP.findOneAndDelete({ userId: user._id });
        }
        await user.save();
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
};
