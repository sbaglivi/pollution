# Pollution
![website main page](https://github.com/sbaglivi/pollution/blob/master/assets/images/website_ss.png?raw=true)
Nodejs project that allows users to report polluted areas and document them with a screenshot. Users can choose to make these submissions anonymously.
These areas can then be found on the map or listed in a table view.

The project uses NodeJS, Express, MySQL, Multer (for the upload of images), Sharp (to resize the images), OpenLayers for the maps and geocoding, passport.js and bcrypt for authentication.
The simplest pages are server rendered through EJS templates, the pages which require some more work on the front-end are coded through vanilla js (no front-end framework used).
Hosting provided by: [Firebase](https://firebase.google.com/)

## How to use:
- Clone the repository `git clone https://github.com/sbaglivi/pollution`
- Enter the folder and install dependencies `cd pollution && npm i`
- You need to have a mysql server installed, if you do:
  - Create a database called pollution and grant privileges to a user with username / password of your choice
  - Initialize the database tables by running the commands provided in `TO BE FILLED`
  - Create a .env file in the root directory of the project with key / value pairs
  ```
  DB_USERNAME="yourDatabaseUsername"
  DB_PASSWORD="yourDatabasePassword"
  ```
- Run `node index.js` and the website will be waiting for you at `localhost:3000'!
Simply visit the [website](https://bookworm-a8090.web.app/), type in the genre of books you'd like to search for and browse through the results!

Clicking on the title of a book opens a panel with its description (when provided by the API).

## Created by:
[Simone Baglivi](https:/github.com/sbaglivi)
