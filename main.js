document.addEventListener("DOMContentLoaded", function() {
    // GETボタン押下時のイベントリスナーを作成
    document.getElementById("ChromePlugin-DoScrape").addEventListener("click", function() {
        var result = [];

        // 入力されたセレクタを取得、nullや空文字であればエラー
        var selector = document.getElementsByClassName("ChromePlugin-Selector");
        var selectors = [];
        var linkcheck = document.getElementsByClassName("ChromePlugin-link");
        var linkchecks = [];
        for (var i = 0; i < selector.length; i++) {
            if (selector[i].value != "") {
                selectors.push(selector[i].value);
                linkchecks.push(linkcheck[i].checked)
            }
        }
        if (selectors.length <= 0) {
            alert("Please set a selector...");
            return;
        }
        var name = document.getElementsByClassName("ChromePlugin-SelectorName");
        var names = []
        for (var i = 0; i < name.length; i++) {
            if (name[i].value != "") {
                names.push(name[i].value);
            }
        }

        // 現在のタブ(Getボタンが押されたタブ)を取得する（配列で戻るので、0番目を取得）
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            var nextPageClass = document.getElementById("ChromePlugin-NextPageClass").value;
            var nextPageSelector = document.getElementById("ChromePlugin-NextPageSelector").value;
            var nextPageId = document.getElementById("ChromePlugin-NextPageId").value;
            var query
            var nextPage
            if (nextPageClass != "") {
                query = "class";
                nextPage = nextPageClass;
            } else if (nextPageSelector != "") {
                query = "selector";
                nextPage = nextPageSelector;
            } else {
                query = "id";
                nextPage = nextPageId;
            }

            var pageNum = document.getElementById("ChromePlugin-PageNum").value;
            var messageObj = {};
            for (var i = 0; i < selectors.length; i++) {
                if (selectors[i] != "") {
                    messageObj[names[i]] = [selectors[i], linkchecks[i]];
                }
            }
            console.log(messageObj);

            // バックグラウンドを実行
            var port = chrome.runtime.connect({ name: "scraper" });
            port.postMessage({ tab: tabs[0].id, scrape: messageObj, jump: { query: query, class: nextPage }, num: pageNum });
            port.onMessage.addListener(function(response) {
                console.log(response)
                var disp = document.getElementById("ChromePlugin-ResultDisp");
                var label = document.createElement("label");
                label.innerText = "全" + response.num + "ページ";
                disp.appendChild(label)
                displayResult(response.res);
                saveResult(response.res);
                alert("Complete！");
            });
        });
    });

    // Add Selectorボタンが押されたら入力ボックスを追加する
    document.getElementById("ChromePlugin-AddSelector").addEventListener("click", function(event) {
        var el = document.getElementById("ChromePlugin-InputArea");
        var p = document.createElement("p");

        var check = document.createElement("input");
        check.type = "checkbox"
        check.classList.add("ChromePlugin-link");
        p.appendChild(check);

        var name = document.createElement("input");
        name.classList.add("ChromePlugin-SelectorName");
        p.appendChild(name);

        var label = document.createElement("label");
        label.textContent = "："
        p.appendChild(label);

        var sel = document.createElement("input");
        sel.classList.add("ChromePlugin-Selector");
        p.appendChild(sel);

        el.appendChild(p);
    });

    // Remove Selector ボタンが押されたら入力ボックスを削除する
    document.getElementById("ChromePlugin-RemoveSelector").addEventListener("click", function(event) {
        var el = document.getElementById("ChromePlugin-InputArea");
        var last_p = el.lastElementChild;
        el.removeChild(last_p);
    });
});

// 結果表示
function displayResult(result) {
    var disp = document.getElementById("ChromePlugin-ResultDisp");
    var table = document.createElement("table");
    var tr = [];
    for (var i = 0; i < result.length; i++) {
        tr.push(document.createElement("tr"));
        tr[i].classList.add("ChromePlugin-Result");
        var td = [];
        for (var j = 0; j < result[i].length; j++) {
            td.push(document.createElement("td"));
            td[j].classList.add("ChromePlugin-ResultData");
            td[j].innerText = result[i][j];
            tr[i].appendChild(td[j]);
        }
        delete td;
        table.appendChild(tr[i]);
    }
    disp.appendChild(table);
}

function saveResult(result) {
    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth() + 1;
    var day = d.getDate();
    var hour = d.getHours();
    var min = d.getMinutes();
    var sec = d.getSeconds();
    var filename = "scraped_" + year + month + day + hour + min + sec;
    var content = ""
    for (var i = 0; i < result.length; i++) {
        for (var j = 0; j < result[i].length; j++) {
            content += result[i][j];
            if (j + 1 != result[i].length) content += ",";
        }
        if (i + 1 != result.length) content += "\n";
    }

    var bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    var blob = new Blob([bom, content], { "type": "text/csv" });

    var link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = decodeURI(filename + ".csv");
    link.type = "text/csv";

    link.click();


}