DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
    email VARCHAR(50) PRIMARY KEY,
    password VARCHAR(60) NOT NULL,
    name VARCHAR(100) NOT NULL,
    species_preference VARCHAR(20),
    quiz_results INT[300]
);

--Favorited Animals--
DROP TABLE IF EXISTS favorites;
CREATE TABLE IF NOT EXISTS favorites (
	user_email VARCHAR(50),
	pet_id INT,
	pet_name VARCHAR(50),
	pet_photo VARCHAR(400),
	pet_description VARCHAR(1000),
	pet_link VARCHAR(400)
);

DROP TABLE IF EXISTS following;
CREATE TABLE IF NOT EXISTS following (
	user_email VARCHAR(50),
	rescue_email VARCHAR(50),
	rescue_phone VARCHAR(50),
	location VARCHAR(50)
);

DROP TABLE IF EXISTS traits;
CREATE TABLE IF NOT EXISTS traits (
	trait_id SERIAL PRIMARY KEY,
	trait_name VARCHAR(20) NOT NULL,
	min_extreme VARCHAR(200) NOT NULL,
	max_extreme VARCHAR(200) NOT NULL
);

DROP TABLE IF EXISTS species;
CREATE TABLE IF NOT EXISTS species (
	species_id SERIAL PRIMARY KEY,
	species_name VARCHAR(20)
);

DROP TABLE IF EXISTS traits_to_species;
CREATE TABLE IF NOT EXISTS traits_to_species (
	trait_id INT NOT NULL,
	species_id INT NOT NULL
);

--Any of these values besides id, name, and species may be null based on species
DROP TABLE IF EXISTS breeds;
CREATE TABLE IF NOT EXISTS breeds (
	breed_id SERIAL PRIMARY KEY,
	breed_name VARCHAR(60) NOT NULL,
	species VARCHAR(20),
	aff_value FLOAT,
	open_value FLOAT,
	play_value FLOAT,
	vigilant_value FLOAT,
	train_value FLOAT,
	energy_value FLOAT,
	bored_value FLOAT,
	ind_value FLOAT
);

