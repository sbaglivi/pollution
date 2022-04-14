const functions = require("./functions");
const fs = require('fs');

test("creating a unique image name should provide a string made by the original name + the time since epoch", () => {
    expect(functions.createUniqueImageName("test")).toMatch(/^test\d+$/);
});

describe("Formatting a date", () => {
    test("without providing one should return a string with the current date in yyyy-mm-dd format", () => {
        expect(functions.getFormattedDate()).toBe("2022-04-14");
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