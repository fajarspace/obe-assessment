const passport = require("passport");
const { Users } = require("../models");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true, // Enable req parameter in callback
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        // Check if the user already exists in the database
        const existingUser = await Users.findOne({
          where: { googleId: profile.id },
        });

        const email = profile.emails[0].value;

        if (existingUser) {
          // Only update profile info, not the role
          const updates = {
            name: profile.displayName,
            email: email,
            picture: profile.photos[0].value,
            // role field is intentionally NOT updated here
          };

          await Users.update(updates, {
            where: { id: existingUser.id },
          });

          // Fetch the updated user with their existing role preserved
          const updatedUser = await Users.findByPk(existingUser.id);

          return done(null, updatedUser);
        } else {
          // For new users, determine role based on email
          const defaultRole = email.endsWith("@pelitabangsa.ac.id")
            ? "dosen"
            : "dosen";

          // Create new user with default role
          const newUser = await Users.create({
            googleId: profile.id,
            name: profile.displayName,
            email: email,
            picture: profile.photos[0].value,
            role: defaultRole,
          });

          return done(null, newUser);
        }
      } catch (err) {
        console.error("Error in Google OAuth callback:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await Users.findByPk(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
