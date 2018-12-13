(function (window) {

    function search(query, users) {
        var keymaps  = window.VKSearch.keymaps;
        var translit = window.VKSearch.translit;
        var result;
        if (query && query.length) {
            var querydirect                         = query.replace(" ", "").toLowerCase();
            var querySwitchKeymap                   = _switchKeymap(query, keymaps).toLowerCase();
            var queryTranslit                       = translit.rusToEng(query).toLowerCase();
            var queryTranslitRevese                 = translit.engToRus(query).toLowerCase();
            var querySwitchKeymapAndTranslit        = translit.rusToEng(_switchKeymap(query, keymaps).toLowerCase());
            var querySwitchKeymapAndTranslitReverse = translit.engToRus(_switchKeymap(query, keymaps).toLowerCase());
            var weight_1                            = [];
            var weight_2                            = [];
            var weight_3                            = [];
            var weight_4                            = [];
            for (var i = 0; i < users.length; i++) {
                if (_compare(users[i], querydirect)) {
                    weight_1.push(users[i]);
                } else if (_compare(users[i], querySwitchKeymap)) {
                    weight_2.push(users[i]);
                } else if ( (queryTranslit !== querydirect && _compare(users[i], queryTranslit)) ||
                    (queryTranslitRevese !== querydirect && _compare(users[i], queryTranslitRevese))) {
                    weight_3.push(users[i]);
                } else if (_compare(users[i], querySwitchKeymapAndTranslit) || _compare(users[i], querySwitchKeymapAndTranslitReverse)) {
                    weight_4.push(users[i]);
                }
            }
            result = weight_1.concat(weight_2, weight_3, weight_4);
        } else {
            result = users;
        }

        return result;
    }
    
    function searchQuery(params) {
        return makeRequest('GET', withQueryParams('/users', params))
            .then(function (response) {
                return JSON.parse(response);
            })
            .catch(function (err) {
                console.error('Server-side search attempt returned error.', err.statusText);
            });
    }

    function withQueryParams(url, params) {
        var serialize = function(obj, prefix) {
            var str = [],
                p;
            for (p in obj) {
                if (obj.hasOwnProperty(p)) {
                    var k = prefix ? prefix + "[" + p + "]" : p,
                        v = obj[p];
                    str.push((v !== null && typeof v === "object") ?
                        serialize(v, k) :
                        encodeURIComponent(k) + "=" + encodeURIComponent(v));
                }
            }
            return str.join("&");
        };

        return url + '?' + serialize(params);
    }

    function makeRequest (method, url) {
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.onload = function () {
                if (this.status >= 200 && this.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject({
                        status: this.status,
                        statusText: xhr.statusText
                    });
                }
            };
            xhr.onerror = function () {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            };
            xhr.send();
        });
    }

    //Helpers

    function _compare(d, q) {
        return (d.name+d.surname).toLowerCase().indexOf(q) > -1;
    }

    function _switchKeymap(query, keymaps) {
        var q = [];
        for (var i in query) {
            q.push(keymaps.engToRus[query[i]] || keymaps.rusToEng[query[i]] || query[i]);
        }
        return q.join("")
    }

    if(!window.VKSearch) window.VKSearch = {};
    window.VKSearch.searchLocal = search;
    window.VKSearch.searchRemote = searchQuery;
})(window);