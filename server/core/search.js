let users    = require('../data/users');
let keymaps  = require('./keymap');
let translit = require('./translit');

function search(query, offset, count) {
    let hrstart = process.hrtime();
    let result;
    if (query && query.length) {
        let querydirect                         = query.replace(" ", "").toLowerCase();
        let querySwitchKeymap                   = _switchKeymap(query).toLowerCase();
        let queryTranslit                       = translit.rusToEng(query).toLowerCase();
        let queryTranslitRevese                 = translit.engToRus(query).toLowerCase();
        let querySwitchKeymapAndTranslit        = translit.rusToEng(_switchKeymap(query).toLowerCase());
        let querySwitchKeymapAndTranslitReverse = translit.engToRus(_switchKeymap(query).toLowerCase());
        let weight_1                            = [];
        let weight_2                            = [];
        let weight_3                            = [];
        let weight_4                            = [];
        for (let i = 0; i < users.length; i++) {
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

    return {
        totalCount         : result.length,
        offset             : offset,
        count              : count,
        searchExecutionTime: process.hrtime(hrstart)[1]/1000000 + "ms",
        data               : result.slice(offset, offset+count)
    }

}

//Helpers

function _compare(d, q) {
    return (d.name+d.surname+d.domain).toLowerCase().indexOf(q) > -1;
}

function _switchKeymap(query) {
    let q = [];
    for (let i in query) {
        q.push(keymaps.engToRus[query[i]] || keymaps.rusToEng[query[i]] || query[i]);
    }
    return q.join("")
}

module.exports = search;