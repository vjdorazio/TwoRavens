var actorCodeLoaded = true;

//some preperation and activation for gui display
$(document).ready(function() {
	//expands divs with filters
	$(".filterExpand").click(function() {
		if (this.value == "expand") {
			this.value = "collapse";
			$(this).css("background-image", "url(collapse.png)");
			$(this).next().next("div.filterContainer").show("fast");
		}
		else {
			this.value = "expand";
			$(this).css("background-image", "url(expand.png)");
			$(this).next().next("div.filterContainer").hide("fast");
		}
	});

	//enable jquery hover text for various gui elements
	$(".actorBottom, .clearActorBtn, #deleteGroup, .actorShowSelectedLbl, #editGroupName").tooltip({container: "body"});
});

var sourceFilterChecked = [];	//list of filters excluding entities under source that are checked
var sourceEntityChecked = [];	//list of entities under source that are checked
var targetFilterChecked = [];
var targetEntityChecked = [];

var sourceFullList = [];	//list of all sources
var targetFullList = [];	//list of all targets

var orgs = ["IGO", "IMG", "MNC", "NGO"]		//hard coded organizations to remove from entities list; hopefully temporary

var sourceOrgLength = orgs.length, sourceCountryLength;		//variables to keep track number of entities checked to display all checked
var sourceOrgSelect = 0, sourceCountrySelect = 0;

var targetOrgLength = orgs.length, targetCountryLength;
var targetOrgSelect = 0, targetCountrySelect = 0;

var actorType = ["source", "target"];		//these arrays are to help loop through actor loading
var actorOrder = ["Full", "Entity", "Role", "Attr"];

//definition of a node
function nodeObj(name, group, groupIndices, color, actorType, actorID) {
	this.name = name;
	this.group = group;
	this.groupIndices = groupIndices;
	this.nodeCol = color;
	this.actor = actorType;
	this.actorID = actorID;				//this is to keep track of any changes that may have happened in the node
}

//definition of a link
function linkObj(source, target){
	this.source = source;
	this.target = target;
}

var actorNodes = [];
var actorLinks = [];

var currentScreen = [];					//the currently viewed items
var currentTab = "source";

var sourceCurrentNode = null;			//current source node that is selected
var targetCurrentNode = null;
var currentSize = 0;					//total number of nodes
var sourceSize = 0;						//total number of source nodes
var targetSize = 0;
var changeID = 0;						//number that is updated whenever a node is added/changed, set to actorID

//begin force definitions
var actorSVG = d3.select("#actorLinkSVG");

var actorWidth = actorSVG.node().getBoundingClientRect().width;		//not yet set since window has not yet been displayed; defaults to 0
var actorHeight = actorSVG.node().getBoundingClientRect().height;	//this code is here to remind what is under app_ddi_eventdata.js


var boundaryLeft = Math.floor(actorWidth/2) - 20;		//max x coordinate source nodes can move
var boundaryRight = Math.ceil(actorWidth/2) + 20;		//max x coordinate target nodes can move

var actorNodeR = 40;									//various definitions for node display
var actorPadding = 5;
var actorColors = d3.scaleOrdinal(d3.schemeCategory20);
var pebbleBorderColor = '#fa8072';

//var actorForce = d3.layout.force().nodes(actorNodes).links(actorLinks).size([actorWidth, actorHeight]).linkDistance(150).charge(-600).start();		//defines the force layout

var actorForce = d3.forceSimulation(actorNodes)
    .force("link", d3.forceLink(actorLinks).distance(150))
  //  .force('charge', d3.forceManyBody().strength(-600))
    .force('X', d3.forceX(actorWidth))
.force('Y', d3.forceY(actorHeight));
//defines the force layout

var node_drag = d3.drag().on("start", dragstart).on("drag", dragmove).on("end", dragend);		//defines the drag

var dragStarted = false;		//determines if dragging
var dragSelect = null;			//node that has started the drag
var dragTarget = null;			//node that is under the dragged node
var dragTargetHTML = null;		//html for dragTarget

var mousedownNode = null;		//catch for Chrome, check for mouseup + mousedown and manually trigger click

//moves node to back of HTML index in order to allow mouseover detection
d3.selection.prototype.moveToBack = function() {
	return this.each(function() {
		var firstChild = this.parentNode.firstChild;
		if (firstChild) {
			this.parentNode.insertBefore(this, firstChild);
		}
	});
};

//define arrow markers
actorSVG.append('svg:defs').append('svg:marker').attr('id', 'end-arrow').attr('viewBox', '0 -5 10 10').attr('refX', 6).attr('markerWidth', 3).attr('markerHeight', 3).attr('orient', 'auto').append('svg:path').attr('d', 'M0,-5L10,0L0,5').style('fill', '#000');

actorSVG.append('svg:defs').append('svg:marker').attr('id', 'start-arrow').attr('viewBox', '0 -5 10 10').attr('refX', 4).attr('markerWidth', 3).attr('markerHeight', 3).attr('orient', 'auto').append('svg:path').attr('d', 'M10,-5L0,0L10,5').style('fill', '#000');

