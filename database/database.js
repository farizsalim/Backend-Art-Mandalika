const mysql = require('mysql2/promise'); // Mengimpor versi Promise dari mysql2

const db = mysql.createPool({
    host: 'localhost',      
    user: 'root',            
    password: '',            
    database: 'artmandalika' 
});

// Tes koneksi ke database
(async () => {
    try {
        const connection = await db.getConnection();
        console.log('Terhubung ke database MySQL');
        connection.release(); // Pastikan untuk melepaskan koneksi setelah digunakan
    } catch (err) {
        console.error('Koneksi ke database gagal: ' + err.message);
    }
})();

module.exports = db;
