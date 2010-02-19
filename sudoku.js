/**
 * Copyright (C) 2009  Robert Wallis <bob.wallis@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 *
 *
 * @author Robert Wallis <bob.wallis@gmail.com>
 */

/**
 * A sudoku.
 * @constructor
 */
var Sudoku = function( values/*, valueCallback, completeCallback*/ ) {
	// values should be a 9x9 array of integers 1 to 9 in places where a value is known, and null otherwise
	// valueCallback should be function f(i,j,value) called when value is found to be in position [i][j], or null
	// completeCallback should be function f(done) called with true or false when the sudoku is either solved or found to be impossible
	this.valueCallback = ( typeof( arguments[1] ) == 'function' )? arguments[1] : function(){};
	this.completeCallback = ( typeof( arguments[2] ) == 'function' )? arguments[2] : function(){};
	this.input = values;
	this.initialised = false;
}

Sudoku.prototype = {
	initialise: function() {
		var i = 9, j, k, valueIJ;
		// Initialise this.tf with 'true' values, this.output with 'null' values
		this.output = []; this.tf = [];
		while( i-- ) {
			this.tf[i] = [];
			this.output[i] = [];
			j = 9;
			while( j-- ) {
				this.tf[i][j] = [];
				this.output[i][j] = null;
				k = 9;
				while( k-- ) {
					this.tf[i][j][k] = true;
				}
			}
		}
		// And feed in the input values
		i = 9;
		while( i-- ) { 
			j = 9;
			while( j-- ) {
				valueIJ = parseInt( this.input[i][j], 10 );
				if( !isNaN( valueIJ ) ) {
					this.setValue( i, j, valueIJ-1, false );
				}
			}
		}
		this.initialised = true;
		if( this.impossible() ) {
			this.completeCallback( false );
			return false;
		}
	},
	solve: function() {
		if( ! this.initialised ) { this.initialise(); }
		// Perform 'human' solving techniques
		this.basicCandidateElimination();
		
		if( this.solved() ) { 	this.completeCallback( true ); return true; }
		if( this.impossible() ) { 	this.completeCallback( false ); 	return false; 	}
		
		// Do a backtracking algorithm (ie guess and discover if we're wrong by checking whether the resulting puzzle is impossible)
		this.backtrack();
		
		if( this.solved() ) { 	this.completeCallback( true ); return true; }
		// We should never get to here without an impossible sudoku
		this.completeCallback( false ); 	return false;
	},
	basicCandidateElimination: function() {
		var i = 9, iLim, j, jLim, k, br = 3, bc, foundVal, foundValPos, foundRow, foundRowPos, foundCol, foundColPos, foundBlock, foundBlockPos;
		// First find all rows and columns where a value claims a cell
		while( i-- ) {
			j = 9;
			while( j-- ) {
				foundVal = foundRow = foundCol = 0; foundValPos = foundRowPos = foundColPos = [];
				k = 9;
				while( k-- ) {
					if( this.output[i][j] === null && this.tf[i][j][k] === true ) { ++foundVal; foundValPos = [i,j,k]; }
					if( this.output[i][k] === null && this.tf[i][k][j] === true ) { ++foundRow; foundRowPos = [i,k,j]; }
					if( this.output[k][i] === null && this.tf[k][i][j] === true ) { ++foundCol; foundColPos = [k,i,j]; }
				}
				if( foundVal == 1 ) { this.setValue( foundValPos[0], foundValPos[1], foundValPos[2] ); }
				if( foundRow == 1 ) { this.setValue( foundRowPos[0], foundRowPos[1], foundRowPos[2] ); }
				if( foundCol == 1 ) { this.setValue( foundColPos[0], foundColPos[1], foundColPos[2] ); }
				if( foundVal == 1 || foundRow == 1 || foundCol == 1 ) {
					this.basicCandidateElimination(); // Recurse until we run out of options
					return;
				}
			}
		}
		// Find 3x3 blocks where a value claims a cell
		while( br-- ) { // Loop over all 9 3x3 blocks
			bc = 3;
			while( bc-- ) {
				k = 9;
				while( k-- ) { // Loop over all possible values
					foundBlock = 0; foundBlockPos = [];
					for( i = 3*br, iLim = 3*(br+1); i < iLim; ++i ) { // Loop over all cells within the block
						for( j = 3*bc, jLim = 3*(bc+1); j < jLim; ++j ) {
							if( this.output[i][j] === null && this.tf[i][j][k] === true ) { ++foundBlock; foundBlockPos = [i,j,k]; }
						}
					}
					if( foundBlock == 1 ) {
						this.setValue( foundBlockPos[0], foundBlockPos[1], foundBlockPos[2] );
						this.basicCandidateElimination(); // Recurse until we run out of options
						return;
					}
				}
			}
		}
	},
	backtrack: function() {
		// Find the cell with the fewest options
		var optionCount = 10, cell = [], possibilities = [], ijPossCount, i = 9, j, k, x, guess;
		while( i-- ) { 
			j = 9;
			while( j-- ) {
				ijPossCount = 0;
				k = 9;
				while( k-- ) {
					if( this.tf[i][j][k] === true ) { ++ijPossCount; }
				}
				if( ijPossCount < optionCount && ijPossCount > 1 ) {
					optionCount = ijPossCount;
					cell[0] = i; cell[1] = j;
				}
				if( optionCount == 2 ) { break; } // We know 2 will be the fewest
			}
			if( optionCount == 2 ) { break; } // We know 2 will be the fewest
		}
		// And note the possible values for it
		k = 9;
		while( k-- ) {
			if( this.tf[cell[0]][cell[1]][k] === true ) { possibilities.push( k ); }
		}
		// For each possibility...
		x = possibilities.length;
		while( x-- ) {
			guess = new Sudoku( this.output ); // Create a new sudoku with the same values as the current one
			guess.initialise();
			guess.setValue( cell[0], cell[1], possibilities[x], false ); // Insert our guess
			// Try to solve the new sudoku
			if( guess.solve() ) {
				// If it solves then copy the solution values into this sudoku
				i = 9;
				while( i-- ) { 
					j = 9;
					while( j-- ) {
						if( this.output[i][j] === null ) { this.setValue( i, j, guess.output[i][j]-1 ); }
					}
				}
				return;
			}
		}
	},
	setValue: function( i, j, value, doCallback ) { // Note values run from 0 to 8, not 1 to 9
		var x = 9, xLim, y, yLim;
		if( typeof( doCallback ) == 'undefined' ) { doCallback = true; }
		this.output[i][j] = value+1;
		// Remove the value from cells in the same row and column, and other values from the cell
		while( x-- ) {
			this.tf[x][j][value] = this.tf[i][x][value] = this.tf[i][j][x] = false;
		}
		// Remove the value from cells in the same 3x3 block
		xLim = i-(i%3)+3; yLim = j-(j%3)+3;
		for( x = i-(i%3) ; x < xLim; ++x ) {
			for( y = j-(j%3); y < yLim; ++y ) {
				this.tf[x][y][value] = false;
			}
		}
		// Add the value back into the cell where it should be
		this.tf[i][j][value] = true;
		// Use the callback function
		if( doCallback === true ) { this.valueCallback( i, j, value+1 ); }
	},
	solved: function() {
		var i = 9, j;
		// Check if every cell in this.output contains a non-null value
		while( i-- ) {
			j = 9;
			while( j-- ) {
				if( this.output[i][j] === null ) { return false; 	}
			}
		}
		return true;
	},
	impossible: function() {
		var i = 9, j, k, possibleValues;
		// Check that every cell has at least one possible value
		while( i-- ) {
			j = 9;
			while( j-- ) {
				possibleValues = false;
				k = 9;
				while( k-- ) {
					if( this.tf[i][j][k] === true ) { possibleValues = true; break; }
				}
				if( !possibleValues ) { return true; }
			}
		}
		return false;
	}
};