//define SVG mouse actions
actorSVG.on("mouseup", function(d){		//cancel draw line
	lineMouseup();
}).on("contextmenu", function(d){		//prevent right click on svg
	d3.event.preventDefault();
});

//all links in SVG
var linkGroup = actorSVG.append("svg:g").attr("class", "allLinksGroup").selectAll("path");

//all nodes in SVG
var nodeGroup = actorSVG.append("svg:g").attr("class", "allNodesGroup").selectAll("g");

//draw the drag line last to show it over the nodes when dragging
var drag_line = actorSVG.append('svg:path').attr('class', 'link dragline hidden').attr('d', 'M0,0L0,0');

var tooltipSVG = d3.select(actorSVG.node().parentNode).append("div").attr("class", "SVGtooltip").style("opacity", 0);

var originNode = null;				//node that is the start of drag link line
var destNode = null;				//node that is the end of the drag link line

updateSVG();						//updates SVG elements

actorForce.on("tick", tick);		//custom tick function

//end force definitions, begin force functions

//function called at start of drag
function dragstart(d, i) {
	actorForce.stop();		// stops the force auto positioning before you start dragging
	dragStarted = true;
	dragSelect = d;
	tooltipSVG.transition().duration(200).style("opacity", 0).style("display", "none");
	d3.select(this).moveToBack();
}

//function called while dragging, binds (x, y) within SVG and boundaries
function dragmove(d, i) {
	d.x = Math.max(actorNodeR, Math.min(actorWidth - actorNodeR, d3.event.x));
	d.y = Math.max(actorNodeR, Math.min(actorHeight - actorNodeR, d3.event.y));
	tick();
}

//function called at end of drag, merges dragSelect and dragTarget if dragTarget exists
function dragend(d, i) {
	//merge dragSel and dragTarg
	if (dragTarget){
		d3.select(dragTargetHTML).transition().attr("r", actorNodeR);		//transition back to normal size

		//merge dragSel.group to dragTarg.group
		for (var x = 0; x < dragSelect.group.length; x ++) {
			if (dragTarget.group.indexOf(dragSelect.group[x]) < 0) {
				dragTarget.group.push(dragSelect.group[x]);
				dragTarget.groupIndices.push(dragSelect.groupIndices[x]);
			}
		}

		//update checks in actor selection
		for (var x = 0; x < dragTarget.groupIndices.length; x ++)
			$("#" + dragTarget.groupIndices[x]).prop("checked", "true");

		//merge dragSel links to dragTarg
		for (var x = 0; x < actorLinks.length;x ++) {
			if (actorLinks[x].source == dragSelect)
				actorLinks[x].source = dragTarget;
			else if (actorLinks[x].target == dragSelect)
				actorLinks[x].target = dragTarget;
		}

		actorNodes.splice(actorNodes.indexOf(dragSelect), 1);		//remove the old node

		dragTarget.actorID = changeID;
		changeID ++;												//update actorID so SVG can update
		//now set gui to show dragTarget data
		window[dragTarget.actor + "CurrentNode"] = dragTarget;
		$("#" + dragTarget.actor + "TabBtn").trigger("click");
		updateGroupName(window[currentTab + "CurrentNode"].name);
		$("#clearAll" + capitalizeFirst(currentTab) + "s").click();

		$("#" + currentTab + "ShowSelected").trigger("click");
		
		updateAll();
	}
	dragStarted = false;		//now reset all drag variables
	dragSelect = null;
	dragTarget = null;
	dragTargetHTML = null;
	tick();
	actorForce.restart();
}

