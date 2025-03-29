''' The core matching algorithm. Takes vectors of values (with ids) stored in a CSV file and a user give vector and returns a sorted list
of ids by vector similarity.'''

import argparse, sys
import numpy as np
from numpy import linalg as LA

def getFromCsv():
    with open('Untitled 1.csv') as dataFile:
        numCols = len(dataFile.readline().split(','))
        dataFile.seek(0)
        return np.genfromtxt(dataFile, dtype=float, skip_header = 1, delimiter = ',', usecols = range(2, numCols-1)) 

def parse():
    parser = argparse.ArgumentParser(prog='prototype')
    parser.add_argument('inputVec', nargs = '*', type=float)
    
    vec = parser.parse_args()
    return np.array(vec.inputVec)
    
'''Cosine similarity vector compairison algorithm'''
def compareVec(inputVec, vectors):
    similarities = {} 
    i=0
    for vec in vectors[0]:
        i+=1
        similarity = (np.dot(inputVec, vec)) / (LA.norm(inputVec) * LA.norm(vec))
        similarities[i] = similarity
    return similarities

def sortIds(inputDict):
    return [key for key, _ in sorted(inputDict.items(), key = lambda item: item[1], reverse = True)]

def main():
    if ( len(sys.argv) != 7 ):
        print("Invalid input length")

    vectors = getFromCsv()
    vectorComparisons = compareVec(parse(), vectors)
    print ( sortIds(vectorComparisons) )

if __name__ == '__main__':
    main()
