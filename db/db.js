const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'chat',
    password: 'Busra!keles!1',
    port: 5432, 
});


const createUserTable = async() => {
    
    try {

        const queryText = `CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            email VARCHAR(100) NOT NULL,
            passport VARCHAR(100) UNIQUE NOT NULL
         );`

         await pool.query(queryText)
         console.log('Table created successfully')

    } catch(e) {
        console.error(`Error executing query ${e.stack}`)
    }
}

const createMessagesTable = async() => {

    const queryText = `CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        recipient_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (recipient_id) REFERENCES users(id)
      );`

      await pool.query(queryText)
      console.log('Messages table created successfully')
}

createUserTable()
createMessagesTable()

module.exports = {
    query: (text, params) => pool.query(text, params),
  };