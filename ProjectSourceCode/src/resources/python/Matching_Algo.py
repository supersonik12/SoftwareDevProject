''' The core matching algorithm. Takes vectors of values (with ids) stored in a CSV file and a user give vector and returns a sorted list
of ids by vector similarity.'''

import argparse, sys
import numpy as np
from numpy import linalg as LA

def getFromCsv(csv):
    with open('src/resources/python/' + csv) as dataFile:
        numCols = len(dataFile.readline().split(','))
        dataFile.seek(0)
        return np.genfromtxt(dataFile, dtype=float, skip_header = 1, delimiter = ',', usecols = range(2, numCols-1)) 

def parse():
    parser = argparse.ArgumentParser(prog='prototype')
    parser.add_argument('species', type=str)
    parser.add_argument('inputVec', nargs = '*', type=float)
    
    args = parser.parse_args()
    return args

'''Cosine similarity vector compairison algorithm'''
def compareVec(inputVec, vectors):
    similarities = {} 
    i=0
    for vec in vectors:
        i+=1
        similarity = (np.dot(inputVec, vec)) / (LA.norm(inputVec) * LA.norm(vec))
        similarities[i] = similarity
    return similarities

def sortIds(inputDict):
    return sorted(inputDict, key=inputDict.get)

def main():
    args = parse()
    vectors = np.array
    match args.species:
        case 'dog':
            vectors = getFromCsv('dogs.csv')
        case 'cat':
            vectors = getFromCsv('cats.csv')
        case 'small':
            vectors = getFromCsv('small.csv')

    vectorComparisons = compareVec(args.inputVec, vectors)
    print (sortIds(vectorComparisons))

if __name__ == '__main__':
    main()
