

INSERT INTO traits 
	(trait_name, min_extreme, max_extreme)
	VALUES
		(
			'aff_val',
			'Independent',
			'Cuddly'
		),
		(
			'play_val',
			'Only needs some playtime',
			'Always playing!'
		),
		(
			'open_val',
			'Reserved',
			'Friends with everyone!'
		),
		(
			'vigilant_val',
			'Unbothered by strangers',
			'The Perfect watchdog'
		),
		(
			'energy_val',
			'A Total couch potato',
			'Outgoing'
		),
		(
			'bored_val',
			'Content with less structure',
			'Happy with a job'
		),
		(
			'train_val',
			'Strong willed',
			'Eager to please'
		);

--copy from csv files into breeds table
DO 
$$
	BEGIN
		IF NOT EXISTS (
			SELECT breed_id FROM breeds WHERE species = 'dog'
			) THEN

			--Temp tables are required when copying subsets of values from csv files in postgres and when using serial primary keys, 
			--please do not remove these or place these in create.sql
			CREATE TABLE dog_temp (
				csv_id INT,
				csv_name VARCHAR(60),
				csv_aff FLOAT,
				csv_open FLOAT,
				csv_play FLOAT,
				csv_vigilant FLOAT,
				csv_train FLOAT,
				csv_energy FLOAT,
				csv_bored FLOAT
			);

			COPY dog_temp FROM '/data/dogs.csv' DELIMITER ',' CSV HEADER;
			INSERT INTO breeds(breed_name, species, aff_value, open_value, play_value, vigilant_value, train_value, energy_value, bored_value)
				SELECT csv_name, 'dog', csv_aff, csv_open, csv_play, csv_vigilant, csv_train, csv_energy, csv_bored
				FROM dog_temp;

			DROP TABLE dog_temp;	
		END IF;
END $$;
DO
$$
	BEGIN 
		IF NOT EXISTS (
			SELECT FROM breeds WHERE species = 'cat'
		) THEN
			CREATE TABLE cat_temp (
				csv_id INT,
				csv_name VARCHAR(60),
				csv_aff FLOAT,
				csv_open FLOAT,
				csv_play FLOAT,
				csv_train FLOAT,
				csv_energy FLOAT,
				csv_ind FLOAT 
			);

			COPY cat_temp FROM '/data/cats.csv' DELIMITER ',' CSV HEADER;

			INSERT INTO breeds(breed_name, species, aff_value, open_value, play_value, train_value, energy_value, ind_value)
				SELECT csv_name, 'cat', csv_aff, csv_open, csv_play, csv_train, csv_energy, csv_ind
				FROM cat_temp;
			DROP TABLE cat_temp;
		END IF;
END $$;