//updates elements in SVG, nodes updated on actorID
function updateSVG(){
	//update links
	linkGroup = linkGroup.data(actorLinks);

	linkGroup.enter().append('svg:path')
		.attr('class', 'link')
		.style('marker-start', function(d) { return d.source.actor == "target" ? 'url(#start-arrow)' : ''; })
		.style('marker-end', function(d) { return d.target.actor == "target" ? 'url(#end-arrow)' : ''; })
		.on('mousedown', function(d) {							//delete link
			var obj1 = JSON.stringify(d);
			for(var j = 0; j < actorLinks.length; j++) {		//this removes the links on click
				if(obj1 === JSON.stringify(actorLinks[j])) {
					actorLinks.splice(j,1);
				}
			}
			updateAll();
		});
		
	// remove old links
	linkGroup.exit().remove();

	//now update nodes
	nodeGroup = nodeGroup.data(actorNodes, function(d){return d.actorID;});

	//define circle for node
	var innerNode = nodeGroup.enter().append("g").attr("id", function(d){return d.name + "Group";}).call(node_drag);
	innerNode.append("circle").attr("class", "actorNode").attr("r", actorNodeR)
		.style('fill', function(d){return d.nodeCol;})
		.style('opacity', "0.5")
		.style('stroke', pebbleBorderColor)
		.style("pointer-events", "all")
		.on("contextmenu", function(d){		//begins drag line drawing for linking nodes
			d3.event.preventDefault();
			d3.event.stopPropagation();		//prevents mouseup on node

			originNode = d;

			drag_line.style('marker-end', function(){		//displays arrow in proper direction (source->target and target->source)
					if (d.actor == "source")
						return 'url(#end-arrow)';
					else
						return '';
				})
				.style('marker-start', function(){
					if (d.actor == "target")
						return 'url(#start-arrow)';
					else
						return '';
				})
				.classed('hidden', false).attr('d', 'M' + originNode.x + ',' + originNode.y + 'L' + originNode.x + ',' + originNode.y);

			actorSVG.on('mousemove', lineMousemove);
		})
		.on("mouseup", function(d){			//creates link
			d3.event.stopPropagation();		//prevents mouseup on svg
			createLink(d);
			nodeClick(d);
			mousedownNode = null;
		})
		.on("mousedown", function(d){		//creates link if mouseup did not catch
			createLink(d);
			mousedownNode = d;
		})
		.on("mouseover", function(d){		//displays animation for visual indication of mouseover while dragging and sets tooltip
			if(dragSelect && dragSelect != d && dragSelect.actor == d.actor) {
				d3.select(this).transition().attr("r", actorNodeR + 10);
				dragTarget = d;
				dragTargetHTML = this;
			}

			if (!dragStarted) {
				tooltipSVG.html(d.name).style("display", "block");
				tooltipSVG.transition().duration(200).style("opacity", 1);
			}
		})
		.on("mouseout", function(d){		//display animation for visual indication of mouseout and resets dragTarget variables
			d3.select(this).transition().attr("r", actorNodeR);
			dragTarget = null;
			dragTargetHTML = null;

			tooltipSVG.transition().duration(200).style("opacity", 0).style("display", "none");		//reset tooltip
		})
		.on("mousemove", function(d){		//display tooltip
			if (!dragStarted)
				tooltipSVG.style("display", "block").style("left", (d3.event.pageX - 250) + "px").style("top", (d3.event.pageY - 75) + "px");
		});

	//performs on "click" of node, shows actor selection on node click
	function nodeClick(d) {
		if (window[d.actor + "CurrentNode"] === d) {
			$("#" + d.actor + "TabBtn").trigger("click");
		}
		else if (window[currentTab + "CurrentNode"] !== d) {			//only update gui if selected node is different than the current
			$("#" + d.actor + "TabBtn").trigger("click");
			window[currentTab + "CurrentNode"] = d;

			//update gui
			updateGroupName(d.name);
			$("#clearAll" + capitalizeFirst(currentTab) + "s").click();

			//update actor selection checks
			$("." + currentTab + "Chk:checked").prop("checked", false);
			for (var x = 0; x < d.groupIndices.length; x ++)
				$("#" + d.groupIndices[x]).prop("checked", true);
				
			$("#" + currentTab + "ShowSelected").trigger("click");
		}
	}

	//creates link between nodes
	function createLink(d) {
		if (d3.event.which == 3) {	//mouse button was right click, so interpret as user wants to create another line instead
			return;
		}

		if(!originNode)				//if no origin node is selected then return
			return;

		drag_line.classed('hidden', true).style('marker-end', '');		//hide drag line

		// check for drag-to-self and same actor to actor (source to source)
		destNode = d;
		if (destNode === originNode || destNode.actor == originNode.actor){
			resetMouseVars();
			return;
		}

		//here link is now made
		var actualSource = originNode.actor == "source" ? originNode : destNode;	//choose the node that is a source
		var actualTarget = destNode.actor == "target" ? destNode : originNode;

		if (actorLinks.filter(function(linkItem){return (linkItem.source == actualSource && linkItem.target == actualTarget);})[0]){
			//link exists, no need to make it again
			return;
		}
		else {
			//add link
			actorLinks.push(new linkObj(actualSource, actualTarget));
			updateAll();
		}

		resetMouseVars();
	}	//end of createLink()

	innerNode.append('svg:text').attr('x', 0).attr('y', 15).attr('class', 'id').text(function(d){	//add text to nodes
		if (d.name.length > 12)
			return d.name.substring(0, 9) + "...";
		else
			return d.name;
	});
	
	nodeGroup.exit().remove();		//remove any nodes that are not part of the display
	
	//update all names of nodes - changeID and actorID are not updated on name change to save room for other changes; probably unneccesary for a normal user (unlikely they will perform so many changes)
	actorSVG.selectAll("text").text(function(d) {
		if (d.name.length > 12)
			return d.name.substring(0, 9) + "...";
		else
			return d.name;
	});
}

