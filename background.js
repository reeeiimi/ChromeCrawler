chrome.runtime.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        var result = [];

        // 項目名を入れる
        var names = Object.keys(msg.scrape);
        result.push(names);
        console.log(result);

        // スクレイピング
        var count = (msg.num) ? msg.num : 10000;
        var num = 0;
        var promise = Promise.resolve();
        promise.then(function loop(count, num) {
            console.log(count);
            chrome.tabs.executeScript(msg.tab, {
                file: "scrape.js"
            }, function() {
                setTimeout(function() {
                    scrape(msg.tab, msg.scrape).then(function(res_s) {
                        // resposeを保存
                        var len = result.length;
                        for (var i = 0; i < res_s.length; i++) {
                            result.push([]);
                            for (var j = 0; j < res_s[i].length; j++) {
                                result[len + i].push(res_s[i][j]);
                                console.log(res_s[i][j]);
                            }
                        }
                        console.log("next")
                        count--;
                        num = countup(num);
                        console.log(num);
                        if (count < 1) {
                            port.postMessage({ res: result, num: num });
                        } else {
                            // 次のページへ
                            jump(msg.tab, msg.jump).then(function(res_j) {
                                if (res_j == "succeed") {
                                    wait(msg.tab, msg.scrape).then(function() {
                                        loop(count, num);
                                    });
                                } else {
                                    /* for (var i = 0; i < result.length; i++) {
                                        for (var j = 0; j < result[i].length; j++) {
                                            console.log(result[i][j]);
                                        }
                                    } */
                                    port.postMessage({ res: result, num: num });
                                }
                            });
                        }
                    });
                }, 2000);
            });
        }(count, num));
    });
});

// スクレイピング命令をScrape.jsに飛ばす
function scrape(tab, msg) {
    return new Promise(function(resolve) {
        chrome.tabs.sendMessage(tab, { method: "scrape", message: msg }, function(response) {
            var res = response.response;
            var result = [];
            for (var i = 0; i < res.length; i++) {
                for (var j = 0; j < res[i].length; j++) {
                    if (i == 0) {
                        result.push([]);
                    }
                    result[j].push(res[i][j]);
                }
            }
            resolve(result);
        });
    });
}

// ページ送り命令をScrape.jsに飛ばす
function jump(tab, msg) {
    return new Promise(function(resolve) {
        chrome.tabs.sendMessage(tab, { method: "jump", query: msg.query, class: msg.class }, function(response) {
            resolve(response.response);
        });
    });
}

// ページのロードをまつ
function wait(tab, msg) {
    return new Promise(function(resolve) {
        chrome.tabs.sendMessage(tab, { method: "wait" }, function(response) {
            setTimeout(() => {
                resolve(true);
            }, 1000);
        });
    });
}

function countup(count) {
    return count + 1;
}