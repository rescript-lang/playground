
import { BSloadText, BsGetPath } from './loader.js'

// https://bucklescript.github.io/bucklescript-playground/?code=cHJpbnRfZW5kbGluZSAiSGVsbG8gQnVja2xlU2NyaXB0ISIKICAgICAgICA=

var codeMirrorDefaultHeight = 10000;
export var myCode1Mirror = CodeMirror.fromTextArea(document.getElementById('ocamlcode#1'), {
  mode: 'text/x-ocaml',
  lineNumbers: true,
  lineWrapping: true,
  styleActiveLine: true,
  theme: "monokai",
  matchBrackets: true,
  autoCloseBrackets: true
});
var jsCode1Mirror = CodeMirror.fromTextArea(document.getElementById('jscode#1'), {
  mode: 'javascript',
  lineNumbers: true,
  readOnly: true,
  lineWrapping: true,
  theme: "monokai",
});

var outputMirror = CodeMirror.fromTextArea(document.getElementById('output'), {
  mode: 'javascript',
  readOnly: true,
  lineWrapping: true,
  lineNumbers: true,
  theme: "monokai"
});
var errorMirror = CodeMirror.fromTextArea(document.getElementById('error'), {
  readOnly: true,
  lineWrapping: true,
  lineNumbers: true,
  theme: "monokai"
});
var PROMPT = "> ";
var log_output = PROMPT;
var ERR_OUTPUT = "Warnings: "
var err_output = ERR_OUTPUT;

function reset_log_output() {
  log_output = PROMPT;
}
function reset_error_output() {
  err_output = ERR_OUTPUT;
}
function get_log_output() {
  var old = log_output;
  reset_log_output();
  return old;
}
function get_error_output() {
  var old = err_output;
  reset_error_output();
  return old;
}
var compile_code;
var evalButton = document.getElementById('option-eval');
var shakeButton = document.getElementById('option-non-export');

function shouldEval() {
  return evalButton.checked;
}
function onEvalButtonChange() {
  if (!shouldEval()) {
    outputMirror.setValue(PROMPT);
  } else {
    onEditChanges();
  }
}
evalButton.addEventListener('change', onEvalButtonChange);

function onShakeButtonChange() {
  if (shakeButton.checked) {
    compile_code = ocaml.shake_compile;
  } else {
    compile_code = ocaml.compile;
  }
  onEditChanges();
}

shakeButton.addEventListener('change', onShakeButtonChange);
var original_log = console.log;
var original_err = console.error;

/**
 * TODO: simulate commonjs in browser
 * */
// var exports = window;

function redirect() {
  log_output = log_output + Array.prototype.slice.apply(arguments).join(' ') + "\n"
}
;
function redirect_err() {
  err_output = err_output + Array.prototype.slice.apply(arguments).join(' ') + "\n"
}
;
myCode1Mirror.setSize(null, codeMirrorDefaultHeight);
outputMirror.setSize(null, 50);
outputMirror.setValue(PROMPT + 'Hello ReScript!');
errorMirror.setSize(null, 50);
errorMirror.setValue(ERR_OUTPUT);


function evalCode(js) {
  console.log = redirect;
  BSloadText(js).then(_ => {
    outputMirror.setValue(get_log_output());
    console.log = original_log;

  }
  ).catch(e => {
    outputMirror.setValue(get_log_output() + "\n" + e);
    console.log = original_log;
  }
  )

}

function createExample(name) {
  var li = document.createElement('li');
  var a = document.createElement('a')
  a.setAttribute('href', '#' + name);
  a.setAttribute('data-key', name);
  a.appendChild(document.createTextNode(name))
  li.appendChild(a)
  return li
}

var examplesDropdown = document.getElementById("examplesDropdown")
var examplesDataSet;


fetch("examples/examples.json").then(function (resp) {
  return resp.json()
}).then(function (response) {
  examplesDataSet = response
  for (var k in examplesDataSet) {
    examplesDropdown.appendChild(createExample(k))
  }
  if (location && location.hash) {
    var id = location.hash.substr(1)
    switchExample(id)
  }
})

//Event handler for examples dropdown
$('#examplesDropdown').click(clickHandler);

function switchExample(id) {
  var filename = "";
  var example = examplesDataSet[id];
  if (example) {
    changeEvalButton(example.eval)
    filename = "examples/" + example.file
  }
  //make ajax request
  $.ajax({
    url: filename,
    cache: true
  }).done(function (response) {
    myCode1Mirror.setValue(response);
  });

  //update dropdown label
  $('#examplesLabel').html(id + ' <span class="caret"></span>');

}

function clickHandler(e) {
  var id = e.target.getAttribute('data-key');
  switchExample(id)
}

function onEditChanges(cm, change) {
  if (typeof compile_code === 'undefined') {
    console.log('init....');
    compile_code = ocaml.compile;
  }
  console.error = redirect_err;
  var raw = compile_code(myCode1Mirror.getValue());
  errorMirror.setValue(get_error_output());
  console.error = original_err;
  console.log(raw);
  var rsp = raw;
  // can we save this from parsing?
  if (rsp.js_code !== undefined) {
    jsCode1Mirror.setValue(rsp.js_code);
    // eval
    if (shouldEval()) {
      evalCode(rsp.js_code)
    }
  } else {
    jsCode1Mirror.setValue(rsp.js_error_msg);

  }

}
myCode1Mirror.on("changes", onEditChanges);

jsCode1Mirror.setSize(null, codeMirrorDefaultHeight);

//checks or unchecks the eval button
function changeEvalButton(bool) {
  $('#option-eval').prop('checked', bool);
  onEvalButtonChange();
}

//creates a gist from OCaml code
$('#share').click(function (e) {
  // var state = $(this).button('loading');
  var request = {
    "description": "BuckleScript Gist",
    "public": true,
    "files": {
      "gist.ml": {
        "content": myCode1Mirror.getValue()
      }
    }
  };
  try 
  {
  var url = BsGetPath('.', document.baseURI) + '/?code=' + btoa(encodeURIComponent((myCode1Mirror.getValue())))
  // state.button('reset');
  $('#shareModal').modal('show');
  $('#shareModalBody').html('<a href=' + '"' + url + '"' + 'target="_blank"' + '>' + url + '</a>');
  } catch(e){
    console.error(e)
  }

});

//copy link to clipboard
var copy = new Clipboard('#copyButton');
copy.on('success', function (e) {
  e.clearSelection();
  $('#copyGlyph').attr('class', 'glyphicon glyphicon-ok');
});

//reset clipboard icon when modal is closed
$('#shareModal').on('hidden.bs.modal', function (e) {
  $('#copyGlyph').attr('class', 'glyphicon glyphicon-copy');
});
