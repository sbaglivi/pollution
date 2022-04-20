const fs = require('fs');
const sharp = require('sharp');
const { escape: sqlEscape, escapeId: sqlEscapeId } = require('sqlstring');

module.exports = {
    makeDirectoryIfNotExists: (path) => {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
    },
    deleteFile: path => fs.unlinkSync(path),
    isLoggedIn: (req, res, next) => {
        if (req.isAuthenticated()) return next();
        req.session.returnTo = req.originalUrl;
        res.redirect('/login');
    },
    processAndSaveImage: async function (from, to, options = {}) {
        try {
            if (typeof options === 'object') {
                for (let key in options) {
                    switch (key) {
                        case 'width':
                            checkValidity(options[key], 'width', 'number', 150, 900);
                            break;
                        case 'height':
                            checkValidity(options[key], 'height', 'number', 150, 900);
                            break;
                        case 'jpegQuality':
                            checkValidity(options[key], 'quality', 'number', 50, 100);
                            break;
                        default:
                            throw Error(`Unkown option property ${key}. Accepted are: width, height, quality.`);
                            break;
                    }
                }
            } else throw Error(`Options if present needs to be an object with any of these values: width, height, jpegQuality.`)
            await sharp(from).resize(options.width || 200, options.height || 200).jpeg({ quality: options.jpegQuality || 90 }).toFile(to)
        } catch (error) {
            throw error;
        }
    },
    checkValidity: (value, fieldName, type, min, max) => {
        if (typeof value !== type) throw Error(`Invalid type received for ${fieldName}, got ${typeof value} expected ${type}`);
        if (value < min || value > max) throw Error(`${value} is not a valid ${fieldName}: min and max accepted values are ${min} - ${max}`);
    },
    createUniqueImageName: function (submissionName) {
        let imageName = submissionName + Date.now();
        imageName = imageName.replace(/\s+/g, '_').toLowerCase();
        return imageName;
    },
    getFormattedDate: (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    isValidObject: (obj) => obj && Object.keys(obj).length !== 0,
    //  previously I was also checking for: && Object.getPrototypeOf(obj) === Object.prototype but the req.body seems to come out as null prototype and be unreliable
    buildUpdateString: (dbName, updatesObject, identityObject) => {
        try {
            if (!module.exports.isValidObject(updatesObject) || !module.exports.isValidObject(identityObject)) throw Error(`Received an invalid object for the updates or identifiers`);
            let sqlStatement = `UPDATE ${sqlEscapeId(dbName)} SET `
            let firstField = true;
            for (let key in updatesObject) {
                if (key = 'hide_author') {
                    sqlStatement += `${sqlEscapeId(key)} = ${updatesObject[key] === 'true'}`;
                    if (firstField) firstField = false;
                    continue;
                }
                if (firstField) {
                    sqlStatement += `${sqlEscapeId(key)} = ${sqlEscape(updatesObject[key])}`;
                    firstField = false;
                    continue;
                }
                sqlStatement += `, ${sqlEscapeId(key)} = ${sqlEscape(updatesObject[key])}`;
            }
            sqlStatement += ` WHERE `
            firstField = true;
            for (let key in identityObject) {
                if (firstField) {
                    sqlStatement += `${sqlEscapeId(key)} = ${sqlEscape(identityObject[key])}`;
                    firstField = false;
                    continue;
                }
                sqlStatement += ` AND ${sqlEscapeId(key)} = ${sqlEscape(identityObject[key])}`;
            }
            return sqlStatement;
        } catch (error) {
            throw error;
        }
    },
    parseCoordinatesFromString: (coordinatesString) => {
        try {
            let splitResult = coordinatesString.split(',')
            if (splitResult.length !== 2) throw Error(`invalid coordinate string, should be 'latitude,longitude'`);
            let result = splitResult.map(x => parseFloat(x));
            if (result.some(value => Number.isNaN(value))) throw Error(`invalid coordinate string should be 'latitude,longitude'`);
            return result;
        } catch (err) {
            throw err;
        };
    }
}