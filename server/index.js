const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const session = require("express-session");
const passport = require("./config/passport");
const connectSessionSequelize = require("connect-session-sequelize")(
  session.Store
);

const sequelize = require("./config/db");

const app = express();

app.set("trust proxy", true);

// Serve static files from the public directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const corsOptions = {
  origin: "http://localhost:5173", // Sesuaikan dengan URL frontend Anda
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Metode yang diizinkan
  credentials: true, // Menyertakan cookies dan kredensial lain dalam permintaan
};

app.use(cors(corsOptions)); // Gunakan CORS di seluruh aplikasi

// Middleware to parse JSON and URL-encoded request bodies
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

const sessionStore = new connectSessionSequelize({
  db: sequelize, // Menghubungkan dengan database
});

// Middleware untuk sesi
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 48,
    },
  })
);

// Initialize Passport dan sesi
app.use(passport.initialize());
app.use(passport.session());

// Route handling
// Routes

app.use("/auth", require("./routes/users.route"));
app.use("/api/profile", require("./routes/profile.route"));
app.use("/pl", require("./routes/pl.route"));
app.use("/cpl", require("./routes/cpl.route"));
app.use("/cpmk", require("./routes/cpmk.route"));
app.use("/subcpmk", require("./routes/subcpmk.route"));
app.use("/mk", require("./routes/mk.route"));

// Dosen.sync().then(() => {
//   console.log("Sesi telah disinkronkan dengan database.");
// });
// sessionStore.sync();
// sequelize.sync();
// sequelize.sync({ alter: true });
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
