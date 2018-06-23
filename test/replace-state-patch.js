function getRunnerWindow() {
  var lastWindow;
  var newWindow = window;

  while (lastWindow != newWindow) {
    lastWindow = newWindow;
    newWindow = newWindow.parent;
  }

  return newWindow;
}

var runnerWindow = getRunnerWindow();
/**
 * Patches window.History.prototype.replaceState to count the number of times
 * it has been called in `runnerWindow.replaceStateCount`
 */
function patchReplaceState() {
  if (typeof runnerWindow.replaceStateCount !== 'number') {
    runnerWindow.replaceStateCount = 0;
  }

  var native = window.History.prototype.replaceState;

  function patch() {
    runnerWindow.replaceStateCount += 1;
    return native.apply(window.history, arguments);
  }

  window.History.prototype.replaceState = patch;
}

window.cooldownFunction =
    function(done) {
  return new Promise(function(res) {
    if (done) {
      done();
    };
    res();
  });
}

var isChrome =
    /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
var isSafari = /^Apple/.test(navigator.vendor);

if (isChrome || isSafari) {
  window.cooldownFunction = function(done, force) {
    var resolve;
    // this is for setups that return promises
    var cooledDown = new Promise(function(res) {
                       resolve = res;
                     }).then(function() {
      if (done) {
        done();
      }
    });

    if (runnerWindow.replaceStateCount > 85 || force) {
      var cooldownPeriod = 30 * 1000;
      this.timeout(cooldownPeriod + 5000);

      var cooldownMessage = document.querySelector('#safari-cooldown');
      cooldownMessage.removeAttribute('hidden');

      setTimeout(function() {
        cooldownMessage.setAttribute('hidden', 'hidden');
        runnerWindow.replaceStateCount = 0;

        resolve();
      }, cooldownPeriod);
    } else {
      resolve();
    }

    return cooledDown;
  };

  patchReplaceState();
}
