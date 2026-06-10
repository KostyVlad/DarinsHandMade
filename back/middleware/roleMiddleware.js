const restrictTo = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, msg: 'Доступ только для менеджера' });
    }
    next();
};

module.exports = restrictTo;
