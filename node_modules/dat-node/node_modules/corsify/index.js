var methods = require("http-methods")

/* 
type Handler := (req, res) => void | { 
    GET?: (req, res) => void, 
    POST?: (req, res) => void,
    DELETE?: (req, res) => void,
    PUT?: (req, res) => void,
    OPTIONS?: (req, res) => void
}

Corsify := (opts: Options, handler: Handler) => Handler &
    (opts: Options) => (handler: Handler) => Handler &
    (handler: Handler) => Handler

*/
module.exports = Corsify

function Corsify(opts, handler) {
    if (typeof opts === "function") {
        handler = opts
        opts = {}
    }

    if (!handler && opts && !isOptions(opts)) {
        handler = opts
        opts = {}
    }

    if (!handler) {
        return Corsify.bind(null, opts)
    }

    if (typeof handler !== "function") {
        handler = methods(handler)
    }

    return routeHandler

    function routeHandler(req, res) {
        addCrossDomainHeaders(req, res, opts)
        if (opts.endOptions !== false && req.method === "OPTIONS") {
            res.end()
        } else {
            handler.apply(this, arguments)
        }
    }
}

function isOptions(opts) {
    return "endOptions" in opts ||
        "getOrigin" in opts ||
        "Access-Control-Allow-Origin" in opts ||
        "Access-Control-Allow-Methods" in opts ||
        "Access-Control-Allow-Credentials" in opts ||
        "Access-Control-Max-Age" in opts ||
        "Access-Control-Allow-Headers" in opts
}

function addCrossDomainHeaders(req, res, opts) {
    var origin = "getOrigin" in opts ?
        opts.getOrigin(req, res) :
        opts["Access-Control-Allow-Origin"] || req.headers.origin

    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin)
        res.setHeader("Access-Control-Allow-Methods",
            opts["Access-Control-Allow-Methods"] ||
                "POST, GET, PUT, DELETE, OPTIONS, XMODIFY")
        res.setHeader("Access-Control-Allow-Credentials",
            opts["Access-Control-Allow-Credentials"] || "true")
        res.setHeader("Access-Control-Max-Age",
            opts["Access-Control-Max-Age"] || "86400")
        res.setHeader("Access-Control-Allow-Headers",
            opts["Access-Control-Allow-Headers"] ||
                "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept")
    }
}
