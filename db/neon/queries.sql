/* DROP TABLES */
DROP TABLE app_projects;



/* CREATE TABLES */

CREATE TABLE app_projects (
	/* App path to open in new url */
	path				varchar(100) PRIMARY KEY,
    creation_date 		date,
    cover_image_path 	varchar(100),
    title 				varchar(100),
	description 		varchar(150),
	tags				varchar(100)
);



/* INSERT DATA */

-- app_projects

INSERT INTO app_projects VALUES (
	'/projects/sale-and-rental-listings',
	'2024-12-17',
	'/projects/sale-and-rental-listings.jpg',
	'Sale and rental listings',
	'Search for sale and rental listings across the US.',
	'Google Maps API; RentCast API'
);



/* UPDATE DATA */

-- app_projects

UPDATE app_projects SET
	description = ''
WHERE path = '/projects/sale-and-rental-listings';



/* SELECT DATA */

-- app_projects

SELECT * FROM app_projects;



/* DELETE DATA */
					