//function that is called on every animated step of the SVG, handles boundary and node collision
function tick(e) {
	if (e) {	//if not dragging
		actorNodes.forEach(function(o, i) {		//o = object, i = index
			o.x += (o.actor == "source") ? e.alpha * -5 : e.alpha * 5;			//groups same actors together
		});

		var q = d3.geom.quadtree(actorNodes), i = 0, n = actorNodes.length;		//prevent node collisions
		while( ++i < n) q.visit(collide(actorNodes[i]));
	}

	//node movement and display constrained here
	nodeGroup.attr("transform", function(d) {
		d.x = Math.max(actorNodeR, Math.min(actorWidth - actorNodeR, d.x));		//test SVG boundary conditions
		d.y = Math.max(actorNodeR, Math.min(actorHeight - actorNodeR, d.y));
		if (d.actor == "source" && d.x > boundaryLeft)		//test source/target boundary conditions
			d.x = boundaryLeft;
		if (d.actor == "target" && d.x < boundaryRight)
			d.x = boundaryRight;
		return "translate(" + d.x + "," + d.y + ")";
	});

	//node outline defined here
	actorSVG.selectAll("circle").style("stroke", function(d) {
		//give selected node a black outline, and all other nodes the default color
		if (d == window[currentTab + "CurrentNode"]) {
			return "#000000";
		}
		else {
			return pebbleBorderColor;
		}
	}).style("stroke-width", function(d) {
		//give selected node a thicker 3px outline, and all other nodes the default 1px
		if (d == window[currentTab + "CurrentNode"])
			return 3;
		else
			return 1;
	});

	//link movement and display determined here
	linkGroup.attr('d', function(d){
		var deltaX = d.target.x - d.source.x,
		deltaY = d.target.y - d.source.y,
		dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
		normX = deltaX / dist,
		normY = deltaY / dist,
		sourcePadding = (d.source.actor == "target") ? actorNodeR+5 : actorNodeR,		//spacing on the line before arrow head
		targetPadding = (d.target.actor == "target") ? actorNodeR+5 : actorNodeR,
		sourceX = d.source.x + (sourcePadding * normX),
		sourceY = d.source.y + (sourcePadding * normY),
		targetX = d.target.x - (targetPadding * normX),
		targetY = d.target.y - (targetPadding * normY);
		  
		return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
	});
}

//function called per tick() to prevent collisions among nodes
function collide(node) {
	var r = actorNodeR + actorPadding, nx1 = node.x - r, nx2 = node.x + r, ny1 = node.y - r, ny2 = node.y + r;
	return function(quad, x1, y1, x2, y2) {
		if (quad.point && (quad.point !== node)) {
			var x = node.x - quad.point.x, y = node.y - quad.point.y, l = Math.sqrt(x * x + y * y), r = actorNodeR + actorNodeR + actorPadding;

			if (l < r) {
				l = (l - r) / l * .5;
				node.x -= x *= l;
				node.y -= y *= l;
				quad.point.x += x;
				quad.point.y += y;
			}
		}
		return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
	};
}

