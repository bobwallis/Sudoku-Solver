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

function Sudoku( values/*, valueCallback, completeCallback*/ ) {
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
		var i, j, k, valueIJ;
		// Initialise this.tf with 'true' values, this.output with 'null' values
		this.output = []; this.tf = [];
		for( i = 0; i < 9; ++i ) {
			this.tf[i] = [];
			this.output[i] = [];
			for( j = 0; j < 9; ++j ) {
				this.tf[i][j] = [];
				this.output[i][j] = null;
				for( k = 0; k < 9; ++k ) {
					this.tf[i][j][k] = true;
				}
			}
		}
		// And feed in the input values
		for( i = 0; i < 9; ++i ) { 
			for( j = 0; j < 9; ++j ) {
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
		var i, j, k, br, bc, foundVal, foundValPos, foundRow, foundRowPos, foundCol, foundColPos, foundBlock, foundBlockPos;
		// First find all rows and columns where a value claims a cell
		for( i = 0; i < 9; ++i ) {
			for( j = 0; j < 9; ++j ) {
				foundVal = 0; foundValPos = []; foundRow = 0; foundRowPos = []; foundCol = 0; foundColPos = [];
				for( k = 0; k < 9; k++ ) {
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
		for( br = 0; br < 3; ++br ) { // Loop over all 9 3x3 blocks
			for( bc = 0; bc < 3; ++bc ) {
				for( k = 0; k < 9; ++k ) { // Loop over all possible values
					foundBlock = 0; foundBlockPos = [];
					for( i = 3*br; i < 3*(br+1); ++i ) { // Loop over all cells within the block
						for( j = 3*bc; j < 3*(bc+1); ++j ) {
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
		var optionCount = 10, cell = [], possibilities = [], ijPossCount, i, j, k, x, guess;
		for( i = 0; i < 9; ++i ) { 
			for( j = 0; j < 9; ++j ) {
				ijPossCount = 0;
				for( k = 0; k < 9; ++k ) {
					if( this.tf[i][j][k] === true ) { ++ijPossCount; }
				}
				if( ijPossCount < optionCount && ijPossCount > 1 ) {
					optionCount = ijPossCount;
					cell[0] = i; cell[1] = j;
				}
				if( optionCount == 2 ) { break; }
			}
			if( optionCount == 2 ) { break; }
		}
		// And note the possible values for it
		for( k = 0; k < 9; ++k ) {
			if( this.tf[cell[0]][cell[1]][k] === true ) { possibilities.push( k ); }
		}
		// For each possibility...
		for( x = 0, xLim = possibilities.length; x < xLim; ++x ) {
			guess = new Sudoku( this.output ); // Create a new sudoku with the same values as the current one
			guess.initialise();
			guess.setValue( cell[0], cell[1], possibilities[x], false ); // Insert our guess
			// Try to solve the new sudoku
			if( guess.solve() ) {
				// If it solves then copy the solution values into this sudoku
				for( i = 0; i < 9; ++i ) { 
					for( j = 0; j < 9; ++j ) {
						if( this.output[i][j] === null ) { this.setValue( i, j, guess.output[i][j]-1 ); }
					}
				}
				return;
			}
		}
	},
	setValue: function( i, j, value, doCallback ) { // Note values run from 0 to 8, not 1 to 9
		var x, y, xLim, yLim;
		if( typeof( doCallback ) == 'undefined' ) { doCallback = true; }
		this.output[i][j] = value+1;
		// Remove the value from cells in the same row and column, and other values from the cell
		for( x = 0; x < 9; ++x ) {
			this.tf[x][j][value] = false;
			this.tf[i][x][value] = false;
			this.tf[i][j][x] = false;
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
		var i, j;
		// Check if every cell in this.output contains a non-null value
		for( i = 0; i < 9; ++i ) {
			for( j = 0; j < 9; ++j ) {
				if( this.output[i][j] === null ) {
					return false;
				}
			}
		}
		return true;
	},
	impossible: function() {
		var i, j, k, possibleValues;
		// Check that every cell has at least one possible value
		for( i = 0; i < 9; ++i ) {
			for( j = 0; j < 9; ++j ) {
				possibleValues = false;
				for( k = 0; k < 9; ++k ) {
					if( this.tf[i][j][k] === true ) { possibleValues = true; break; }
				}
				if( ! possibleValues ) { return true; }
			}
		}
		return false;
	}
};

