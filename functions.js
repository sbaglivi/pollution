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
    processAndSaveImage: async function (initialPath, width, height, quality, finalPath) {
        try {
            await sharp(initialPath).resize(width, height).jpeg({ quality: quality }).toFile(finalPath)
        } catch (error) {
            throw error;
        }
    },
    createUniqueImageName: function (submissionName) {
        let imageName = submissionName + Date.now();
        imageName = imageName.replace(/\s+/g, '_').toLowerCase();
        return imageName;
    },
    getFormattedDate: (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    buildUpdateString: (dbName, updatesObject, identityObject) => {
        try {
            let sqlStatement = `UPDATE ${sqlEscapeId(dbName)} SET `
            let firstField = true;
            for (let key in updatesObject) {
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
    parseCoordinatesFromString: (coordinatesString) => coordinatesString.split(',').map(x => parseFloat(x)),
}