//if dragging update drag line to mouse coordinates, called on mousemove on SVG
function lineMousemove() {
	if(!originNode) return;

	// update drag line
	drag_line.attr('d', 'M' + originNode.x + ',' + originNode.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
}

//if dragging hide line, called on mouseup on SVG
function lineMouseup() {
	if (originNode) {
		// hide drag line
		drag_line.classed('hidden', true).style('marker-end', '');
	}    
	// clear mouse event vars
	resetMouseVars();
}

//reset drag link node variables
function resetMouseVars() {
	originNode = null;
	destNode = null;
}

//function to handle force and SVG updates
function updateAll() {
	actorForce.stop();
	actorForce = actorForce.nodes(actorNodes)
    .force("link", d3.forceLink(actorLinks));
	resetMouseVars();
	updateSVG();
}


//end force functions, begin actor code

//rename group on click, initialize groups
$(document).ready(function() {
	//default group display on page load, adds default source/target to nodes and SVG
	$("#editGroupName").ready(function() {
		actorNodes.push(new nodeObj("Source 0", [], [], actorColors(currentSize), "source", changeID));
		currentSize ++;
		sourceSize ++;
		changeID ++;
		actorNodes.push(new nodeObj("Target 0", [], [], actorColors(currentSize), "target", changeID));
		currentSize ++;
		targetSize ++;
		changeID ++;
		sourceCurrentNode = actorNodes[0];
		targetCurrentNode = actorNodes[1];
	});

	//visual feedback for name changing
	$("#editGroupName").click(function() {
		$("#editGroupName").css("background-color", "white").css("border", "1px solid black");
	});

	//catch enter and escape key
	$("#editGroupName").keydown(function(e) {
		if (e.keyCode == 13 || e.keyCode == 27) {		//enter or escape key pressed
			$("#editGroupName").focusout();
			$("#" + currentTab + "TabBtn").focus();		//remove focus
		}
	});

	//save changes to group name
	$("#editGroupName").focusout(function() {
		var newGroupName = $("#editGroupName").val().trim();
		if (newGroupName == "") {		//revert to previous name if none entered
			newGroupName = window[currentTab + "CurrentNode"].name;
		}
		//remove visual feedback
		$("#editGroupName").css("background-color", "#F9F9F9").css("border", "none");
		//update in nodes data structure
		window[currentTab + "CurrentNode"].name = newGroupName;
		//update DOM
		updateGroupName(newGroupName);

		updateAll();		//update force
	});

	//remove a group if possible
	$("#deleteGroup").click(function() {
		var cur = actorNodes.indexOf(window[currentTab + "CurrentNode"]);
		var prev = cur - 1;
		var next = cur + 1;
		while (true) {
			if (actorNodes[prev] && actorNodes[prev].actor == currentTab) {
				//set previous node to current and remove old
				window[currentTab + "CurrentNode"] = actorNodes[prev];
				updateGroupName(actorNodes[prev].name);

				$("#clearAll" + capitalizeFirst(currentTab) + "s").click();
				//update actor selection checks
				$("." + currentTab + "Chk:checked").prop("checked", false);
				for (var x = 0; x < actorNodes[prev].groupIndices.length; x ++)
					$("#" + actorNodes[prev].groupIndices[x]).prop("checked", true);
				$("#" + currentTab + "ShowSelected").trigger("click");

				//update links
				for (var x = 0; x < actorLinks.length; x ++) {
					if (actorLinks[x].source == actorNodes[cur])
						actorLinks.splice(x, 1);
					else if (actorLinks[x].target == actorNodes[cur])
						actorLinks.splice(x , 1);
				}
				actorNodes.splice(cur, 1);
				updateAll();
				return;
			}
			else if (actorNodes[next] && actorNodes[next].actor == currentTab) {
				//set next node to current and remove old
				window[currentTab + "CurrentNode"] = actorNodes[next];
				updateGroupName(actorNodes[next].name);

				$("#clearAll" + capitalizeFirst(currentTab) + "s").click();
				//update actor selection checks
				$("." + currentTab + "Chk:checked").prop("checked", false);
				for (var x = 0; x < actorNodes[next].groupIndices.length; x ++)
					$("#" + actorNodes[next].groupIndices[x]).prop("checked", true);
				$("#" + currentTab + "ShowSelected").trigger("click");

				//update links
				for (var x = 0; x < actorLinks.length; x ++) {
					if (actorLinks[x].source == actorNodes[cur])
						actorLinks.splice(x, 1);
					else if (actorLinks[x].target == actorNodes[cur])
						actorLinks.splice(x , 1);
				}
				actorNodes.splice(cur, 1);
				updateAll();
				return;
			}
			else {
				//update search in both directions
				if (prev > -1)
					prev --;
				if (next < actorNodes.length)
					next ++;
				if (prev == -1 && next == actorNodes.length)
					break;
			}
		}
		alert("Need at least one " + currentTab + " node!");
	});
});

//update display of group name
function updateGroupName(newGroupName) {
	$("#editGroupName").attr("placeholder", newGroupName);
	$("#editGroupName").val(newGroupName);
}

//switches tabs in actor subset, sets current and active nodes
function actorTabSwitch(origin, tab) {
	switch(origin) {
		case "sourceTabBtn":
			document.getElementById("targetDiv").style.display = "none";
			$("#targetTabBtn").removeClass("active").addClass("btn-default");
			$("#sourceTabBtn").removeClass("btn-default").addClass("active");
			currentTab = "source";
			break;
		default:	//other button (targetTabBtn)
			document.getElementById("sourceDiv").style.display = "none";
			$("#sourceTabBtn").removeClass("active").addClass("btn-default");
			$("#targetTabBtn").removeClass("btn-default").addClass("active");
			currentTab = "target";
			break;
	}

	updateGroupName(window[currentTab + "CurrentNode"].name);
	document.getElementById(tab).style.display = "inline-block";
	tick();
}

//load dictionary and data
window.onload = function(){
	//read dictionary and store for fast retrieval
	var dict;

	//loads the dictionary for translation
	var loadDictionary = function() {
		var defer = $.Deferred();
		$.get('data/dict_sorted.txt', function (data) {
			dict = data.split('\n');
			dict.length--;	//remove last element(empty line)
			defer.resolve();
		});
		return defer;		//return dictionary load completed
	};

	//loads the data
	var loadData = function() {
		var defer = $.Deferred();
		for (var m = 0; m < actorType.length; m++) {
			var orgList;
			if (m == 0) {
				orgList = document.getElementById("orgSourcesList");
			}
			else {
				orgList = document.getElementById("orgTargetsList");
			}
			for (var y = 0; y < orgs.length; y ++) {
				createElement(true, actorType[m], "Org", orgs[y], y, orgList);
			}

			for (var i = 0; i < actorOrder.length; i++) {
				loadDataHelper(i, m);
			}
		}
		return defer.resolve();
	};

	loadDictionary().then(loadData);		//force dict to load first then load everything else
	$("#sourceTabBtn").trigger("click");

	//handles data selection and read asynchronously to help speed up load
	function loadDataHelper(i,m) {
		$.get('data/' + actorType[m] + actorOrder[i] + '.csv', function(data) {
			var lines = data.split('\n');
			var displayList;
			var chkSwitch = true;		//enables code for filter
			switch (i) {
				case 0:
					displayList = document.getElementById("searchList" + capitalizeFirst(actorType[m]) + "s");
					chkSwitch = false;
					break;
				case 1:
					displayList = document.getElementById("country" + capitalizeFirst(actorType[m]) + "sList");
					lines = lines.filter(function(val) {
						return (orgs.indexOf(val) == -1);
					});
					window[actorType[m] + "CountryLength"] = lines.length;
					actorOrder[i] = "Country";
					break;
				case 2:
					displayList = document.getElementById("role" + capitalizeFirst(actorType[m]) + "sList");
					break;
				case 3:
					displayList = document.getElementById("attribute" + capitalizeFirst(actorType[m]) + "sList");
					break;
				}

			for (var x = 0; x < lines.length - 1; x++) {
				var lineData = lines[x].replace(/["]+/g, '');
				createElement(chkSwitch, actorType[m], actorOrder[i], lineData, x, displayList);

				switch (actorType[m] + actorOrder[i]) {
					case "sourceFull":
						sourceFullList.push(lineData);
						currentScreen.push(x);
						break;
					case "targetFull":
						targetFullList.push(lineData);
						currentScreen.push(x);
						break;
				}
			}
			if (actorOrder[i] == "Country") {
				actorOrder[i] = "Entity";
			}
		});
	}

	//creates elements and adds to display
	function createElement(chkSwitch = true, type, order, value, x, displayList) {
		var seperator = document.createElement("div");
		seperator.className = "seperator";

		var chkbox = document.createElement("input");
		chkbox.type = "checkbox";
		chkbox.name = type + order + "Check";
		chkbox.id = type + order + "Check" + x;
		chkbox.value = value;
		if (order != "Full") {
			chkbox.className = "actorChk";
		}
		else {
			chkbox.className = type + "Chk";
		}
		
		if (chkSwitch) {
			chkbox.onchange = function(){actorFilterChanged(this);};
		}
		else {
			chkbox.onchange = function(){actorSelectChanged(this);};
		}

		var lbl = document.createElement("label");
		lbl.htmlFor = type + order + "Check" + x;
		lbl.className = "actorChkLbl";
		lbl.id = type + order + "Lbl" + x;
		lbl.innerHTML = value;

		lbl.setAttribute("data-container", "body");
		lbl.setAttribute("data-toggle", "popover");
		lbl.setAttribute("data-placement", "right");
		lbl.setAttribute("data-trigger", "hover");

		displayList.appendChild(chkbox);
		displayList.appendChild(lbl);
		displayList.appendChild(seperator);

		$("#" + lbl.id).mouseover(function() {
			if (!$(this).attr("data-content")) {
				if (order != "Full")
					$(this).attr("data-content", binarySearch(value));
				else {
					var head = binarySearch(value);
						var tail = "";
						for (var x = 0; x < value.length; x += 3) {
							var temp = binarySearch(value.substring(x, x+3));
							if (temp == "no translation found")
								temp = "?";
							tail += temp + " ";
						}
						tail = tail.trim();

						if (head == "no translation found")
							$(this).attr("data-content", tail);
						else {
							if (head != tail)
								$(this).attr("data-content", head + "; " + tail);
							else
								$(this).attr("data-content" , head);
						}
				}
			}
			$(this).popover("toggle");
		});

		$("#" + lbl.id).mouseout(function() {
			$(this).popover("toggle");
		});

		function binarySearch(element) {
			var l = 0, r = dict.length-1;
			while (l <= r) {
				var m = Math.floor((l + r)/2);
				var head = dict[m].split("\t")[0];
				if (head == element) {
					return dict[m].split("\t")[1];
				}
				else {
					if (head < element) {
						l = m + 1;
					}
					else {
						r = m - 1;
					}
				}
			}
			return "no translation found";
		}
	}
}

//when an actor selected, add into currentNode.group
function actorSelectChanged(element) {
	element.checked = !!(element.checked);
	if (element.checked) {					//add into group
		if (window[currentTab + "CurrentNode"].group.indexOf(element.value < 0)) {		//perhaps change to a set
			window[currentTab + "CurrentNode"].group.push(element.value);
			window[currentTab + "CurrentNode"].groupIndices.push(element.id);
		}
	}
	else {									//remove from group
		var index = window[currentTab + "CurrentNode"].group.indexOf(element.value);
		if (index > -1) {
			window[currentTab + "CurrentNode"].group.splice(index, 1);
			window[currentTab + "CurrentNode"].groupIndices.splice(index, 1);
		}
	}
}

//when filter checkbox checked, add or remove filter
function actorFilterChanged(element) {
	element.checked = !!(element.checked);
	var ending = getActorEnding(element);
	if (element.checked) {
		$("#" + currentTab + "ShowSelected").prop("checked", false);
		
		if (ending == "orga" || ending == "coun") {
			window[currentTab + "EntityChecked"].push(element.value + ending);
			switch(ending) {
				case "orga":
					window[currentTab + "OrgSelect"]++;
					if (window[currentTab + "OrgSelect"] == window[currentTab + "OrgLength"]) {
						$("#" + currentTab + "OrgAllCheck").prop("checked", true);
						$("#" + currentTab + "OrgAllCheck").prop("indeterminate", false);
					}
					else {
						$("#" + currentTab + "OrgAllCheck").prop("checked", false);
						$("#" + currentTab + "OrgAllCheck").prop("indeterminate", true);
					}
					break;
				case "coun":
					window[currentTab + "CountrySelect"]++;
					if (window[currentTab + "CountrySelect"] == window[currentTab + "CountryLength"]) {
						$("#" + currentTab + "CountryAllCheck").prop("checked", true);
						$("#" + currentTab + "CountryAllCheck").prop("indeterminate", false);
					}
					else {
						$("#" + currentTab + "CountryAllCheck").prop("check", false);
						$("#" + currentTab + "CountryAllCheck").prop("indeterminate", true);
					}
					break;
				}
		}
		else {
			window[currentTab + "FilterChecked"].push(element.value + ending);
		}
	}
	else {
		if (ending == "orga" || ending == "coun"){
			var index = window[currentTab + "EntityChecked"].indexOf(element.value + ending);
			if (index > -1 ) {
				window[currentTab + "EntityChecked"].splice(index, 1);
				switch(ending) {
				case "orga":
					window[currentTab + "OrgSelect"]--;
					if (window[currentTab + "OrgSelect"] == 0) {
						$("#" + currentTab + "OrgAllCheck").prop("checked", false);
						$("#" + currentTab + "OrgAllCheck").prop("indeterminate", false);
					}
					else {
						$("#" + currentTab + "OrgAllCheck").prop("checked", false);
						$("#" + currentTab + "OrgAllCheck").prop("indeterminate", true);
					}
					break;
				case "coun":
					window[currentTab + "CountrySelect"]--;
					if (window[currentTab + "CountrySelect"] == 0) {
						$("#" + currentTab + "CountryAllCheck").prop("checked", false);
						$("#" + currentTab + "CountryAllCheck").prop("indeterminate", false);
					}
					else {
						$("#" + currentTab + "CountryAllCheck").prop("check", false);
						$("#" + currentTab + "CountryAllCheck").prop("indeterminate", true);
					}
					break;
				}
			}
		}
		else {
			var index = window[currentTab + "FilterChecked"].indexOf(element.value + ending);
			if (index > -1) {
				window[currentTab + "FilterChecked"].splice(index, 1);
			}
		}
	}
	actorSearch(currentTab);
}

//returns a string of the type of filter; element is a checkbox
function getActorEnding(element) {
	switch (element.name.substring(6)) {
		case "OrgCheck":
			return "orga";
		case "CountryCheck":
			return "coun";
		case "RoleCheck":
			return "role";
		case "AttrCheck":
			return "attr";
	}
}

//returns a string with the actor ending stripped
function removeEnding(str) {
	return str.substring(0, str.length - 4);
}

//clears search and filter selections
$(".clearActorBtn").click(function(event) {
	clearChecks();
	actorSearch(currentTab);
});

//performs clearing of all filter checks
function clearChecks() {
	document.getElementById(currentTab + "Search").value = "";
	$("#" + currentTab + "Filter :checkbox").prop("checked", false);
	window[currentTab + "FilterChecked"].length = 0;
	window[currentTab + "EntityChecked"].length = 0;
	window[currentTab + "OrgSelect"] = 0;
	$("#" + currentTab + "OrgAllCheck").prop("checked", false).prop("indeterminate", false);
	window[currentTab + "CountrySelect"] = 0;
	$("#" + currentTab + "CountryAllCheck").prop("checked", false).prop("indeterminate", false);
}

//clear search box when reloading page
$(".actorSearch").ready(function() {
	$(".actorSearch").val("");
});

//when typing in search box
$(".actorSearch").on("keyup", function(event) {
	actorSearch(currentTab);
});

//on load of page, keep actorShowSelected unchecked
$(".actorShowSelected").ready(function() {
	$(".actorShowSelected").prop("checked", false);
});

//called when showing only selected elements, element is the checkbox calling the function
function showSelected(element) {
	if (element.checked) {
		currentScreen.length = 0;
		clearChecks();

		$("#" + element.id).prop("checked", true);		//set self to checked because clearChecks() removes the check
	
		$("." + currentTab + "Chk").each(function(i, element) {
			if (element.checked) {
				currentScreen.push(i);
				$("#" + element.id).css("display", "inline-block")
				$("#" + element.id).next().css("display", "inline-block");		//set label for checkbox to visible
			}
			else {
				$("#" + element.id).css("display", "none");
				$("#" + element.id).next().css("display", "none");
			}
		});
	}
	else
		$("#clearAll" + capitalizeFirst(currentTab) + "s").click();		//later implement to restore previous view?
}

//on load of page, keep checkbox for selecting all filters unchecked
$(".allCheck").ready(function() {
	$(".allCheck").prop("checked", false);
});

//selects all checks for specified element, handles indeterminate state of checkboxes
$(".allCheck").click(function(event) {
	var currentEntityType = event.target.id.substring(6, 9);
	var currentElement = (currentEntityType == "Org") ? $("#" + currentTab + currentEntityType + "AllCheck") : $("#" + currentTab + "CountryAllCheck");

	currentElement.prop("indeterminate", false);
	if (currentElement.prop("checked")) {
		if (currentEntityType == "Org") {
			$("#org" + capitalizeFirst(currentTab) + "sList input:checkbox:not(:checked)").each(function() {
				window[currentTab + "EntityChecked"].push(this.value + "orga");
				$(this).prop("checked", true);
			});
			window[currentTab + "OrgSelect"] = window[currentTab + "OrgLength"];
		}
		else {
			$("#country" + capitalizeFirst(currentTab) + "sList input:checkbox:not(:checked)").each(function() {
				window[currentTab + "EntityChecked"].push(this.value + "coun");
				$(this).prop("checked", true);
			});
			window[currentTab + "CountrySelect"] = window[currentTab + "CountryLength"];
		}
	}
	else {
		if (currentEntityType == "Org") {
			$("#org" + capitalizeFirst(currentTab) + "sList input:checkbox:checked").each(function() {
				window[currentTab + "EntityChecked"].splice(window[currentTab + "EntityChecked"].indexOf(this.value + "orga"), 1);
				$(this).prop("checked", false);
			});
			window[currentTab + "OrgSelect"] = 0;
		}
		else {
			$("#country" + capitalizeFirst(currentTab) + "sList input:checkbox:checked").each(function() {
				window[currentTab + "EntityChecked"].splice(window[currentTab + "EntityChecked"].indexOf(this.value + "coun"), 1);
				$(this).prop("checked", false);
			});
			window[currentTab + "CountrySelect"] = 0;
		}
	}
	actorSearch(currentTab);
});

//adds all of the current matched items into the current selection
$(".actorSelectAll").click(function(event) {
	for (var x = 0; x < currentScreen.length; x++) {
		if (window[currentTab + "CurrentNode"].group.indexOf(window[currentTab + "FullList"][currentScreen[x]]) < 0) {
			window[currentTab + "CurrentNode"].group.push(window[currentTab + "FullList"][currentScreen[x]]);
			window[currentTab + "CurrentNode"].groupIndices.push(currentTab + "FullCheck" + currentScreen[x]);
		}
		$("#" + currentTab + "FullCheck" + currentScreen[x]).prop("checked", true);
	}
});

//clears all of the current matched items from the current selection
$(".actorClearAll").click(function(event) {
	if ($("#" + currentTab + "ShowSelected").prop("checked")) {
		$("#" + currentTab + "ShowSelected").prop("checked", false);
		$("#clearAll" + capitalizeFirst(currentTab) + "s").click();
	}
	
	for (var x = 0; x < currentScreen.length; x++) {
		index = window[currentTab + "CurrentNode"].group.indexOf(window[currentTab + "FullList"][currentScreen[x]]);
		if (index > -1) {
			window[currentTab + "CurrentNode"].group.splice(index, 1);
			window[currentTab + "CurrentNode"].groupIndices.splice(index, 1);
			$("#" + currentTab + "FullCheck" + currentScreen[x]).prop("checked", false);
		}
	}
});

//adds a new group for source/target
$(".actorNewGroup").click(function(event) {
	actorNodes.push(new nodeObj(capitalizeFirst(currentTab) + " " + window[currentTab + "Size"], [], [], actorColors(currentSize), currentTab, changeID));
	window[currentTab + "Size"] ++;
	currentSize ++;
	changeID ++;
	
	window[currentTab + "CurrentNode"] = actorNodes[actorNodes.length - 1];
	updateGroupName(window[currentTab + "CurrentNode"].name);
	//update gui
	$("#clearAll" + capitalizeFirst(currentTab) + "s").click();
	$("." + currentTab + "Chk:checked").prop("checked", false);
	//update svg
	updateAll();
});

//searches for the specified text and filters (maybe implement escape characters for text search?), and sets currentScreen as an array of items matching criteria
function actorSearch(actorName) {
	currentScreen.length = 0;
	actorName = actorName.toLowerCase();
	var searchText = $("#" + actorName + "Search").val().toUpperCase();

	var listLen = window[actorName + "FullList"].length;
	for (var x = 0; x < listLen; x++) {
		var matched = false;
		//search for entity
		var tempLen = window[actorName + "EntityChecked"].length;
		for (var i = 0; i < tempLen; i++) {
			if (removeEnding(window[actorName + "EntityChecked"][i]) == window[actorName + "FullList"][x].substring(0, 3)) {
				matched = true;
				break;
			}
		}
		if (!matched && window[actorName + "EntityChecked"].length > 0) {
			$("#" + actorName + "FullCheck"+x).css("display", "none");
			$("#" + actorName + "FullLbl" + x).css("display", "none");
		}
		else {
			var matchFilter = true;
			//search for text
			if (searchText != "" && window[actorName + "FullList"][x].indexOf(searchText) == -1) {
				matchFilter = false;
			}

			//search for other filters
			tempLen = window[actorName + "FilterChecked"].length;
			for (var i = 0; matchFilter && i < tempLen; i++) {
				var index = window[actorName + "FullList"][x].indexOf(removeEnding(window[actorName + "FilterChecked"][i]));
				if (index < 0) {
					matchFilter = false;
				}
				else {
					if (removeEnding(window[actorName + "FilterChecked"][i]).length == 3 && index%3 != 0) {
						matchFilter = false;
					}
				}
			}
			if (matchFilter) {
				$("#" + actorName + "FullCheck"+x).css("display", "inline-block");
				$("#" + actorName + "FullLbl" + x).css("display", "inline-block");
				currentScreen.push(x);
			}
			else {
				$("#" + actorName + "FullCheck"+x).css("display", "none");
				$("#" + actorName + "FullLbl" + x).css("display", "none");
			}
		}
	}
}

//does as its name says; returns a string with the first character capitalized
function capitalizeFirst(str) {
	return str.charAt(0).toUpperCase() + str.substring(1);
}

//end of actor code
