-- ensure sthe database doesn't exist before creating it
DROP DATABASE IF EXISTS pet_management;
CREATE DATABASE pet_management;

-- delete tables if they already exist
DROP TABLE IF EXISTS PetTypes;
DROP TABLE IF EXISTS Breeds;
DROP TABLE IF EXISTS Personalities;
DROP TABLE IF EXISTS Pets;
DROP TABLE IF EXISTS PetPersonalities;

-- MIGHT ADD THESE IN THE TABLES IF NECASSARY
-- created_at TIMESTAMP DEFAULT NOW(),
-- updated_at TIMESTAMP DEFAULT NOW()


--creation of the pet database
CREATE DATABASE pet_management;
\c pet_management;  -- (connects to the postgres sql)

-- table for different types of pets (dog, cat, bird, etc.)
CREATE TABLE PetTypes (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL
);

-- table for breeds linked to petTypes table
CREATE TABLE Breeds (
    id SERIAL PRIMARY KEY,
    breed_name VARCHAR(50) UNIQUE NOT NULL, -- corgi, beagle, and corgi-beagle will be separate id's
    pet_type_id INT NOT NULL,
    FOREIGN KEY (pet_type_id) REFERENCES PetTypes(id) ON DELETE CASCADE
);

-- table for personality descriptions basically a table with personailty types
CREATE TABLE Personalities (
    id SERIAL PRIMARY KEY,
    personality_name VARCHAR(50) UNIQUE NOT NULL -- (shy, energetic, playful, good_with_kids, lazy, etc.)
);

-- table for storing individual pet details
CREATE TABLE Pets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL CHECK (name <> ''),
    breed_id INT NOT NULL, -- an id that has a breed attatched to it (breed table)
    age INT NOT NULL CHECK(age >= 0) , -- maybe in months or years or substitute with (adult, juvenile, baby)
    gender VARCHAR (10) NOT NULL,
    pet_description TEXT NOT NULL, -- maybe personality description, health, color, etc.
    status VARCHAR(20) CHECK (status IN ('Available', 'Adopted', 'Pending')) DEFAULT 'Available' -- see if pet is still available or not
    size VARCHAR(20) CHECK (size IN ('Small', 'Medium', 'Large')),
    image_url TEXT,
    FOREIGN KEY (breed_id) REFERENCES Breeds(id) ON DELETE CASCADE
);

-- many-to-many relationship: pets can have many personality characteristics.
CREATE TABLE PetPersonalities (
    pet_id INT NOT NULL,
    personality_id INT NOT NULL, -- not sure if this is structured correctly
    PRIMARY KEY (pet_id, personality_id),
    FOREIGN KEY (pet_id) REFERENCES Pets(id) ON DELETE CASCADE,
    FOREIGN KEY (personality_id) REFERENCES Personalities(id) ON DELETE CASCADE
);

-- Things to add (maybe), 
-- ~ adoption fee
-- ~ location
-- ~ health
-- ~ contact information (email)


