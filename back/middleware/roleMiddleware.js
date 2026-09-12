// Runs after protect. It allows the request only if the role of the user
// is one of the roles we listed, for example restrictTo('manager', 'admin').
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).send({ message: 'Manager access only' });
    }
    next();
  };
};

module.exports = restrictTo;
