// modular version: MrScheme from Frederic Peschanski

import { Tokenizer } from "./lib/lexer101.mjs";
import { Parser as _parser} from "./lib/parser101.mjs";

export function Parser (prog) {
    const lexer = new Tokenizer(prog);
    const parser = new _parser(lexer);
    return parser;
}

import { defaultPrimsEnv } from "./lib/prims101.mjs";
import { NumericalTowerLib } from "./lib/numericaltower101.mjs";
import { TreeLib as _treelib} from "./lib/tree101.mjs";
export const TreeLib = _treelib;
import { CanvasLib } from './lib/images101.mjs';

export function defaultEnvironment () {
    const penv = defaultPrimsEnv();
    NumericalTowerLib.installPrimEnv(penv);
    TreeLib.installPrimEnv(penv);
    CanvasLib.installPrimEnv(penv);
    return penv;
}

import { Message101 } from './lib/message101.mjs';
Message101.frenchTranslations();
Message101.Language = 'fr';

import { Evaluator as _e } from "./lib/eval101.mjs";
export const Evaluator = _e;

// end of index.mjs


