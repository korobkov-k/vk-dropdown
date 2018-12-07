let express = require('express');
let search  = require('../core/search');
let router  = express.Router();

/* GET users listing. */
router.get('/', function (req, res, next) {
    let offset = parseInt(req.query['offset']);
    if (isNaN(offset)) {
        offset = 0;
    }

    let count = parseInt(req.query['count']);
    if (isNaN(count)) {
        count = 10;
    }

    let query = req.query['search'] || null;

    let results = search(query, offset, count);

    res.send(results);
});

module.exports = router;
