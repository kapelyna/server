const Pool = require('pg').Pool
const pool = new Pool({
    user:'postgres',
    password:'1',
    host:'localhost',
    port:'5431',
    database:'123'
})

module.exports = pool