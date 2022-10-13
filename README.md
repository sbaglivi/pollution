# Pollution
![website main page](https://github.com/sbaglivi/pollution/blob/master/assets/images/website_ss.png?raw=true)
Nodejs project that allows users to report polluted areas and document them with a screenshot. Users can choose to make these submissions anonymously.
The submissions can then be found on the map or listed in a table view.

The project uses NodeJS, Express, MySQL, Multer (for the upload of images), Sharp (to resize the images), OpenLayers for the maps and geocoding, passport.js and bcrypt for authentication.
The simplest pages are server rendered through EJS templates, the pages which require some more work on the front-end are coded through vanilla js (no front-end framework used).

## How to install:
### You need to have a mysql server, local or remote
- Clone the repository `git clone https://github.com/sbaglivi/pollution`
- Enter the folder and install dependencies `cd pollution && npm i`
- To setup the database:
  - (Optional) Create a user to interact with this database (you can use an existing one if you prefer)
  - Create a database, grant all privileges on it to the user previously created
  - Initialize the database tables by running `mysql -u [username] -p [database] < dump.sql` while you're in the project root directory (fill in [username] and [database] with the ones you've just created and then input the relative password to confirm).
  - Rename the `env` file in the project root directory to `.env` and update the value fields (the ones after the = sign and within "") to the ones you've chosen (username, password, database name).
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
