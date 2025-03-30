--creation of the pet database
CREATE DATABASE pet_management;
\c pet_management;  -- (connects to the postgres sql)

-- table for different types of pets (e.g., dog, cat, bird)
CREATE TABLE PetTypes (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) UNIQUE NOT NULL
);

-- table for breeds linked to petTypes table
CREATE TABLE Breeds (
    id SERIAL PRIMARY KEY,
    breed_name VARCHAR(50) UNIQUE NOT NULL,
    pet_type_id INT NOT NULL,
    FOREIGN KEY (pet_type_id) REFERENCES PetTypes(id) ON DELETE CASCADE
);

-- table for personality descriptions basically a table with personailty types
CREATE TABLE Personalities (
    id SERIAL PRIMARY KEY,
    personality_name VARCHAR(50) UNIQUE NOT NULL
);

-- table for storing individual pet details
CREATE TABLE Pets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    breed_id INT NOT NULL,
    age INT NOT NULL,
    gender VARCHAR (10) NOT NULL
    size VARCHAR(20) CHECK (size IN ('Small', 'Medium', 'Large')),
    FOREIGN KEY (breed_id) REFERENCES Breeds(id) ON DELETE CASCADE
);

-- many-to-many relationship: pets can have many personality characteristics.
CREATE TABLE PetPersonalities (
    pet_id INT NOT NULL,
    personality_id INT NOT NULL,
    PRIMARY KEY (pet_id, personality_id),
    FOREIGN KEY (pet_id) REFERENCES Pets(id) ON DELETE CASCADE,
    FOREIGN KEY (personality_id) REFERENCES Personalities(id) ON DELETE CASCADE
);
