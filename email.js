var PALETTE = ["rgb(173,35,35)", "rgb(42,75,215)", "rgb(29,105,20)",
    "rgb(129,74,25)", "rgb(129,38,192)", "rgb(160,160,160)", "rgb(129,197,122)",
    "rgb(157,175,255)", "rgb(41,208,208)", "rgb(255,146,51)", "rgb(255,238,51)",
    "rgb(233,222,187)", "rgb(255,205,243)"];

var ALPHABET = "0abc1def2ghi3jkl4mno5pqr6stu7vwx8yz9";

var PMCode = function(text, options) {
	this._options = {
		width: 70,
		height: 70,
		lineWidth: 2
	}
	for (var p in options) { this._options[p] = options[p]; }
	
	this._canvas = document.createElement("canvas");
	this._canvas.width = this._options.width;
	this._canvas.height = this._options.height;
	this._context = this._canvas.getContext("2d");
	
	this._cells = [];
	this._lines = [];
	
	this._draw(text);
}

PMCode.prototype.getCanvas = function() {
	return this._canvas;
}

PMCode.prototype._draw = function(text) {
	var letters = text.toLowerCase().split("@");
	var user = letters[0].split("");
	var domain = letters[1].split("");
	
	this._computeLines(domain);
	this._drawRectangles(user);
	this._drawLines();
}

PMCode.prototype._drawRectangles = function(arr) {

	while (arr.length && this._cells.length) {
		var number = ALPHABET.indexOf(arr.shift());
		if (number == -1) { continue;  }
		var color = PALETTE[number % PALETTE.length];
		
		var index = -1;
		while (index == -1 && arr.length) {
			index = ALPHABET.indexOf(arr.shift());
			if (index != -1) { index = index % this._cells.length; }
		}
		if (index == -1) { index = 0; }
		var cell = this._cells[index];
		this._cells.splice(index, 1);

		this._context.fillStyle = color;
		this._context.fillRect(this._options.width * cell.x, this._options.height * cell.y, this._options.width * cell.w, this._options.height * cell.h);
	}
}

PMCode.prototype._drawLines = function() {
	this._context.lineWidth = this._options.lineWidth;
	this._context.beginPath();
	while (this._lines.length) {
		var line = this._lines.shift();
		this._context.moveTo(this._round(this._options.width * line[0]), this._round(this._options.height * line[1]));
		this._context.lineTo(this._round(this._options.width * line[2]), this._round(this._options.height * line[3]));
	}
	this._context.closePath();
	this._context.stroke();
}

PMCode.prototype._computeLines = function(arr) {
	this._cells.push({x:0,y:0,w:1,h:1});
	var sort = function(c1, c2) { return c2.w*c2.h - c1.w*c1.h; }
	
	while (arr.length) {
		var l = arr.pop();
		var number = ALPHABET.indexOf(l);
		if (number == -1) { continue; }

		var cell = this._cells.shift();
		var frac = number / ALPHABET.length;
		var lineOffset = 0.15 + 0.7*frac;
		
		if (cell.w < cell.h) { /* vodorovne */
			this._cells.push({
				x:cell.x,
				y:cell.y,
				w:cell.w,
				h:lineOffset * cell.h
			});
			this._cells.push({
				x:cell.x,
				y:cell.y + lineOffset * cell.h,
				w:cell.w,
				h:cell.h - lineOffset * cell.h
			});
			this._lines.push([cell.x, cell.y + lineOffset * cell.h, cell.x + cell.w, cell.y + lineOffset * cell.h]);
		} else { /* svisle */
			this._cells.push({
				x:cell.x,
				y:cell.y,
				w:lineOffset * cell.w,
				h:cell.h
			});
			this._cells.push({
				x:cell.x + lineOffset * cell.w,
				y:cell.y,
				w:cell.w - lineOffset * cell.w,
				h:cell.h
			});
			this._lines.push([cell.x + lineOffset * cell.w, cell.y, cell.x + lineOffset * cell.w, cell.y + cell.h]);
		}
		this._cells.sort(sort);
	}
}

PMCode.prototype._round = function(val) {
	if (this._options.lineWidth % 2) {
		return Math.round(val-0.5)+0.5;
	} else {
		return Math.round(val);
	}
}

var CircleCode = function(text, options) {
	this._options = {
		width: 70,
		height: 70,
		lineWidth: 2,
		operation: "source-over",
		radius: 0.5,
		radiusFactor: 0.75
	}
	for (var p in options) { this._options[p] = options[p]; }
	
	this._canvas = document.createElement("canvas");
	this._canvas.width = this._options.width;
	this._canvas.height = this._options.height;

	this._context = this._canvas.getContext("2d");

	this._draw(text);
}

CircleCode.prototype.getCanvas = function() {
	return this._canvas;
}

