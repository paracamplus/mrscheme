
export const Message101 = {};

Message101.Translations = {};
Message101.Language = "en";

Message101.Translate = function(lang,key,trans) {
  var transTbl = Message101.Translations[key];
  if(transTbl == null) {
    transTbl = {};
    Message101.Translations[key] = transTbl;
  }
  transTbl[lang] = trans;
};

Message101.Message = function(msg,args) {
  this.msg = msg;
  if(args==null) {
    this.args = new Array();
  } else if(args instanceof Array) { // TODO: test array
      //console.log("args is array",args);
    this.args = args;
  } else {
    this.args = new Array(args);
  }
  
  this.toString = function() {
    var tmsg = this.msg;
    var transTbl = Message101.Translations[this.msg];
    if(transTbl!=null) {
      tmsg = transTbl[Message101.Language];
      if(tmsg == null) {
        tmsg = this.msg;
      }
    }
    // now produce the correct string
    var str = "";
    var param = false;
    for(var i=0;i<tmsg.length;i++) {
      var next = tmsg.charAt(i);
      if(next=='$') {
        if(param) {
          str += '$';
          param = false;
        } else {
          param = true;
        }
      } else if(next>='0' && next<='9') {
        if(param) {
            var ref = parseInt(next);
            //console.log("arg",ref,"value",this.args[ref],this.args);
            str += this.args[ref];
            param = false;
        } else {
          str += next;
        }
      } else {
        str += next;
      }
    }
    return str;
  }
};

export function M$ (msg, args) {
  var transTbl = Message101.Translations[msg];
  if(transTbl==null) {
    // register key
    transTbl = {};
    transTbl['default'] = msg;
    Message101.Translations[msg] = transTbl;
  }
  return new Message101.Message(msg,args);
};

// ***********************************************888
// originally messages-fr.js

