
// http://localhost:8081/?gist=660571356ec5eb1da7fad67f1daef979
function contentFromResponse(gist) {
    fetch( 'https://api.github.com/gists/' + gist)
    .then(resp => resp.json())
    .then(function(resp) {
        var files = resp.files;
        var content = [];
        for (var file in files) {
            content.push(files[file].content)
        }
        if (content.length > 0) {
            myCode1Mirror.setValue(content[0])
        }
    });
}
;
function queryGist() {
    var qd = {};
    location.search.substr(1).split("&").forEach(function(item) {
        var s = item.split("=")
          , k = s[0]
          , v = s[1] && decodeURIComponent(s[1]);
        (k in qd) ? qd[k].push(v) : qd[k] = [v]
    });
    if (qd.gist) {
        if (qd.gist[0]) {
            return qd.gist[0].replace(/^\/+|\/+$/gm, '');
        } else {
            return qd.gist.replace(/^\/+|\/+$/gm, '');
        }
    } else {
        return undefined
    }

}
function loadGist() {
    var gist = queryGist()
    if (gist) {
        contentFromResponse(gist)
    }
}

