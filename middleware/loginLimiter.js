const rateLimit = require("express-rate-limit");
const { logEvents } = require("./logger");

const loginLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 5, // Limito ogni IP a 5 tentativi di login
    message: {
        message:
            "Troppo tentativi di login, riprova fra 60 secondi",
    },
    handler: (req, res, next, options) => {
        logEvents(
            `Too Many Requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
            "errLog.log"
        );
        res.status(options.statusCode).send(options.message);
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = loginLimiter;