CircleCode.prototype._draw = function(text) {
	var letters = text.toLowerCase().split("");
	var radius = this._options.radius;
	this._context.globalCompositeOperation = this._options.operation;

	var color = this._getNumber(letters, 0) % PALETTE.length;
	this._context.fillStyle = PALETTE[color];
	this._context.lineWidth = this._options.lineWidth;
	this._context.fillRect(0, 0, this._options.width, this._options.height);
	
	while (letters.length) {
		var number = this._getNumber(letters, ALPHABET.length/2);
		var color = this._getNumber(letters, 0) % PALETTE.length;
		this._context.fillStyle = PALETTE[color];
		this._context.beginPath();

		var x = Math.floor(number / 6);
		var y = number % 6;
		x = x/6 + 1/12;
		y = y/6 + 1/12;

		this._context.arc(this._options.width * x, this._options.height * y, radius * (this._options.width+this._options.height)/2, 0, 2*Math.PI, true);
		
		this._context.closePath();
		this._context.fill();
		
		if (this._options.lineWidth) { this._context.stroke(); }
		
		radius *= this._options.radiusFactor;
	}
}

CircleCode.prototype._getNumber = function(arr, fallback) {
	while (arr.length) {
		var num = ALPHABET.indexOf(arr.pop());
		if (num != -1) { return num; }
	}
	return fallback;
}

var Maze = function(text, options) {
	this._options = {
		width: 12,
		height: 12,
		cellWidth: 4,
		cellHeight: 4,
		lineWidth: 2
	}
	for (var p in options) { this._options[p] = options[p]; }

	var w = this._options.width * (this._options.cellWidth + this._options.lineWidth) + this._options.lineWidth;
	var h = this._options.height * (this._options.cellHeight + this._options.lineWidth) + this._options.lineWidth;
	this._canvas = document.createElement("canvas");
	this._canvas.className = "maze";
	this._canvas.width = w;
	this._canvas.height = h;
	this._context = this._canvas.getContext("2d");
	this._randomPool = [];

	this._draw(text);
}

Maze.prototype.getCanvas = function() {
	return this._canvas;
}

Maze.prototype._draw = function(text) {
	this._context.lineWidth = this._options.lineWidth;
	this._context.lineCap = "square";
	this._context.globalCompositeOperation = "destination-over";

	this._cells = [];
	for (var i=0;i<this._options.width;i++) {
		this._cells.push([]);
		for (var j=0;j<this._options.height;j++) {
			this._cells[i].push([0, 0, -1, -1]); /* right wall, bottom wall, prev x, prev y */
		}
	}
	
	var data = text.toLowerCase().split("");
	while (data.length) {
		var index = ALPHABET.indexOf(data.shift());
		if (index == -1) { continue; }
		var binary = index.toString(2).split("");
		while (binary.length < 5) { binary.unshift("0"); }
		while (binary.length) { this._randomPool.push(binary.shift() == "1"); }
	}
	
	
	var color = this._randomUpTo(PALETTE.length) % PALETTE.length;
	this._context.fillStyle = PALETTE[color];
	
	this._drawLines();

	if (this._random()) { /* spojit sloupce */
		var x1 = 0;
		var x2 = this._options.width-1;
		var y1 = this._randomUpTo(this._options.height) % this._options.height;
		var y2 = this._randomUpTo(this._options.height) % this._options.height;
	} else { /* spojit rady */
		var y1 = 0;
		var y2 = this._options.width-1;
		var x1 = this._randomUpTo(this._options.width) % this._options.width;
		var x2 = this._randomUpTo(this._options.width) % this._options.width;
	}
	

	var path = this._findPath(x1, y1, x2, y2);
	for (var i=1;i<path.length;i++) {
		this._drawCell(path[i-1], path[i]);
	}
}

Maze.prototype._drawCell = function(cell1, cell2) {
	var x = Math.min(cell1[0], cell2[0]);
	var y = Math.min(cell1[1], cell2[1]);
	var w = (cell1[1] == cell2[1] ? 2*this._options.cellWidth+this._options.lineWidth : this._options.cellWidth);
	var h = (cell1[0] == cell2[0] ? 2*this._options.cellHeight+this._options.lineWidth : this._options.cellHeight);
	this._context.fillRect(
		1+x*(this._options.cellWidth+this._options.lineWidth), 1+y*(this._options.cellHeight+this._options.lineWidth), w, h
	);
}

