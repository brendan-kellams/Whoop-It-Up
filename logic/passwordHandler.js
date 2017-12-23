const bcrypt = require('bcrypt');
const SALT = 10;

const passwordHandler = {
    /**
     * This method takes a plain text password string and hashes it using bcrypt.
     * The hashed string is returned.
     * @param {String} password - The password to be hashed
     * @returns {String}
     */
    hashPassword(password, cb) {
        bcrypt.genSalt(SALT, function(err, salt) {
            if (err) throw err;
            bcrypt.hash(password, salt, function(err, hash) {
                if (err) throw err;
                cb(hash);
            });
        });
    },
    /**
     * This method compares a plain text password string with the hashed password that
     * is stored in the database.
     * @param {String} plainText - Password to be compared
     * @param {String} hash - Hashed password in database
     * @param {Function} cb - Callback function that with boolean result as parameter
     */
    comparePassword(plainText, hash, cb) {
        bcrypt.compare(plainText, hash, function(err, res) {
            cb(res);
        });
    }
}

module.exports = passwordHandler;