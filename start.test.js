const functions = require("./functions");
const fs = require('fs');
let sharp = require('sharp');

test("creating a unique image name should provide a string made by the original name + the time since epoch", () => {
    expect(functions.createUniqueImageName("test")).toMatch(/^test\d+$/);
});

describe("Formatting a date", () => {
    test("without providing one should return a string with the current date in yyyy-mm-dd format", () => {
        let date = new Date();
        let dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        expect(functions.getFormattedDate()).toBe(dateString);
    });
    test("providing one should just return the correspondent formatted string", () => {
        expect(functions.getFormattedDate(new Date("13 May 2005"))).toBe(
            "2005-05-13"
        );
    });
});

describe('building a sql update string should ', () => {

    test("when given a table name, an object with updates, and an object with identifying parameters for the row to update return a correctly escaped sql statement", () => {
        expect(
            functions.buildUpdateString(
                "disneyMovies",
                { director: "John Tramizky", rating: 7.5 },
                { id: 341 }
            )
        ).toBe(
            "UPDATE `disneyMovies` SET `director` = 'John Tramizky', `rating` = 7.5 WHERE `id` = 341"
        );
    });

    test("throw an error if it gets called with no parameters", () => {
        expect(() => {
            functions.buildUpdateString("whatever", { randomPar: 1 });
        }).toThrow();
    });

})
describe("creating a directory that does not exist should", () => {
    beforeAll(() => {
        fs.mkdirSync('untouchedDirectory');
    })
    afterAll(() => {
        fs.rmdirSync('testDirectory');
        fs.rmdirSync('untouchedDirectory');
        fs.rmdirSync('testSubdirectory/importantDirectory');
        fs.rmdirSync('testSubdirectory');
    })
    test("create a directory when it doesn't previously exit", () => {
        expect(fs.existsSync('testDirectory')).toBe(false);
        functions.makeDirectoryIfNotExists('testDirectory');
        expect(fs.existsSync('testDirectory')).toBe(true);
    });
    test('leave the directory there when it already exists', () => {
        expect(fs.existsSync('untouchedDirectory'));
        functions.makeDirectoryIfNotExists('untouchedDirectory');
        expect(fs.existsSync('untouchedDirectory'));
    })
    test('create subdirectories included in the path when needed', () => {
        expect(fs.existsSync('testSubdirectory')).toBe(false);
        functions.makeDirectoryIfNotExists('testSubdirectory/importantDirectory');
        expect(fs.existsSync('testSubdirectory')).toBe(true);
        expect(fs.existsSync('testSubdirectory/importantDirectory')).toBe(true);
    })
});

describe("delete file should", () => {
    beforeAll(() => {
        fs.writeFileSync('testTempFile', 'testContent', err => {
            throw err;
        })
        functions.makeDirectoryIfNotExists('tempFolder');
    });
    afterAll(() => {
        fs.rmdirSync('tempFolder');
    })
    test('delete a file given its path', () => {
        expect(fs.existsSync('testTempFile')).toBe(true);
        functions.deleteFile('testTempFile');
        expect(fs.existsSync('testTempFile')).toBe(false);
    });
    test('throw an error if someone tries to delete a folder', () => {
        expect(() => { functions.deleteFile('tempFolder') }).toThrow();
    });
    test("throw an error if there isn't a file at the given path", () => {
        expect(() => functions.deleteFile('asdlfkajflda')).toThrow();
    })
})
describe('is valid object should', () => {
    test(`return false if it's given a non object`, () => {
        expect(functions.isValidObject(3)).toBe(false);
    });
    test(`return false if it's given an empty object`, () => {
        expect(functions.isValidObject({})).toBe(false);
    });
    test(`return true when given an object with keys`, () => {
        expect(functions.isValidObject({ a: 3 })).toBe(true);
    });
})
describe('parse coordinates from string should', () => {
    test(`return 2 floats when given a properly built string`, () => {
        expect(functions.parseCoordinatesFromString('42.344,12.311')).toStrictEqual([42.344, 12.311])
    })
    test(`throw when given an invalid string`, () => {
        expect(() => { functions.parseCoordinatesFromString('awerw,fasfd') }).toThrow();
    });
    test(`throw when given an invalid object`, () => {
        expect(() => { functions.parseCoordinatesFromString({ b: 3 }) }).toThrow();
    })
});

describe(`isLoggedIn should`, () => {
    let req, res, next;
    beforeAll(() => {
        req = { session: {}, originalUrl: 'testUrl' }
        req.isAuthenticated = jest.fn()
        req.isAuthenticated.mockReturnValueOnce(true).mockReturnValueOnce(false);
        res = {}
        res.redirect = jest.fn();
        next = jest.fn();
    })
    test(`call next if the request is authenticated`, () => {
        functions.isLoggedIn(req, res, next);
        expect(next.mock.calls.length).toBe(1);
        expect(res.redirect.mock.calls.length).toBe(0);
    });
    test(`save the requested url and redirect if the request it not authenticated`, () => {
        functions.isLoggedIn(req, res, next);
        expect(next.mock.calls.length).toBe(1); // the one from first test, as long as it saves this?
        expect(req.session.returnTo).toBe('testUrl')
        expect(res.redirect.mock.calls.length).toBe(1);
        expect(res.redirect.mock.calls[0][0]).toBe('/login');
    });
})
describe(`check validity should`, () => {
    test(`throw an error if the value provided is outside the designed boundaries`, () => {
        expect(() => functions.checkValidity(101, 'quality', 'number', 50, 100)).toThrow();
    });
    test(`throw an error if the value provided is not of the correct type`, () => {
        expect(() => functions.checkValidity('shoe', 'quality', 'number', 50, 100)).toThrow();
    });
    test(`work correctly if given a value of the correct type and within boundaries`, () => {
        expect(() => functions.checkValidity(60, 'quality', 'number', 50, 100)).not.toThrow();
    })
})

async function rejecter() {
    throw Error('error coming from async function!')
}
describe(`process and save image should`, () => {
    test(`throw an error if the options object is invalid`, () => {
        return functions.processAndSaveImage('temp', 'temp', 'temp').catch(err => expect(err).toEqual(Error('Options if present needs to be an object with any of these values: width, height, jpegQuality.')));
    })
    /*
    test(`test to see if toThrow is working correctly`, () => {
        return expect(functions.processAndSaveImage('temp', 'temp', 'temp')).rejects.toThrow();
    })
    test(`test to see if toThrow is working correctly`, async () => {
        await expect(functions.processAndSaveImage('temp', 'temp', 'temp')).rejects.toThrow();
    })
    test(`test to see if toThrow is working correctly`, async () => {
        try {
            await functions.processAndSaveImage('temp', 'temp', 'temp');
        } catch (e) {
            expect(e).toEqual(Error('Options if present needs to be an object with any of these values: width, height, jpegQuality.'));
        }
    })
    */
})