Maze.prototype._findPath = function(x1, y1, x2, y2) {
	var result = [];
	var dirs = [
		[0,1], [0,-1], [1,0], [-1,0]
	];
	
	var stack = [[x1, y1]];
	this._cells[x1][y1][2] = x1;
	this._cells[x1][y1][3] = y1;
	
	while (stack.length) {
		var current = stack.shift();
		if (current[0] == x2 && current[1] == y2) {	break; }
		for (var i=0;i<dirs.length;i++) {
			var neighbor = this._getNeighbor(current, dirs[i]);
			if (!neighbor) { continue; }
			var data = this._cells[neighbor[0]][neighbor[1]];
			if (data[2] != -1) { continue; } /* already visited */
			data[2] = current[0];
			data[3] = current[1];
			stack.push(neighbor);
		}
	}
	
	var x = x2;
	var y = y2;
	var data = null;
	while (x != x1 || y != y1) {
		result.push([x, y]);
		data = this._cells[x][y];
		x = data[2];
		y = data[3];
	};
	result.push([x1, y1]);
	
	return result;
}

Maze.prototype._getNeighbor = function(coords, dir) {
	var x1 = coords[0];
	var y1 = coords[1];
	var x2 = x1 + dir[0];
	var y2 = y1 + dir[1];
	
	if (x2 < 0 || y2 < 0 || x2 >= this._options.width || y2 >= this._options.height) { return false; }
	var data = this._cells[x1][y1];
	var ndata = this._cells[x2][y2];
	
	if (x1 < x2 && data[0]) { return false; }
	if (y1 < y2 && data[1]) { return false; }
	if (x1 > x2 && ndata[0]) { return false; }
	if (y1 > y2 && ndata[1]) { return false; }
	
	return [x2,y2];
}

Maze.prototype._drawLines = function() {
	var o = this._options;

	this._context.beginPath();

	/* top + left + bottom lines */
	var w = this._canvas.width;
	var h = this._canvas.height;
	var lw = this._options.lineWidth;
	
	this._line(lw/2, lw/2, w-lw, lw/2);
	this._line(lw/2, h-lw, w-lw, h-lw);
	this._line(lw/2, lw/2, lw/2, h-lw);
	
	var L = [];
	var R = [];
	
	for (var i=0;i<o.width;i++) {
		L.push(i);
		R.push(i);
	}
	L.push(o.width-1); /* fake stop-block at the right side */
	

	for (var j=0;j+1<o.height;j++) {
		/* one row */
		for (var i=0;i<o.width;i++) {
			
			/* right connection */
			if (this._random() && i != L[i+1]) {
				this._addToList(i, L, R);
			} else {
				/* right wall */
				var x = (i+1)*(o.cellWidth+o.lineWidth);
				var y1 = j*(o.cellHeight+o.lineWidth);
				var y2 = y1 + o.cellHeight + o.lineWidth;
				this._line(x, y1, x, y2);
				this._cells[i][j][0] = 1;
			}
			
			/* bottom connection */
			if (this._random() && i != L[i]) {
				/* remove connection */
				this._removeFromList(i, L, R);

				/* bottom wall */
				var y = (j+1)*(o.cellHeight+o.lineWidth);
				var x1 = i*(o.cellWidth+o.lineWidth);
				var x2 = x1 + o.cellWidth + o.lineWidth;
				this._line(x1, y, x2, y);
				this._cells[i][j][1] = 1;
			}
		}
	}

	/* last row */
	for (var i=0;i<o.width;i++) {	
		/* right connection */
		if (i != L[i+1] && (i == L[i] || this._random())) {
			/* dig right also if the cell is separated, so it gets connected to the rest of maze */
			this._addToList(i, L, R);
		} else {
			/* right wall */
			var x = (i+1)*(o.cellWidth+o.lineWidth);
			var y1 = j*(o.cellHeight+o.lineWidth);
			var y2 = y1 + o.cellHeight + o.lineWidth;
			this._line(x, y1, x, y2);
			this._cells[i][j][0] = 1;
		}

		this._removeFromList(i, L, R);
	}

	this._context.closePath();
	this._context.stroke();
}

/**
 * Remove "i" from its list
 */
Maze.prototype._removeFromList = function(i, L, R) {
	R[L[i]] = R[i];
	L[R[i]] = L[i];
	R[i] = i;
	L[i] = i;
}

/**
 * Join lists with "i" and "i+1"
 */
Maze.prototype._addToList = function(i, L, R) {
	R[L[i+1]] = R[i];
	L[R[i]] = L[i+1];
	R[i] = i+1;
	L[i+1] = i;
}

Maze.prototype._line = function(x1, y1, x2, y2) {
	this._context.moveTo(this._round(x1), this._round(y1));
	this._context.lineTo(this._round(x2), this._round(y2));
}

Maze.prototype._round = function(val) {
	if (this._options.lineWidth % 2) {
		return Math.round(val-0.5)+0.5;
	} else {
		return Math.round(val);
	}
}

Maze.prototype._random = function() {
	var v = this._randomPool.shift();
	this._randomPool.push(v);
	return v;
}

Maze.prototype._randomUpTo = function(limit) {
	var max = 0;
	var result = 0;
	var pow = 0;
	while (max < limit) {
		max += 1 << pow;
		if (this._random()) { result += 1 << pow; }
		pow++;
	}
	return result;
}
