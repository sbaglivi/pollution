# Pollution
![website main page](https://github.com/sbaglivi/pollution/blob/master/assets/images/website_ss.png?raw=true)
Nodejs project that allows users to report polluted areas and document them with a screenshot. Users can choose to make these submissions anonymously.
The submissions can then be found on the map or listed in a table view.

The project uses NodeJS, Express, MySQL, Multer (for the upload of images), Sharp (to resize the images), OpenLayers for the maps and geocoding, passport.js and bcrypt for authentication.
The simplest pages are server rendered through EJS templates, the pages which require some more work on the front-end are coded through vanilla js (no front-end framework used).

## How to install:
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

## How to use:
- To make a submission you can:
  - Select a location on the map where you witnessed pollution and click the popup that opens or
  - Click the submit link on the navbar and then fill in the location through coordinates (lat, lon) or by geocoding.
  
    You need to log in (or register!) to make a submission, you'll be prompted to do so if you haven't already.
- To check out all submissions (including other people's) you can look at the map or use the 'Table view' link on the navbar
- To check out only your submissions you can go to your profile. 
  Here you can edit or delete your submissions and you can also change your account password or delete your account (and all the submissions you've made with it)

## Created by:
[Simone Baglivi](https:/github.com/sbaglivi)
