

//@ts-check

// @ts-ignore
window.process = { env: { NODE_ENV: 'dev' } }


// local to getPath
var relativeElement = document.createElement("a");
var baseElement = document.createElement("base");
document.head.appendChild(baseElement);

export function BsGetPath(id, parent) {
    var oldPath = baseElement.href
    baseElement.href = parent
    relativeElement.href = id
    var result = relativeElement.href
    baseElement.href = oldPath
    return result
}
/**
 * 
 * Given current link and its parent, return the new link
 * @param {string} id 
 * @param {string} parent 
 * @return {string}
 */
function getPathWithJsSuffix(id, parent) {
    var oldPath = baseElement.href
    baseElement.href = parent
    relativeElement.href = id
    var result = addSuffixJsIfNot(relativeElement.href)
    baseElement.href = oldPath
    return result
}

/**
 * 
 * @param {string} x 
 */
function addSuffixJsIfNot(x) {
    if (x.endsWith('.js')) {
        return x
    } else {
        return x + '.js'
    }
}


var falsePromise = Promise.resolve(false)
// package.json semantics
// a string to module object 
// from url -> module object 
// Modules : Map<string, Promise < boolean | string > 
// fetch the link:
// - if it is already fetched before, return the stored promise
//   otherwise create the promise which will be filled with the text if successful
//   or filled with boolean false when failed
var MODULES = new Map()
function cachedFetch(link) {
    var linkResult = MODULES.get(link)
    if (linkResult) {
        return linkResult
    } else {
        var p = fetch(link)
            .then(resp => {
                if (resp.ok) {
                    return resp.text()
                } else {
                    return falsePromise
                }
            })

        MODULES.set(link, p)
        return p
    }
}

// from location id -> url 
// There are two rounds of caching:
// 1. if location and relative path is hit, no need to run 
// 2. if location and relative path is not hit, but the resolved link is hit, no need 
//     for network request
/**
 * @type {Map<string, Map<string, Promise<any> > > }
 */
var IDLocations = new Map()

/**
 * @type {Map<string, Map<string, any> > }
 */
var SyncedIDLocations = new Map()
// Its value is an object 
// { link : String }
// We will first mark it when visiting (to avoid duplicated computation)
// and populate its link later

/**
 * 
 * @param {string} id 
 * @param {string} location 
 */
function getIdLocation(id, location) {
    var idMap = IDLocations.get(location)
    if (idMap) {
        return idMap.get(id)
    }
}

/**
 * 
 * @param {string} id 
 * @param {string} location 
 */
function getIdLocationSync(id, location) {
    var idMap = SyncedIDLocations.get(location)
    if (idMap) {
        return idMap.get(id)
    }
}

function countIDLocations() {
    var count = 0
    for (let [k, vv] of IDLocations) {
        for (let [kv, v] of vv) {
            count += 1
        }
    }
    console.log(count, 'modules loaded')
}


/**
 * 
 * @param {string} id 
 * @param {string} location 
 * @param {Function} cb 
 * @returns Promise<any>
 */
function visitIdLocation(id, location, cb) {
    var result;
    var idMap = IDLocations.get(location)
    if (idMap && (result = idMap.get(id))) {
        return result
    }
    else {
        result = new Promise(resolve => {
            return (cb()).then(res => {
                var idMap = SyncedIDLocations.get(location)
                if (idMap) {
                    idMap.set(id, res)
                } else {
                    SyncedIDLocations.set(location, new Map([[id, res]]))
                }
                return resolve(res)
            })
        })
        if (idMap) {
            idMap.set(id, result)
        }
        else {
            IDLocations.set(location, new Map([[id, result]]))
        }
        return result
    }
}



/**
 * 
 * @param {string} text 
 * @return {string[]}
 */
function getDeps(text) {
    var deps = []
    text.replace(/(\/\*[\w\W]*?\*\/|\/\/[^\n]*|[.$]r)|\brequire\s*\(\s*["']([^"']*)["']\s*\)/g, function (_, ignore, id) {
        if (!ignore) deps.push(id);
    });
    return deps;
}



// By using a named "eval" most browsers will execute in the global scope.
// http://www.davidflanagan.com/2010/12/global-eval-in.html
var globalEval = eval;

// function parentURL(url) {
//     if (url.endsWith('/')) {
//         return url + '../'
//     } else {
//         return url + '/../'
//     }
// }



