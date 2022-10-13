Database tables: 

Users:
- id INT PRIMARY KEY AUTO_INCREMENT
- username VARCHAR(30) UNIQUE NOT NULL;
- hash VARCHAR(60) NOT NULL



"INSERT INTO pollution_sites (latitude, longitude, name, image_name, author, author_id, description, hide_author, submission_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"

pollution_sites:
- id INT PRIMARY KEY AUTO_INCREMENT
- latitude VARCHAR(10)?
- longitude VARCHAR(10)?
- name VARCHAR(30)
- image_name VARCHAR(30)
- author VARCHAR(30) NOT NULL CONSTRAINT FOREIGN KEY author REFERENCES users(username) ON UPDATE CASCADE, ON DELETE CASCADE
- author_id INT NOT NULL FOREIGN KEY author_id REFERENCES user(id)
- description -> VARCHAR(1000)
- hide_author BOOLEAN
- submission_date DATE NOT NULL

CREATE TABLE pollution_sites (id INT PRIMARY KEY AUTO_INCREMENT, latitude VARCHAR(10) NOT NULL, longitude VARCHAR(10) NOT NULL, name VARCHAR(50) NOT NULL, image_name VARCHAR(50) NOT NULL, author VARCHAR(30) NOT NULL, author_id INT NOT NULL, description VARCHAR(1000), hide_author BOOLEAN, submission_date DATE NOT NULL, CONSTRAINT FOREIGN KEY (author, author_id) REFERENCES users(username, id) ON UPDATE CASCADE ON DELETE CASCADE);