Message101.frenchTranslations = function() {
    var T$ = function(key,msg) {
        return Message101.Translate('fr',key,msg);
    }
    
    // UI messages
    T$("Unknown exception raised (please report)","Une exception inconnue a été levée (contacter les développeurs de MrScheme)");
    T$('Confirm edition of a new program ?', "Confirmer l'édition d'un nouveau programme ?");
    T$('Save the program after export', "Sauvegarder le programme après l'export");
    T$('Yes','Oui');
    T$('No','Non');
    T$('Ok',"D'accord");
    T$('Cancel',"Annuler");
    T$("Edit a <strong>new</strong> program","Editer un <strong>nouveau</strong> programme");
    T$("<strong>Export</strong> the program","<strong>Exporter</strong> le programme");
    T$("<strong>Import</strong> a program","<strong>Importer</strong> un programme");
    T$("<strong>Help</strong> about MrScheme","<strong>Documentation</strong> de MrScheme");
    T$("<strong>Undo</strong> last edit","<strong>Défaire</strong> la dernière édition");
    T$("<strong>Redo</strong> last edit","<strong>Rétablir</strong> la dernière édition");
    T$("<strong>Execute</strong> the program", "<strong>Exécuter</strong> le programme");
    T$("<strong>Evaluate</strong> the expression", "<strong>Evaluer</strong> l'expression");
    T$("<strong>Trace</strong> calls in the expression", "<strong>Tracer</strong> les appels dans l'expression");
    T$("Evaluate","Evaluer");
    T$("Trace","Tracer");
    T$("Steps","Etapes");
    T$("Show all <strong>steps</strong> of evaluation", "Montrer toutes les <strong>étapes</strong> d'évaluation");
    T$("Hello I am <strong>Mr Scheme</strong><br>I will help you learn<br><strong>Recursive programming</strong><br>with the <strong>Scheme</strong> language",
       "Bonjour, je suis <strong>Mr Scheme</strong><br>Je vais vous aider à apprendre<br>la <strong>programmation récursive</strong><br>avec le langage <strong>Scheme</strong>");
    T$('Your Internet browser does not support file import',"Votre navigateur Internet ne permet pas l'import de fichier");
    T$('Unable to import file (load error)',"Impossible d'importer le fichier (erreur de lecture)");
    T$('Unable to import file: not a text file',"Impossible d'importer le fichier : pas un fichier texte");
    T$("Save the program (example: myprog.scm)", "Sauvegarder le programme (exemple: monprog.scm)");
    T$("Export the program (then save as...)", "Exporter le programme (ensuite, enregistrer sous ...)");
    T$("File saved", "Fichier sauvegardé");

    // console messages
    T$("Program execution started","Exécution du programme lancée");
    T$("  ==> Parsing expression #","  ==> Analyse syntaxique de l'expression No ");
    T$("  ==> Evaluating expression #","  ==> Evaluation de l'expression No ");
    T$("Program execution finished (elapsed time $0 ms)","Exécution du programme terminée (temps d'exécution: $0 ms)");
    T$("  ==> All $0 tests passed","  ==> Tous les $0 tests sont passés");

    // lexer messages
    T$('Not a number',"J'attends un nombre");
    T$('Not a comment',"J'attends un commentaire");
    T$("Unexpected token '$0' after \\","Je ne m'attends pas au caractère '$0' après \\"); 
    T$("Unfinished string", "Cette chaîne de caractère n'est pas terminée");
    T$("Unexpected '$0'","Le caractère '$0' est interdit dans ce contexte");
    
    // parser messages
    T$("Parse Error","Erreur de syntaxe");
    T$("Cannot define here","Définition interdite");
    T$("Missing header for function definition","Il manque l'en-tête de définition");
    T$("Wrong header for function definition", "L'en-tête de définition est incorrect");
    T$("Empty header in function definition", "L'en-tête de définition est vide");
    T$("Function name must be a symbol","Le nom d'une définition doit être un symbole");
    T$("The keyword '$0' is reserved, it cannot be used as definition name", "Le mot-clé '$0' est réservé, il ne peut être utilisé comme nom de fonction");
    T$("Parameter must be a symbol","Le paramètre doit être un symbole");
    T$("The keyword '$0' is reserved, it cannot be used as parameter", "Le mot-clé '$0' est réservé, il ne peut être utilisé comme paramètre de fonction");
    T$("The parameter '$0' is defined twice","Le paramètre '$0' est défini deux fois");
    T$("Missing body of function definition","Il manque le corps de définition");
    T$("Must be an inner definition", "J'attends une définition interne");
    T$("Inner function '$0' defined twice","La fonction interne '$0' est définie deux fois");
    T$("Missing condition, then and else clause in if expression","Il manque la condition, le conséquent et l'alternant dans ce if");
    T$("Missing then and else clause in if expression","Il manque le conséquent et l'alternant dans le if");
    T$("Missing else clause in if expression","Il manque l'alternant dans le if");
    T$("Too many arguments for if expression","Il y a trop d'arguments pour le if");
    T$("Conditional needs at leat 2 clauses","Il faut au moins deux clauses dans une conditionnelle");
    T$("Not a clause in conditional","Ce n'est pas une clause de conditionnelle");
    T$("Clause must have at least 2 elements in conditional","Une clause de conditionnelle doit avoir au moins 2 arguments");
    T$("Else clause must be the last in conditional","La clause 'else' doit être la dernière dans une conditionnelle");
    T$("Conditional must be ended by an else","La conditionnelle n'est pas terminée par une clause 'else'");
    T$("Missing arguments for $0-expression","Il manque des arguments pour la forme '$0'");
    T$("Bindings in $0-expression must be a list","Les liaisons d'un '$0' doivent former une liste");
    T$("Binding in $0-expression is not a pair","La liaison de '$0' n'est pas une paire de longueur 2");
    T$("Binding in $0-expression must be of length 2","La liaison de '$0' doit avoir deux éléments au maximum");
    T$("Variable name missing in '$0'-binding","Il manque le nom de variable dans la liaison de '$0'");
    T$("Variable '$0' defined twice in $1-expression","La variable '$0' est définie deux fois dans l'expression $1");
    T$("First argument of expression must be a symbol or a sub-expression","Le premier argument d'une expression doit être un symbole ou une sous-expression");
    T$("Extra right parenthesis","Il y a une parenthèse de trop");
    T$("Unexpected end of input","Je n'attends pas la fin du programme (il manque peut-être des parenthèses)");
    T$("Unsupported token '$0'","Je ne reconnais pas le mot '$0'");
    T$("Arrow symbol '->' or '=>' expected, not '$0' in test expression","La flèche '->' ou '=>' est nécessaire au lieu de '$0' dans l'expression de test");
    T$("Missing function name in test expression","Il manque le nom de fonction à tester dans l'expression de test");
    T$("Wrong function name in test expression: expecting a symbol", "Nom de fonction incorrect dans l'expression de test : il faut un symbole");
    T$("Missing arrow and expected value in test expression","Il manque la flèche et la valeur attendue dans l'expression de test");
    T$("Missing test case(s) in test expression", "Il manque au moins un cas à tester dans l'expression de test");
    T$("Missing arrow '->' or '=>' in test case", "Il manque la flèche '->' ou '=>' dans le cas de test");
    T$("Wrong expected value in test expression","Mauvaise valeur attendue dans l'expression de test");
    T$("Too many arguments in test expression","Trop d'arguments dans l'expression de test");
    T$("Missing expression in quote","Il manque l'expression à citer");
    T$("Too many arguments to quote","On ne peut citer qu'une seule expression");
    T$("First argument of expression must be a symbol or a sub-expression","Le premier argument d'une expression doit être un symbole ou une sous-expression");
    
    // evaluator messages
    T$("error","erreur");
    T$("Error","Erreur");
    T$("Eval Error","Erreur d'évaluation");
    T$("Not enough arguments in call (given $0, needs $1)","Il n'y pas assez d'argument(s) pour cette application ($0 arguments passés mais il en faut $1)");
    T$("Too many arguments in call (given $0, needs $1)","Il y a trop d'arguments pour cette application ($0 arguments passés mais il en faut $1)");
    T$("Parameter '$0' already defined","Le paramètre '$0' est déjà défini");
    T$("Inner function '$0' already defined","La fonction interne '$0' est déjà définie");
    T$("Unknown variable '$0'","La variable '$0' est inconnue");
    T$("Cannot convert to integer: $0","Je ne peux convertir en entier : $0");
    T$("Cannot convert to Number: $0","Je ne peux convertir en Nombre : $0");
    T$("Function '$0' already defined","La fonction '$0' est déjà définie");
    T$("Cannot (yet) evaluate expression of type: $0","Je ne peux (pas encore) évaluer une expression de type: $0");
    T$("Functional argument is not callable","Le premier argument de l'application n'est pas une fonction");
    T$("Dupplicate variable '$0' un $1-expression","La variable '$0' est dupliquée dans l'expression $1");
 
    T$("Evaluation aborpted (termination problem ?)","Evaluation interrompue (problème de terminaison ?)");
    T$("Test case failed: expected value = $0 but computed value = $1","Cas de test invalide : valeur attendue = $0 mais valeur calculée par Mr Scheme = $1");
    T$("Test case failed: expected error but obtained value = $0","Cas de test invalide : erreur attendue mais valeur obtenue par Mr Scheme = $0");
    T$("Test case failed: expected value = $0 but obtained error = $1","Cas de test invalide: valeur attendue = $0 mais erreur obtenue par Mr Scheme = $1");

    // primitive messages
    T$("Primitive '$0' Error","Erreur de primitive '$0'");
    T$("Not a pair","Ce n'est pas une liste non-vide");
    T$("$0 is not a pair","Le $0 n'est pas une liste non-vide");
    T$("Not enough arguments: expected $0 given $1","Il manque des arguments : j'en attends $0 et vous en avez passé $1");
    T$("Too many arguments: expected $0 given $1","Il y a trop d'arguments : j'en attends $0 mais vous en avez passé $1");
    T$("No equality for functions","On ne peut pas tester l'égalité sur des fonctions");
    T$("No equality for primitives","On ne peut pas tester l'égalité sur des primitives");
    T$("Expecting a number","J'attends un nombre");
    T$("Expecting a real number","J'attends un nombre réel");
    T$("Expecting a rational number","J'attends un nombre rationnel");  
    T$("Expecting an integer","J'attends un nombre entier");
    T$("Numeric equality only works for numbers","On ne peut tester l'égalité numérique que sur des nombres (cf. carte de référence)");
    T$("Comparator only works for numbers","Ce comparateur ne fonctionne que sur des nombres (cf. carte de référence)");
    T$("Division by zero","Division par zéro");
    T$("The integer must be strictly positive","L'entier doit être strictement positif");
    T$("A function or primitive is expected","Une fonction ou primitive est attendue");
    T$("The function or primitive should be unary but its arity is $0","La fonction ou la primitive devrait être unaire mais son arité est $0");
    T$("The function or primitive should be unary but its arity is (at least) $0","La fonction ou la primitive devrait être unaire mais son arité est (au moins) $0");
    T$("Expecting a list","J'attends un liste");    
    T$("Expecting a proper list","J'attends un liste bien formée");
    T$("The filter predicate should return a boolean, not a $0","Le prédicat de filter doit retourner un booléen, pas une valeur de type '$0'");
    T$("A functional or primitive predicate is expected","Un prédicat (fonction ou primitive) est attendu");
    T$("The function or primitive should be binary but its arity is $0","La fonction ou la primitive devrait être binaire mais son arité est $0");
    T$("The function or primitive should be binary but its arity is (at least) $0","La fonction ou la primitive devrait être binaire mais son arité est (au moins) $0");
    T$("Expecting an association list","J'attends une liste d'association");
    T$("Equality not supported for type: '$0'","L'égalité n'est pas supportée par le type : '$0'");
    T$("Expecting a string", "J'attends une chaîne de caractères");
    T$("The start index must be positive", "L'indice de début doit être positif");
    T$("The end index must be after start", "L'indice de fin doit être supérieur au début");
    T$("The start index is outside the string","L'indice de début est en dehors de la chaîne");
    T$("The end index is outside the string","L'indice de fin est en dehors de la chaîne");

    // Tree messages
    T$('bin-tree','arbre-bin');
    T$('bt-value','ab-etiquette');
    T$('bt-left','ab-gauche');
    T$('bt-right','ab-droit');

    T$('gen-tree','arbre-gen');
    T$('GTree','ArbreGeneral');
    T$('BEmpty','Arbre binaire vide');
    T$('BTree','Arbre binaire');
    T$('BTreeView','Arbre binaire');
    T$('gt-node', 'ag-noeud');
    T$('gt-value','ag-etiquette');
    T$('gt-forest','ag-foret');
    T$('gt-draw', 'ag-affiche');
    T$("Not a general tree", "Ce n'est pas un arbre général");
    T$("Not a list", "Ce n'est pas une liste");
    T$("Not a list of general trees", "Ce n'est pas une liste d'arbres généraux");
    T$("Not a general tree node","Ce n'est pas un noeud d'arbre général");

    // Image messages
    T$("Expecting an image","J'attends une image");

    // Type messages
    T$("Number","Nombre");
    T$("real","Nombre");  // for LI101
}
