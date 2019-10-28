chrome.runtime.onMessage.addListener(async function(msg, sender, sendResponse) {
    console.log(msg.method);
    console.log(msg)
    var res = new Promise(function(resolve) {
        if (msg.method == "scrape") {
            console.log(msg.message)
            var names = Object.keys(msg.message);
            if (names) {
                // ーーーーー 値が存在しない場所の処理（「-」とかになっていればよいけどそうじゃない場合がある)
                var result = [];
                // 項目名とセレクタを保存
                var selectors = [];
                var linkchecks = [];
                var count = 0;
                for (var i = 0; i < names.length; i++) {
                    if (names[i] != "") {
                        if (names[i] == "method") continue;
                        count += 1;
                        // 最後が子要素 nth-child の場合は残す
                        var replaceCheck = msg.message[names[i]][0].match(/:nth-child\(\d*\)$/);
                        var val = msg.message[names[i]][0].replace(/:nth-child\(\d*\)/g, "");
                        val += replaceCheck;
                        linkchecks.push(msg.message[names[i]][1]);
                        selectors.push(val);
                    }
                }
                // query
                // 要素の位置で対応付けて空白の位置を抽出
                for (var i = 0; i < count; i++) {
                    var el = document.querySelectorAll(selectors[i]);
                    result.push([]);
                    if (el) {
                        if (linkchecks[i]) {
                            for (var j = 0; j < el.length; j++) {
                                if (el[j].hasAttribute("href")) {
                                    var val = el[j].getAttribute("href");
                                    result[i].push(val);
                                } else {
                                    alert(names[i] + "のセレクタにリンクは存在しません。")
                                }
                            }
                        } else {
                            for (var j = 0; j < el.length; j++) {
                                var val = el[j].textContent;
                                val = val.replace(",", "");
                                result[i].push(val);
                            }
                        }
                    }
                }
                console.log(result);
                resolve({ response: result });
            } else {
                resolve({ response: "No entries..." });
            }

        } else if (msg.method == "jump") {
            if (msg.query) {
                //var selector = msg.url.replace(/:nth-child\(\d*\)/g, "") + "." + msg.class.replace(" ", ".");
                //console.log(selector);
                var a = new Promise((resolve) => {
                    if (msg.query == "selector") {
                        resolve(document.querySelectorAll(msg.class.replace(/:nth-child\(\d*\)/g, ""))[0]);
                    } else if (msg.query == "class") {
                        resolve(document.getElementsByClassName(msg.class.replace(/:nth-child\(\d*\)/g, ""))[0]);
                    } else {
                        resolve(document.getElementById(msg.class.replace(/:nth-child\(\d*\)/g, "")));
                    }
                });
                var resp;
                a.then(function(a) {
                    console.log(a);
                    if (!a) {
                        resolve({ response: "no element" });
                    } else {
                        resolve({ response: "succeed" });
                        a.click();
                    }
                });
            } else {
                resolve({ response: "none" });
            }

        } else if (msg.method == "wait") {
            addEventListener("DOMContentLoaded", resolve(true));

        } else {
            resolve({ response: "no method" });
        }
    });
    res.then(function(res) {
        sendResponse(res);
    });
    return true;
});