const db = require('../config/database');
const bcrypt = require('bcrypt');

function createDatabaseAndTable() {
    db.query("CREATE DATABASE IF NOT EXISTS nbi_users", (err) => {
        if (err) {
            console.error("Error creating database:", err);
            return;
        }
        console.log("Database 'nbi_users' ensured.");
        db.changeUser({ database: 'nbi_users' }, (err) => {
            if (err) {
                console.error("Error switching to database 'nbi_users':", err);
                return;
            }

            const createUsersTableQuery = `
                CREATE TABLE IF NOT EXISTS users (
                    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
                    user_id VARCHAR(250),
                    firstname VARCHAR(250),
                    lastname VARCHAR(250),
                    age INT,
                    gender VARCHAR(250),
                    contact_num VARCHAR(250),
                    email VARCHAR(250) UNIQUE,
                    sitio VARCHAR(250),
                    barangay VARCHAR(250),
                    province VARCHAR(250),
                    roles VARCHAR(250),
                    verification_token VARCHAR(250),
                    verified TINYINT(1) DEFAULT 0,
                    token_expiry DATETIME,
                    password VARCHAR(250),
                    status VARCHAR(50) DEFAULT 'Active',
                    profile_pic VARCHAR(250) DEFAULT NULL 
                )
            `;
            db.query(createUsersTableQuery, (err) => {
                if (err) console.error('Error creating users table:', err);
                else console.log('Users table ensured.');
            });

            const createLogsTableQuery = `
                CREATE TABLE IF NOT EXISTS logs (
                    id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
                    user_id VARCHAR(250),
                    role VARCHAR(50),
                    firstname VARCHAR(250),
                    lastname VARCHAR(250),
                    login_time DATETIME,
                    logout_time DATETIME,
                    status TINYINT(1) DEFAULT 1
                )
            `;
            db.query(createLogsTableQuery, (err) => {
                if (err) console.error('Error creating logs table:', err);
                else console.log('Logs table ensured.');
            });

            const createUploadsTableQuery = `
                CREATE TABLE IF NOT EXISTS uploads (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(250),
                    case_title VARCHAR(255) NOT NULL,
                    concern TEXT NOT NULL,
                    date_sent DATE NOT NULL,
                    date_of_need DATE NOT NULL,
                    file_path VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;
            db.query(createUploadsTableQuery, (err) => {
                if (err) console.error('Error creating uploads table:', err);
                else console.log('Uploads table ensured.');
            });
        });
    });
}

createDatabaseAndTable();


const User = {
    // Find user by email
    findByEmail: (email, callback) => {
        const query = 'SELECT * FROM users WHERE email = ?';
        db.query(query, [email], (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results[0]);
        });
    },

    // Find user by user_id (fetch role as well)
    findByUserId: (user_id, callback) => {
        const query = 'SELECT * FROM users WHERE user_id = ?';
        db.query(query, [user_id], (err, results) => {
            if (err) return callback(err, null);
            if (results.length === 0) return callback(null, null);
            return callback(null, results[0]); // Return user details including role
        });
    },

    // Find user by verification token
    findByVerificationToken: (token, callback) => {
        const query = 'SELECT * FROM users WHERE verification_token = ?';
        db.query(query, [token], (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results[0]);
        });
    },

    // Create a new user
    create: (userData, callback) => {
        const query = `
            INSERT INTO users (user_id, firstname, lastname, age, gender, contact_num, email, 
            sitio, barangay, province, roles, verification_token, verified, token_expiry, password, profile_pic) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(query, userData, (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results);
        });
    },

    // Verify a user by setting verified status and clearing the token
    verifyUser: (userId, callback) => {
        const query = 'UPDATE users SET verified = 1, verification_token = NULL, token_expiry = NULL WHERE id = ?';
        db.query(query, [userId], (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results);
        });
    },

    // Update user status
    setStatus: (userId, status, callback) => {
        const query = 'UPDATE users SET status = ? WHERE id = ?';
        db.query(query, [status, userId], (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results);
        });
    },

    // Log user login
    logUserLogin: (userDetails, callback) => {
        const { user_id, role, firstname, lastname } = userDetails;
        const login_time = new Date();
        const status = 1; // 1 for login

        const query = 'INSERT INTO logs (user_id, role, firstname, lastname, login_time, status) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [user_id, role, firstname, lastname, login_time, status];

        db.query(query, values, (err, results) => {
            if (err) {
                return callback(err);
            }
            callback(null, results);
        });
    },

    // Log user logout
    logUserLogout: (user_id, callback) => {
        const logout_time = new Date();
        const status = 0; // 0 for logout

        const query = 'UPDATE logs SET logout_time = ?, status = ? WHERE user_id = ? AND status = 1 ORDER BY login_time DESC LIMIT 1';
        const values = [logout_time, status, user_id];

        db.query(query, values, (err, results) => {
            if (err) {
                return callback(err);
            }
            callback(null, results);
        });
    },

    // Update password
    updatePassword: (userId, newPassword, callback) => {
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) return callback(err);
            const query = 'UPDATE users SET password = ? WHERE id = ?';
            db.query(query, [hashedPassword, userId], (err, results) => {
                if (err) return callback(err);
                return callback(null, results);
            });
        });
    },

    addUpload: (uploadData, callback) => {
        const query = `
            INSERT INTO uploads (user_id, case_title, concern, date_sent, date_of_need, file_path)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        db.query(query, uploadData, (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results);
        });
    },

    getLogs: () => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM logs ORDER BY login_time DESC';
            db.query(query, (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });
    },
};

module.exports = User;
