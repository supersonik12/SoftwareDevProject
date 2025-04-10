''' The core matching algorithm. Takes vectors of values (with ids) stored in a CSV file and a user give vector and returns a sorted list
of ids by vector similarity.'''

import argparse, os 
import psycopg as pg
import numpy as np
from numpy import linalg as LA

def getFromDb(species):
    with pg.connect(host = 'db', port = '5432', dbname = os.environ['POSTGRES_DB'], user = os.environ['POSTGRES_USER'], password = os.environ['POSTGRES_PASSWORD']) as connection:
        with connection.cursor() as cursor:
            query = ""
            #makes sure only populated columns are selected
            if species == 'dog':
               query = "SELECT (breed_id, aff_value, open_value, play_value, vigilant_value, train_value, energy_value, bored_value) FROM breeds WHERE species = 'dog';"
            elif species == 'cat':
               query = "SELECT (breed_id, aff_value, open_value, play_value, train_value, energy_value, ind_value) FROM breeds WHERE species = 'cat';"

            cursor.execute(query)
            raw_vectors = cursor.fetchall()
    
    return {int(vec[0][0]): tuple([float(val) for val in vec[0][1:]]) for vec in raw_vectors}

def parse():
    parser = argparse.ArgumentParser(prog='Matching Algorithm')
    parser.add_argument('species', type=str)
    parser.add_argument('inputVec')
   
    args = parser.parse_args()
    args.inputVec = [float(value) for value in args.inputVec.split(',')] #Need some extra parsing due to how nodeJs handles arrays of arguments with spawn
    return args 

'''Takes the values the user input represented as a vector and calculates the angle between it and the vectors representing breed traits'''
def compareVec(inputVec, vectors):
    return {key: np.dot(inputVec, vec) / (LA.norm(inputVec) * LA.norm(vec)) for key, vec in vectors.items()} 

def sortIds(inputDict):
    return sorted(inputDict, key=inputDict.get)

def main():
    args = parse()
    vectors = np.array
    match args.species:
        case 'dog':
            vectors = getFromDb('dog')
        case 'cat':
            vectors = getFromDb('cat')
        case 'small':
            vectors = getFromDb('small')

    vectorComparisons = compareVec(args.inputVec, vectors)
    print (sortIds(vectorComparisons))

if __name__ == '__main__':
    main()
