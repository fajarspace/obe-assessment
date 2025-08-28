exports.isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized. Please log in first." });
};

exports.rillAuthCoy = (req, res, next) => {
  if (req.isAuthenticated()) {
    const redirectUrl = `${process.env.CLIENT_URL}/dashboard`;
    return res.redirect(redirectUrl);
  }
  next();
};