// loader.js:23 http://localhost:8080/node_modules/react-dom/cjs/react-dom.development.js/..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//../ fbjs/lib/containsNode Promise {<pending>}
// 23:10:02.884 loader.js:23 http://localhost:8080/node_modules/react-dom/cjs/react-dom.development.js/..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//..//../ fbjs/lib/invariant Promise {<pending>}

// In the beginning
// it is `resolveModule('./main.js', '')
// return the promise of link and text 
/**
 * 
 * @param {string} id 
 * @param {string} parent 
 * can return Promise <boolean | object>, false means
 * this module can not be resolved
 */
function getModulePromise(id, parent) {
    var done = getIdLocation(id, parent)
    if (!done) {
        return visitIdLocation(id, parent, async () => {
            if (id[0] != '.') { // package path
                var link = getPathWithJsSuffix('./node_modules/' + id, parent)
                var text = await cachedFetch(link)
                if (text !== false) {
                    return { text, link }
                } else if (!id.endsWith('.js')) {
                    var link = getPathWithJsSuffix(`./node_modules/` + id + `/index.js`, parent)
                    var text = await cachedFetch(link)
                    if (text !== false) {
                        return { text, link }
                    } else {
                        return getParentModulePromise(id, parent)
                    }

                } else {
                    return getParentModulePromise(id, parent)
                }
            } else { // relative path, one shot resolve            
                let link = getPathWithJsSuffix(id, parent)
                var text = await cachedFetch(link)
                if (text !== false) {
                    return { text, link }
                } else {
                    throw new Error(` ${id} : ${parent} could not be resolved`)
                }
            }
        })
    } else {
        return done
    }
}
/**
 * 
 * @param {string} id 
 * @param {string} parent 
 */
function getParentModulePromise(id, parent) {
    var parentLink = BsGetPath('..', parent)
    if (parentLink === parent) {
        return falsePromise
    }
    return getModulePromise(id, parentLink)
}

/**
 * 
 * @param {string} id 
 * @param {string} parent 
 * @returns {Promise<any>}
 */
function getAll(id, parent) {
    return getModulePromise(id, parent)
        .then(function (obj) {
            if (obj) {
                var deps = getDeps(obj.text)
                return Promise.all(deps.map(x => getAll(x, obj.link)))
            } else {
                throw new Error(`${id}@${parent} was not resolved successfully`)
            }
        })
};

/**
 * 
 * @param {string} text 
 * @param {string} parent 
 * @returns {Promise<any>}
 */
function getAllFromText(text, parent) {
    var deps = getDeps(text)
    return Promise.all(deps.map(x => getAll(x, parent)))
}

function loadSync(id, parent) {
    var baseOrModule = getIdLocationSync(id, parent)
    if (baseOrModule) {
        if (!baseOrModule.exports) {
            baseOrModule.exports = {}
            globalEval(`(function(require,exports,module){${baseOrModule.text}\n})//# sourceURL=${baseOrModule.link}`)(
                function require(id) {
                    return loadSync(id, baseOrModule.link);
                }, // require
                baseOrModule.exports = {}, // exports
                baseOrModule // module
            );
        }
        return baseOrModule.exports
    } else {
        throw new Error(`${id} : ${parent} could not be resolved`)
    }
}


function genEvalName() {
    return "eval-" + (("" + Math.random()).substr(2, 5))
}
/**
 * 
 * @param {string} text 
 * @param {string} link
 * In this case [text] evaluated result will not be cached
 */
function loadTextSync(text, link) {
    // var link = getPath(".", document.baseURI)
    var baseOrModule = { exports: {}, text, link }
    globalEval(`(function(require,exports,module){${baseOrModule.text}\n})//# sourceURL=${baseOrModule.link}/${genEvalName()}.js`)(
        function require(id) {
            return loadSync(id, baseOrModule.link);
        }, // require
        baseOrModule.exports, // exports
        baseOrModule // module
    );
}



 function load(id, parent) {
    return getAll(id, parent).then(function(){
        loadSync(id, parent)
    })
    
};

/**
 * 
 * @param {string} text 
 */
export function BSloadText(text) {
    var parent = BsGetPath(".", document.baseURI)
    return getAllFromText(text, parent).then(function(){
        loadTextSync(text, parent)
    })    
}

