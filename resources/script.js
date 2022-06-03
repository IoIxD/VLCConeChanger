var imagesLoaded = 0;

window.onload = function() {

	// global variables
	var baseImageWidth = 680;
	var baseImageHeight = 770;

	var imagePositions = [
		[266, 7, 142, 120],
		[224, 114, 232, 162],
		[181, 252, 312, 189],
		[142, 393, 391, 195],
		[0, 486, 675, 287]
	]

	var canvases = document.getElementById("canvases").getElementsByTagName("canvas");
	var contexts = [];
	for(var i = 0; i < canvases.length; i++) {
		canvases[i].style.left = imagePositions[i][0];
		canvases[i].style.top = imagePositions[i][1];
		canvases[i].width = imagePositions[i][2];
		canvases[i].height = imagePositions[i][3];
		contexts[i] = canvases[i].getContext("2d");
	}

	var images = [];
	for(var i = 0; i < 5; i++) {
		images[i] = new Image(imagePositions[i][0], imagePositions[i][1]);
		images[i].src = "./resources/cone"+i+".png";
		images[i].onload = function() {
			imagesLoaded++;
		}
	}

	var warning = document.getElementById("warning");

	// Register a handler for each input to change the image
	var inputs = document.getElementsByTagName("input");
	for(var i = 0; i < inputs.length; i++) {
		changeColor(inputs[i].id, inputs[i].value);
		inputs[i].addEventListener("input", function(e) {
			changeColor(e.target.id, e.target.value);
		})
	}

	// (UNUSED) Register a handler for the "Save Image" button

	/*
	document.getElementById("save").addEventListener("click", function() {
		// Create a canvas for the saved image
		var tempCanvas;
		try { // Chromiun supports OffscreenCanvas
			tempCanvas = new OffscreenCanvas(width,height);
		} catch(ex) { // Firefox has had it as an toggleable option (off by default) for the past five years.
			if(ex.name == "ReferenceError") {
				tempCanvas = document.createElement("canvas");
				tempCanvas.width = baseImageWidth;
				tempCanvas.height = baseImageHeight;
			} else {
				console.error(ex);
				return;
			}
		}
		temp = tempCanvas.getContext("2d");
		pixels = temp.getImageData(0,0,baseImageWidth,baseImageHeight);
		// for each canvas we have
		for(var i = 0; i < canvases.length; i++) {
			// fucking die.
			// we can't use putImageData that'd be too easy (it doesn't account for transparent pixels) so

			// after getting the image data and shit...
			x = imagePositions[i][0];
			y = imagePositions[i][1];
			width = imagePositions[i][2];
			height = imagePositions[i][3];
			newPixels = canvases[i].getContext("2d").getImageData(0,0,width,height);
			// we get the left margin
			margin = (baseImageWidth-width)/2;
			position = x;
			// then we go through each pixel of the source image and place the pixels there, keeping margins in mind.
			for(var y_ = 0; y_ < height; y_++) {
				for(var x_ = 0; x_ < width; x_+=4) {
					pixels.data[x_] = newPixels[position+x_];
					pixels.data[x_+1] = newPixels[position+x_+1];
					pixels.data[x_+2] = newPixels[position+x_+2];
					pixels.data[x_+3] = 255;
				}
				position += x+margin+margin;
			}
			// and then we can putImageData THAT :)
		}
		temp.putImageData(pixels,0,0);
		
		toDownload = tempCanvas.toDataURL();
		mimetype = toDownload.substring(toDownload.indexOf(":")+1, toDownload.indexOf(";")).replace("image/","",2)
		var link = document.createElement("a");
		link.download = "vlc."+mimetype;
		link.href = tempCanvas.toDataURL();
		  document.body.appendChild(link);
		  link.click();
		  document.body.removeChild(link);
		  delete link;

		});
	*/

	async function changeColor(id, color) {
		id = id-1;
		if(imagePositions[id] == undefined) {
			return
		}
		// the positions/dimensions of the image we want to apply
		var x = imagePositions[id][0];
		var y = imagePositions[id][1];
		var width = imagePositions[id][2];
		var height = imagePositions[id][3];

		var ctx = contexts[id];

		// The image we want to change
		var curImage = ctx.getImageData(x,y,width,height);

		// The rgb color to apply to the part of the image we'll change
		var color = hexToRgb(color.replace("#","",2)); 
		// setup an interval to check every half a second if the images are actually loaded.
		var interval = setInterval(function(id, color) {
			// when they aren't, return 
			if(imagesLoaded < 5) {
				return;
			}
			// when they are, remove this interval
			clearInterval(interval); // Clear the interval when we're done with it.

			// Create a canvas for the image we'll load
			var tempCanvas;
			try { // Chromiun supports OffscreenCanvas
				tempCanvas = new OffscreenCanvas(width,height);
			} catch(ex) { // Firefox has had it as an toggleable option (off by default) for the past five years.
				if(ex.name == "ReferenceError") {
					tempCanvas = document.createElement("canvas");
					tempCanvas.width = width;
					tempCanvas.height = height;
				} else {
					console.error(ex);
					return;
				}
			}

			// Load the relevant image into the canvas
			var relevantImage = images[id];
			tempCanvas.getContext("2d").drawImage(relevantImage,0,0,width,height,0,0,width,height);

			var newImage = tempCanvas.getContext("2d").getImageData(0,0,width,height);
			
			// For each pixel in the source image...
			for(var i = 0; i < curImage.data.length; i+=4) {
				// If it's transparent, continue.
				if(newImage.data[i+3] < 64) {continue;}
				// Otherwise, multiply it by the rgb value we were given.

				curImage.data[i] = overlay(newImage.data[i], color.r);
				curImage.data[i+1] = overlay(newImage.data[i+1], color.g);
				curImage.data[i+2] = overlay(newImage.data[i+2], color.b);
				curImage.data[i+3] = 255;
			}

			curImage.data = saturate(curImage.data);

			// Put the modified image on the canvas.
			ctx.putImageData(curImage,0,0);
		},500, id, color)

	}


	// 

	// overlay colors
	function overlay(num1, num2) {
		return num1/255*(num1+2*num2/255*(255-num1))
	}

	// saturation function
	function saturate(pixels) { // expects an array of numbers
		var value = 0.75;
	    for (var i = 0; i < pixels.length; i += 4) {
	    	if(pixels[i+3] < 128) {continue;}
	        var gray = 0.2989*pixels[i] + 0.5870*pixels[i+1] + 0.1140*pixels[i+2]; //weights from CCIR 601 spec
	        pixels[i] = -gray * value + pixels[i] * (1+value);
	        pixels[i+1] = -gray * value + pixels[i+1] * (1+value);
	        pixels[i+2] = -gray * value + pixels[i+2] * (1+value);
	        //normalize over- and under-saturated values
	        if(pixels[i] > 255) pixels[i] = 255;
	        if(pixels[i+1] > 255) pixels[i] = 255;
	        if(pixels[i+2] > 255) pixels[i] = 255;
	        if(pixels[i] < 0) pixels[i] = 0;
	        if(pixels[i+1] < 0) pixels[i] = 0;
	        if(pixels[i+2] < 0) pixels[i] = 0;
	    }
	    return pixels;
	};
	// function i stole from stackoverflow to turn hex codes into rgb
	function hexToRgb(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if(result != null) {
			return {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16)
			}
		} else {
			return null;
		}
	}

	// The warning function
	document.getElementById("inputs").addEventListener("mousemove", warningDisplay);
	document.getElementById("canvases").addEventListener("mouseover",warningDisplay);

	function warningDisplay(e) {
		if(e.srcElement.classList.contains("not-recommended")) {
			warning.style.display = 'block';
			warning.style.top = e.clientY;
			warning.style.left = e.clientX;
		} else {
			warning.style.display = 'none';
			warning.style.top = 0;
			warning.style.left = 0;
		}
	}
}