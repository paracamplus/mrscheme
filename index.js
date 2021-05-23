// MrScheme from Frederic Peschanski

const Tokenizer = require("./lib/lexer101.mjs");
const _parser = require("./lib/parser101.mjs");

function Parser (prog) {
    const lexer = new Tokenizer(prog);
    const parser = new _parser(lexer);
    return parser;
}

const defaultPrimsEnv = require("./lib/prims101.mjs");
const NumericalTowerLib = require("./lib/numericaltower101.mjs");

function defaultEnvironment () {
    const penv = defaultPrimsEnv();
    NumericalTowerLib.installPrimEnv(penv);
    // TreeLib.installPrimEnv(penv);
    // CanvasLib.installPrimEnv(penv);
    return penv;
}

const Message101 = require('./lib/message101.mjs');
Message101.frenchTranslations();
Message101.Language = 'fr';

const Evaluator = require("./lib/eval101.mjs");

module.exports = {
    Parser,
    Evaluator,
    defaultEnvironment
};

// end of index.js


