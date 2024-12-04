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

            // Create Users Table
            const createUsersTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                user_id VARCHAR(250) PRIMARY KEY, -- Set user_id as PRIMARY KEY
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
        
        // Create Logs Table
        const createLogsTableQuery = `
            CREATE TABLE IF NOT EXISTS logs (
                id INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
                user_id VARCHAR(250),
                role VARCHAR(50),
                firstname VARCHAR(250),
                lastname VARCHAR(250),
                login_time DATETIME,
                logout_time DATETIME,
                status TINYINT(1) DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `;
        db.query(createLogsTableQuery, (err) => {
            if (err) console.error('Error creating logs table:', err);
            else console.log('Logs table ensured.');
        });
        
        // Create Uploads Table
        const createUploadsTableQuery = `
            CREATE TABLE IF NOT EXISTS uploads (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(250),
                case_title VARCHAR(255) NOT NULL,
                concern TEXT NOT NULL,
                date_sent DATE NOT NULL,
                date_of_need DATE NOT NULL,
                file_path VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `;
        db.query(createUploadsTableQuery, (err) => {
            if (err) console.error('Error creating uploads table:', err);
            else console.log('Uploads table ensured.');
        });
        
        // Create Admin Cases Table
        const createAdmincaseTableQuery = `
            CREATE TABLE IF NOT EXISTS admin_cases (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                user_id VARCHAR(250) NOT NULL,
                description TEXT,
                file_path VARCHAR(255),
                created_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `;
        db.query(createAdmincaseTableQuery, (err) => {
            if (err) console.error('Error creating admin_cases table:', err);
            else console.log('Admin cases table ensured.');
        });
        
        // Create Reports Table
        const createReportsTableQuery = `
            CREATE TABLE IF NOT EXISTS reports (
                report_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(250) NOT NULL,
                firstname VARCHAR(100) NOT NULL,
                lastname VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                inquiry_type ENUM('application', 'technical', 'payment', 'other') NOT NULL,
                reference VARCHAR(255),
                message TEXT NOT NULL,
                status ENUM('pending', 'resolved') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `;
        db.query(createReportsTableQuery, (err) => {
            if (err) console.error('Error creating reports table:', err);
            else console.log('Reports table ensured.');
        });
        });

        const createTrashTableQuery = `
            CREATE TABLE IF NOT EXISTS trash (
                id INT AUTO_INCREMENT PRIMARY KEY,
                original_table VARCHAR(50) NOT NULL,
                original_id INT NOT NULL,
                user_id VARCHAR(250) NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                file_path VARCHAR(255),
                created_at DATETIME,
                deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            )
        `;
        db.query(createTrashTableQuery, (err) => {
            if (err) console.error('Error creating trash table:', err);
            else console.log('Trash table ensured.');
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

    getAllUsers: (callback) => {
        const query = 'SELECT user_id, firstname, lastname, email, contact_num, roles FROM users';
        db.query(query, (err, results) => {
          if (err) return callback(err, null);
          return callback(null, results);
        });
    },

    getAllUploads: (callback) => {
        const query = `
            SELECT uploads.*, users.user_id, users.firstname, users.lastname
            FROM uploads
            LEFT JOIN users ON uploads.user_id = users.user_id
            ORDER BY uploads.created_at DESC
        `;
        db.query(query, (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results);
        });
    },

    getUserUploads: (userId, callback) => {
        const query = 'SELECT * FROM uploads WHERE user_id = ? ORDER BY created_at DESC';
        db.query(query, [userId], (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results);
        });
    },
    
    
    updateProfile: (userId, updatedData, callback) => {
        const query = `
            UPDATE users 
            SET firstname = ?, lastname = ?, gender = ?, contact_num = ?, 
               sitio = ?, barangay = ?, province = ?
            WHERE user_id = ?
        `;
        const values = [
            updatedData.firstname, updatedData.lastname, updatedData.gender, updatedData.contact_num, updatedData.sitio, updatedData.barangay, updatedData.province, userId
        ];
        db.query(query, values, (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results);
        });
    },

    addReport: (reportData, callback) => {
        const query = `
            INSERT INTO reports (user_id, firstname, lastname, email, inquiry_type, reference, message)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            reportData.user_id,
            reportData.firstname,
            reportData.lastname,
            reportData.email,
            reportData.inquiry_type,
            reportData.reference,
            reportData.message,
        ];
    
        db.query(query, values, (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results);
        });
    },

    addAdminCase: (caseData, callback) => {
        const query = `
            INSERT INTO admin_cases (title, user_id, description, file_path, created_at)
            VALUES (?, ?, ?, ?, ?)
        `;
        const values = [
            caseData.title,
            caseData.user_id,
            caseData.description,
            caseData.file_path,
            caseData.created_at
        ];
        
        db.query(query, values, (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results);
        });
    },

    getUserCases: (userId, callback) => {
        const query = `
            SELECT * FROM admin_cases 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `;
        db.query(query, [userId], (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results);
        });
    },

    moveToTrash: (table, id, userId, callback) => {
        const selectQuery = `SELECT * FROM ${table} WHERE id = ?`;
        db.query(selectQuery, [id], (err, results) => {
            if (err) return callback(err);
            if (results.length === 0) return callback(new Error('Item not found'));
    
            const item = results[0];
            const insertQuery = `
                INSERT INTO trash 
                (original_table, original_id, user_id, title, description, file_path, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [
                table,
                id,
                userId,
                item.title || '',
                item.description || '',
                item.file_path || '',
                item.created_at || new Date()
            ];
    
            db.query(insertQuery, values, (err, result) => {
                if (err) return callback(err);
    
                const deleteQuery = `DELETE FROM ${table} WHERE id = ?`;
                db.query(deleteQuery, [id], (err, result) => {
                    if (err) return callback(err);
                    callback(null, result);
                });
            });
        });
    },
    
    getTrashItems: (userId, callback) => {
        console.log('getTrashItems called with userId:', userId);
        const query = `
            SELECT id, original_table, original_id, user_id, title, description, file_path, created_at, deleted_at 
            FROM trash 
            WHERE user_id = ? 
            ORDER BY deleted_at DESC
        `;
        console.log('Executing query:', query, 'with userId:', userId);
        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return callback(err);
            }
            if (!results) {
                console.error('No results returned from database');
                return callback(new Error('No results returned from database'));
            }
            console.log('Query results:', results);
            callback(null, results);
        });
    },
    
    restoreTrashItem: (id, userId, callback) => {
        db.beginTransaction((err) => {
            if (err) return callback(err);
    
            const selectQuery = 'SELECT * FROM trash WHERE id = ? AND user_id = ?';
            db.query(selectQuery, [id, userId], (err, results) => {
                if (err) {
                    return db.rollback(() => callback(err));
                }
    
                if (results.length === 0) {
                    return db.rollback(() => callback(new Error('Item not found')));
                }
    
                const item = results[0];
                const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
    
                const insertQuery = `INSERT INTO ${item.original_table} SET ?`;
                db.query(insertQuery, data, (err, result) => {
                    if (err) {
                        return db.rollback(() => callback(err));
                    }
    
                    const deleteQuery = 'DELETE FROM trash WHERE id = ?';
                    db.query(deleteQuery, [id], (err, result) => {
                        if (err) {
                            return db.rollback(() => callback(err));
                        }
    
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => callback(err));
                            }
                            callback(null, result);
                        });
                    });
                });
            });
        });
    },
    
    deleteTrashItem: (id, userId, callback) => {
        const query = 'DELETE FROM trash WHERE id = ? AND user_id = ?';
        db.query(query, [id, userId], (err, result) => {
            if (err) return callback(err);
            callback(null, result);
        });
    }
    
};

module.exports = User;
