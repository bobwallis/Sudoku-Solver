// Scripts for running the UI
var sudokuPage = {
	fetchGrid: function() {
		// Read the input values and put into a 9x9 array, use parseInt to make sure we have integers
		var values = [], i = 9, j, inputValIJ;
		while( i-- ) {
			values[i] = [];
			j = 9;
			while( j-- ) {
				inputValIJ = parseInt( document.getElementById( 'input_'+i+'_'+j ).value, 10 );
				values[i][j] = ( isNaN( inputValIJ ) )? null : inputValIJ;
			}
		}
		return values;
	},
	replaceGrid: function( values ) {
		var i=values.length, j;
		// Puts the 'values' array into the page's grid
		while( i-- ) {
			j = values[i].length;
			while( j-- ) {
				sudokuPage.replaceGridValue( i, j, values[i][j] );
			}
		}
	},
	replaceGridValue: function( i, j, value ) {
		// Puts a single 'value' into position [i][j] in the page's grid, leaving blank if the value is null
		if( value !== null ) {
			document.getElementById( 'input_'+i+'_'+j ).value = value;
		}
	},
	validateValue: function( input ) {
		// Checks whether the value of an input is valid
		if( input.value != '' && [1,2,3,4,5,6,7,8,9].contains( parseInt( input.value, 10 ) ) === false ) {
			input.className= 'error'; // Set the class of invalid inputs to 'error'
		}
		else {
			input.className= ''; // Clear the class of valid inputs
		}
	},
	validateGrid: function() {
		// Checks every input
		var inputs = document.getElementById( 'input' ).getElementsByTagName( 'input' ), i=inputs.length;
		while( i-- ) { sudokuPage.validateValue( inputs[i] ); }
		if( getElementsByClassName( document.getElementById( 'input' ), 'error' ).length === 0 ) {
			return true;
		}
		else { return false; }
	},
	solve: function() {
	sudokuPage.startTimer();
		// First check input is valid
		if( ! sudokuPage.validateGrid() ) {
			alert( 'Check input' );
			return false;
		}
		// Begin the solve process
		sudokuPage.sudoku = new Sudoku( sudokuPage.fetchGrid(), sudokuPage.replaceGridValue, function( done ) { if( done === false ) { alert( 'Got stuck, possibly impossible.' ); } sudokuPage.endTimer(); } );
		sudokuPage.sudoku.solve();
	},
	startTimer: function() {
		sudokuPage.startTime = (new Date()).getTime();
	},
	endTimer: function() {
		var time = ((new Date()).getTime()) - sudokuPage.startTime;
		document.getElementById( 'timer' ).innerHTML = 'Solved in '+time+'ms';
	}
};

// Other things
( function() {
	// Checks whether an array contains a given value, call as [a,b,c,d].contains( something );
	// Using this will break for..each, so doing this another way would be more portable
	if( typeof Array.prototype.contains == 'undefined' ) {
		Array.prototype.contains = function( e ) {
			var i = this.length;
			while( i-- ) {
				if( this[i] === e ) { return true; }
			}
			return false;
		};
	}
	// Use Microsoft's event registration on the window event
	if( typeof window.addEventListener == 'undefined' && typeof window.attachEvent != 'undefined' ) {
		window.addEventListener = function( event, fn, bubble ) { window.attachEvent( 'on'+event, fn ); };
		// Ideally we'd be able to add this to the Element prototype too. But we can't. We'll have to catch the rest of the errors later.
	}
	// Add support for browsers that don't support getElementsByClassName (Looking at you (again) IE)
	if( typeof( window.getElementsByClassName ) == 'undefined' ) {
		window.getElementsByClassName = function( node, classname ) {
			if( node.getElementsByClassName ) { return node.getElementsByClassName( classname ); }
			else {
				var elements = node.getElementsByTagName( '*' ), returnElements = [];
				for( var l = 0, lLim = elements.length; l < lLim; ++l ) {
					if( elements[l].className == classname ) {
						returnElements.push( elements[l] );
					}
				}
				return returnElements;
			}
		};
	}
	
	// Page load event
	window.addEventListener( 'load', function() {
		try {
			// Listen for changes to input fields, and validate the input as we go
			document.getElementById( 'sudokuForm' ).addEventListener( 'blur', function( e ) { if( !['button','reset'].contains( e.target.type ) ) { sudokuPage.validateValue( e.target ); } }, true );
		} catch(e) {
			if( typeof window.attachEvent != 'undefined' ) {
				// Attatch events using Microsoft's method
				document.getElementById( 'sudokuForm' ).attachEvent( 'onblur', function( e ) { if( !['button','reset'].contains( e.target.type ) ) { sudokuPage.validateValue( e.target ); } } );
			}
		}
		// Test sudoku
		sudokuPage.replaceGrid( [
			[null,9,null,2,6,null,null,1,null],
			[3,null,null,null,null,9,4,null,5],
			[null,1,null,null,null,null,null,null,null],
			[null,5,null,1,null,2,null,null,3],
			[4,null,null,null,null,null,null,null,2],
			[9,null,null,3,null,6,null,7,null],
			[null,null,null,null,null,null,null,5,null],
			[7,null,5,6,null,null,null,null,1],
			[null,8,null,null,3,5,null,9,null]
		] );
	}, false );
} )();

