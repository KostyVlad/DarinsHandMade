const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_MIN = 2;
const NAME_MAX = 60;
const EMAIL_MAX = 254;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

const isString = (v) => typeof v === 'string';
const fail = (res, msg) => res.status(400).json({ success: false, msg });

const checkEmail = (email) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed.length > EMAIL_MAX || !EMAIL_RE.test(trimmed)) return null;
    return trimmed;
};

const validateSignup = (req, res, next) => {
    const { name, email, password } = req.body;

    if (!isString(name) || !isString(email) || !isString(password)) {
        return fail(res, 'Неверный формат данных');
    }

    const trimmedName = name.trim();
    if (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX) {
        return fail(res, `Имя должно быть от ${NAME_MIN} до ${NAME_MAX} символов`);
    }

    const normalizedEmail = checkEmail(email);
    if (!normalizedEmail) return fail(res, 'Некорректный email');

    if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
        return fail(res, `Пароль должен быть от ${PASSWORD_MIN} до ${PASSWORD_MAX} символов`);
    }

    req.body.name = trimmedName;
    req.body.email = normalizedEmail;
    next();
};

const validateSignin = (req, res, next) => {
    const { email, password } = req.body;

    if (!isString(email) || !isString(password)) {
        return fail(res, 'Неверный формат данных');
    }
    if (!email.trim() || !password) {
        return fail(res, 'Email и пароль обязательны');
    }
    if (password.length > PASSWORD_MAX) {
        return fail(res, 'Неверный формат данных');
    }

    req.body.email = email.trim().toLowerCase();
    next();
};

const validateGoogle = (req, res, next) => {
    const { idToken } = req.body;

    if (!isString(idToken) || idToken.length < 1 || idToken.length > 4096) {
        return fail(res, 'Неверный формат данных');
    }

    next();
};

module.exports = { validateSignup, validateSignin, validateGoogle };
