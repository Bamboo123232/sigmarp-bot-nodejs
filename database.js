const mysql = require('mysql');
const config = require('./config');

let db1;

let firstConnection1 = true;

function createDBConnection1() {
    db1 = mysql.createConnection({
        host: config.host,
        port: 3306,
        user: config.user,
        password: config.password,
        database: config.db_name,
        charset: 'utf8_general_ci'
    });

    db1.connect((error) => {
        if (error) {
            console.error('[BAZA MYSQL] - Wystąpił błąd podczas łączenia z bazą danych, błąd:', error);
        } else {
            if (firstConnection1) {
                console.log('[BAZA MySQL] - Pomyślnie nawiązano połączenie z bazą danych.');
                firstConnection1 = false;
            }
        }
    });

    return db1;
}

function keepDBAlive1() {
    db1.query('SET character_set_results=utf8mb4', (error) => {
        if (error) {
            console.log('[BAZA MYSQL] - Błąd połączenia z bazą danych, ponowne łączenie...');
            if (db1) {
                db1.destroy();
            }
            createDBConnection1();
        }
    });
}

function getDBConnection1() {
    if (!db1) {
        createDBConnection1();
    }
    return db1;
}

module.exports = {
    createDBConnection1,
    keepDBAlive1,
    getDBConnection1,
};