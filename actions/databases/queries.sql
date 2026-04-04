/* DROP TABLES */
DROP TABLE app_cards;



/* CREATE TABLES */

CREATE TABLE app_cards (
	/* App path to open in new url */
	path				varchar(100) PRIMARY KEY,
    creation_date 		date,
    cover_image_path 	varchar(100),
    title 				varchar(100),
	description 		varchar(150),
	tags				varchar(100),
	type				varchar(20)
);

CREATE INDEX IF NOT EXISTS type_index
ON app_cards(type);



/* INSERT DATA */

-- app_cards

INSERT INTO app_cards VALUES (
	'/projects/sale-and-rental-listings',
	'2025-12-13T13:10:10.366Z',
	'/projects/sale-and-rental-listings.jpg',
	'Sale and rental listings (USA)',
	'Search for sale and rental listings across the US.',
	'Google Maps API; RentCast API',
	'project'
);

INSERT INTO app_cards VALUES (
	'/blogs/cryptocurrency-investment',
	'2025-11-05',
	'/blogs/cryptocurrency-investment.jpg',
	'Cryptocurrency Investment',
	'My journey of learning how to invest in cryptocurrency from scratch.',
	'Cryptocurrency; Investment; Learn',
	'blog'
);

INSERT INTO app_cards VALUES (
	'/blogs/english-pronunciation',
	'2026-03-29',
	'/blogs/english-pronunciation.jpg',
	'English Pronunciation',
	'My notes of learning speaking American English.',
	'English; Language; Pronunciation',
	'blog'
);



/* UPDATE DATA */

-- app_cards

UPDATE app_cards SET
	creation_date = '2025-12-13T13:10:10.366Z',
	title = 'Sale and rental listings (USA)'
WHERE path = '/projects/sale-and-rental-listings';

UPDATE app_cards SET
	cover_image_path = '/blogs/english-pronunciation/cover.jpg'
WHERE path = '/blogs/english-pronunciation';



/* SELECT DATA */

-- app_cards

SELECT * FROM app_cards;

-- locat
SELECT * FROM states;

SELECT * FROM cities;

SELECT city from cities
WHERE state_id = 'NJ';




/* DELETE DATA */
					