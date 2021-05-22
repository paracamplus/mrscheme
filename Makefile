# Time-stamp: "2021-05-22 20:59:13 queinnec"
# Create a package for MrScheme

work : nothing 
clean :: cleanMakefile

publish :
	git status .
	-git commit -m "NPM publication `date`" .
	git push
	npm version patch
	npm publish .
	sleep 10 ; npm install -g mrscheme@`jq -r .version < package.json`

# ###################################################### once
# See Servers/w.scm/Paracamplus-FW4EX-SCM/Templates/mrscheme.tt
# See also Servers/w.li101/Paracamplus-FW4EX-LI101/root/static/mrscheme/

PARACAMPLUSDIR = ${HOME}/Paracamplus/ExerciseFrameWork
LI101DIR =	${PARACAMPLUSDIR}/Servers/w.li101/Paracamplus-FW4EX-LI101
MRSCHEMEDIR = ${LI101DIR}/root/static/mrscheme
JSFILES =       ${MRSCHEMEDIR}/eval101/bignum101/biginteger101.js \
                ${MRSCHEMEDIR}/eval101/bignum101/schemeNumber101.js \
                ${MRSCHEMEDIR}/eval101/message101/message101.js \
                ${MRSCHEMEDIR}/parser101/lexer101.js \
                ${MRSCHEMEDIR}/parser101/parser101.js \
                ${MRSCHEMEDIR}/type101/type101.js \
                ${MRSCHEMEDIR}/eval101/numericaltower101.js \
                ${MRSCHEMEDIR}/eval101/prims101.js \
                ${MRSCHEMEDIR}/eval101/eval101.js

init :
	npm init
# description: Scheme interpreter in javascript

# import files from MOOC Programmation recursive
# These files should be fixed for js.codegradx.org!
init.jsfiles : Makefile
	mkdir -p lib
	rsync -avu ${JSFILES} lib/
# biginteger101 exports BigInteger used by schemeNumber101
	sed -e 's@function BigInteger@export function BigInteger@' \
		< lib/biginteger101.js > lib/biginteger101.mjs
# schemeNumber101 exports SchemeNumber
#    used by numericaltower101, parser101, prims101, eval101
	sed -e '/function/s@^var SchemeNumber@export const SchemeNumber@' \
		-e '3s@^@import { BigInteger } from "./biginteger101.mjs";@' \
		-e 's@var BigInteger;@//var BigInteger;@' \
		-e 's@BigInteger = this.BigInteger@//BigInteger = this.BigInteger@' \
		< lib/schemeNumber101.js > lib/schemeNumber101.mjs
# type101, schemenumber ares used by numericaltower101
	sed -e 's@function Type@export function Type@' \
		-e 's@function makeTypeBool@export function makeTypeBool@' \
		< lib/type101.js > lib/type101.mjs
# numericaltower101 is not used in lib/
	sed -e 's@var NumericalTowerLib@export const NumericalTowerLib@' \
		-e '1rmdollar.mjs' \
		-e '2s@^@import { SchemeNumber } from "./schemeNumber101.mjs";@' \
		-e '2rtype101imports' \
		< lib/numericaltower101.js > lib/numericaltower101.mjs
# prims
	sed -e 's@function defaultPrimsEnv@export function defaultPrimsEnv@' \
		-e '1rmdollar.mjs' \
		-e '1s@^@import { SchemeNumber }  from "./schemeNumber101.mjs";@' \
		-e '1rtype101imports' \
		< lib/prims101.js > lib/prims101.mjs
# tokenizer is not used in lib/
	sed -e 's@function Tokenizer@export function Tokenizer@' \
		-e '1rmdollar.mjs' \
		< lib/lexer101.js > lib/lexer101.mjs
# parser101 is not used in lib/
	sed -e 's@function Parser@export function Parser@' \
		-e '1rmdollar.mjs' \
		-e '2s@^@import { SchemeNumber }  from "./schemeNumber101.mjs";@' \
		< lib/parser101.js > lib/parser101.mjs
	sed -e 's@function Evaluator@export function Evaluator@' \
		-e '1rmdollar.mjs' \
		-e '2s@^@import { SchemeNumber }  from "./schemeNumber101.mjs";@' \
		< lib/eval101.js > lib/eval101.mjs

# end of Makefile
