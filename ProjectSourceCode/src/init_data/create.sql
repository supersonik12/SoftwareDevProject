DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
    email VARCHAR(50) PRIMARY KEY,
    password VARCHAR(60) NOT NULL,
    name VARCHAR(100) NOT NULL,
    species_preference VARCHAR(20),
    quiz_results INT[300]
);

CREATE TABLE IF NOT EXISTS traits (
	trait_id SERIAL PRIMARY KEY,
	trait_name VARCHAR(20) NOT NULL,
	min_extreme VARCHAR(200) NOT NULL,
	max_extreme VARCHAR(200) NOT NULL
);

--Any of these values besides id, name, and species may be null based on species
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
