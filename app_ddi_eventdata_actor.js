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

	//enable hover text for bottom buttons
	$(".actorBottom, .clearActorBtn, #deleteGroup").tooltip({container: "body"});
});

var sourceFilterChecked = [];
var sourceEntityChecked = [];
var targetFilterChecked = [];
var targetEntityChecked = [];

var sourceFullList = [];
var targetFullList= [];

var orgs = ["IGO", "IMG", "MNC", "NGO"]		//hard coded organizations to remove from entities list; hopefully temporary

var sourceOrgLength = orgs.length, sourceCountryLength;
var sourceOrgSelect = 0, sourceCountrySelect = 0;

var targetOrgLength = orgs.length, targetCountryLength;
var targetOrgSelect = 0, targetCountrySelect = 0;

var actorType = ["source", "target"];
var actorOrder = ["Full", "Entity", "Role", "Attr"];

//~ function group(name, subcategories) {		//rework this; define a group as title and subcategories
	//~ this.title = name;
	//~ this.nodes = subcategories;
//~ }

//~ function nodeObj(name, color, actorType, actorID) {
	//~ this.name = name;
	//~ this.nodeCol = color;
	//~ this.actor = actorType;
	//~ this.actorID = actorID;
//~ }

function nodeObj(name, group, color, actorType) {
	this.name = name;
	this.group = group;
	this.nodeCol = color;
	this.actor = actorType;
	//~ this.actorID = actorID;
}

function linkObj(source, target){
	this.source = source;
	this.target = target;
}

//~ var sourceCurrentGroupNum = 0;					//the current source group user is on
//~ var sourceGroups = [new group("Source Group 0", [])];		//the corresponding source group
//~ var targetCurrentGroupNum = 0;
//~ var targetGroups = [new group("Target Group 0", [])];

var nodes = [];
//~ nodes.push(new nodeObj("source0RIPoverflow", colors(0), "source", 0));
//~ nodes.push(new nodeObj("anotherSource", colors(1), "source", 1));
//~ nodes.push(new nodeObj("target0", colors(2), "target", 0));
var links = [];

var currentScreen = [];						//the currently viewed items
var currentTab = "source";

var sourceCurrentNode = null;
var targetCurrentNode = null;
var currentSize = 0;

//begin force definitions
var svg = d3.select("#actorLinkSVG");

var width = svg.node().getBoundingClientRect().width;		//not yet set so defaults to 0
var height = svg.node().getBoundingClientRect().height;


var boundaryLeft = Math.floor(width/2) - 20;
var boundaryRight = Math.ceil(width/2) + 20;

var allR = 40;
var padding = 5;
var colors = d3.scale.category20();
var pebbleBorderColor = '#fa8072';

var force = d3.layout.force().nodes(nodes).links(links).size([width, height]).linkDistance(150).charge(-600).start();

var node_drag = d3.behavior.drag().on("dragstart", dragstart).on("drag", dragmove).on("dragend", dragend);

var dragStarted = false;
var dragSelect = null;
var dragTarget = null;
var dragTargetHTML = null;

d3.selection.prototype.moveToFront = function() {
	return this.each(function(){
		this.parentNode.appendChild(this);
	});
};

d3.selection.prototype.moveToBack = function() {
	return this.each(function() {
		var firstChild = this.parentNode.firstChild;
		if (firstChild) {
			this.parentNode.insertBefore(this, firstChild);
		}
	});
};

//define arrow markers
svg.append('svg:defs').append('svg:marker').attr('id', 'end-arrow').attr('viewBox', '0 -5 10 10').attr('refX', 6).attr('markerWidth', 3).attr('markerHeight', 3).attr('orient', 'auto').append('svg:path').attr('d', 'M0,-5L10,0L0,5').style('fill', '#000');

svg.append('svg:defs').append('svg:marker').attr('id', 'start-arrow').attr('viewBox', '0 -5 10 10').attr('refX', 4).attr('markerWidth', 3).attr('markerHeight', 3).attr('orient', 'auto').append('svg:path').attr('d', 'M10,-5L0,0L10,5').style('fill', '#000');

svg.on("mouseup", function(d){
	//~ console.log("mouse up on the SVG");
	lineMouseup();
}).on("mousedown", function(d){
	//~ console.log("mouse down on the SVG")
}).on("click", function(d){
	//~ console.log("click on the SVG");
}).on("contextmenu", function(d){
	d3.event.preventDefault();
	//~ console.log("right click on the SVG")
});

var linkGroup = svg.append("svg:g").attr("class", "allLinksGroup").selectAll("path");

var nodeGroup = svg.append("svg:g").attr("class", "allNodesGroup").selectAll("g");	//must define outside

var drag_line = svg.append('svg:path').attr('class', 'link dragline hidden').attr('d', 'M0,0L0,0');

var originNode = null;
var destNode = null;

updateSVG();

force.on("tick", tick);

//end force definitions, begin force functions

function dragstart(d, i) {
	force.stop(); // stops the force auto positioning before you start dragging
	dragStarted = true;
	dragSelect = d;
	d3.select(this).moveToBack();
	console.log("drag started for: " + d.name);
	//~ console.log(this);	//note "this" refers to the HTML section for the node
	d3.event.sourceEvent.stopPropagation();		//allows node below to trigger mouseover
}

function dragmove(d, i) {
	d.x = Math.max(allR, Math.min(width - allR, d3.event.x));
	d.y = Math.max(allR, Math.min(height - allR, d3.event.y));
	tick(); // this is the key to make it work together with updating both px,py,x,y on d !
}

function dragend(d, i) {
	//~ d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
	//merge dragSel and dragTarg
	if (dragTarget){
		console.log("merging: " + dragSelect.name + " -> " + dragTarget.name);
		console.log("respective id: " + dragSelect.actorID + "	" + dragTarget.actorID);
		d3.select(dragTargetHTML).transition().attr("r", allR);

		
		
		updateAll();
	}
	dragStarted = false;
	dragSelect = null;
	dragTarget = null;
	dragTargetHTML = null;
	console.log("drag ended for: " + d.name);
	tick();
	force.resume();
}

function updateSVG(){
	linkGroup = linkGroup.data(links);

	linkGroup.enter().append('svg:path')
		.attr('class', 'link')
		.style('marker-start', function(d) { return d.source.actor == "target" ? 'url(#start-arrow)' : ''; })
		.style('marker-end', function(d) { return d.target.actor == "target" ? 'url(#end-arrow)' : ''; })
		.on('mousedown', function(d) { // do we ever need to select a link? make it delete..
			console.log("mousedown on connector");		//MWD	this seems to be a mousedown on the connector
			var obj1 = JSON.stringify(d);
			for(var j = 0; j < links.length; j++) {		//this removes the links on click
				if(obj1 === JSON.stringify(links[j])) {
					links.splice(j,1);
				}
			}
			updateAll();
			console.log("all links:");
			for (var x = 0; x < links.length; x++)
				console.log(links[x].source.name + "   " + links[x].target.name);
		})
		;
		
	// remove old links
	linkGroup.exit().remove();

	nodeGroup = nodeGroup.data(nodes, function(d){return d.index;});
	
	var innerNode = nodeGroup.enter().append("g").attr("id", function(d){return d.name + "Group";}).call(node_drag);
	innerNode.append("circle").attr("class", "node").attr("r", allR).style('fill', function(d){return d.nodeCol;}).style('opacity', "0.5").style('stroke', pebbleBorderColor).style("pointer-events", "all")
	.on("click", function(d){
		//~ console.log("clicked on innerNode");
		//~ console.log(d);
	})
	.on("contextmenu", function(d){
		d3.event.preventDefault();
		d3.event.stopPropagation();		//prevents mouseup on node
		//~ console.log("right clicked on innerNode");
		//~ console.log(d);

		originNode = d;

		drag_line.style('marker-end', function(){
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
			}).classed('hidden', false).attr('d', 'M' + originNode.x + ',' + originNode.y + 'L' + originNode.x + ',' + originNode.y);

		svg.on('mousemove', lineMousemove);
	})
	.on("mouseup", function(d){
		d3.event.stopPropagation();		//prevents mouseup on svg
		//~ console.log("mouse up on innerNode");
		//~ console.log(d);
		createLink(d);
	})
	.on("mousedown", function(d){
		//~ d3.event.stopPropagation();		//cannot call this in order to drag nodes
		//~ console.log("mouse down on innerNode");
		//~ console.log(d);
		createLink(d);
	})
	.on("mouseover", function(d){
		//~ console.log("mouse over node: " + d.name + "||| dragStarted = " + dragStarted);// + "||| dragSelect = " + dragSelect.name);
		if(dragSelect && dragSelect != d && dragSelect.actor == d.actor) {
			d3.select(this).transition().attr("r", allR + 10);
			dragTarget = d;
			dragTargetHTML = this;
		}
	})
	.on("mouseout", function(d){
		//~ console.log("mouse out node: " + d.name);
		//~ if(dragStarted)
			d3.select(this).transition().attr("r", allR);
			dragTarget = null;
			dragTargetHTML = null;
	})
	;

	function createLink(d) {
		if (d3.event.which == 3) {
			//~ console.log("detected mouse up on right click");
			return;
		}

		if(!originNode)
			return;		//if no origin node selected

		drag_line.classed('hidden', true).style('marker-end', '');		//hide line

		// check for drag-to-self and same actor to actor
		destNode = d;
		if (destNode === originNode || destNode.actor == originNode.actor){
			resetMouseVars();
			return;
		}

		//~ console.log("link made!!!!!!!!!!!!!!!!!!!");

		var actualSource = originNode.actor == "source" ? originNode : destNode;
		var actualTarget = destNode.actor == "target" ? destNode : originNode;

		if (links.filter(function(linkItem){return (linkItem.source == actualSource && linkItem.target == actualTarget);})[0]){
			console.log("link exists");
			return;
		}
		else {
			links.push(new linkObj(actualSource, actualTarget));
			updateAll();
			console.log("all links:");
			for (var x = 0; x < links.length; x++)
				console.log(links[x].source.name + "   " + links[x].target.name);
		}

		resetMouseVars();
	}

	//~ console.log("changing text?");					//innerNode only keeps track of new additions to force nodes
	//~ for (var x = 0; x < innerNode.length; x ++)
		//~ console.log(innerNode[x]);
	innerNode.append('svg:text').attr('x', 0).attr('y', 15).attr('class', 'id').text(function(d){return d.name;});

	//~ svg.selectAll("text").data(nodes).text(function(d){return d.name;});		//this sometimes flips names around
	//~ console.log("----------------------------------");\

	//~ console.log(svg.selectAll("text")[0]);

	nodeGroup.exit().remove();
	
	svg.selectAll("text").text(function(d) {
		//~ console.log(d);
		return d.name;
	});
}

function tick(e) {
	if (e) {	//if not dragging
		nodes.forEach(function(o, i) {		//o = object, i = index
			o.x += (o.actor == "source") ? e.alpha * -5 : e.alpha * 5;		//groups same actors together
		});

		var q = d3.geom.quadtree(nodes), i = 0, n = nodes.length;
		while( ++i < n) q.visit(collide(nodes[i]));
	}
	
	nodeGroup.attr("transform", function(d) {
		d.x = Math.max(allR, Math.min(width - allR, d.x));
		d.y = Math.max(allR, Math.min(height - allR, d.y));
		if (d.actor == "source" && d.x > boundaryLeft)
			d.x = boundaryLeft;
		if (d.actor == "target" && d.x < boundaryRight)
			d.x = boundaryRight;
		return "translate(" + d.x + "," + d.y + ")";
	});

	linkGroup.attr('d', function(d){
		var deltaX = d.target.x - d.source.x,
		deltaY = d.target.y - d.source.y,
		dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
		normX = deltaX / dist,
		normY = deltaY / dist,
		sourcePadding = (d.source.actor == "target") ? allR+5 : allR,			//MWD	spacing on the line before arrow head
		targetPadding = (d.target.actor == "target") ? allR+5 : allR,
		sourceX = d.source.x + (sourcePadding * normX),
		sourceY = d.source.y + (sourcePadding * normY),
		targetX = d.target.x - (targetPadding * normX),
		targetY = d.target.y - (targetPadding * normY);
		  
		return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
	});
}

function collide(node) {
	var r = allR + padding, nx1 = node.x - r, nx2 = node.x + r, ny1 = node.y - r, ny2 = node.y + r;
	return function(quad, x1, y1, x2, y2) {
		if (quad.point && (quad.point !== node)) {
			var x = node.x - quad.point.x, y = node.y - quad.point.y, l = Math.sqrt(x * x + y * y), r = allR + allR + padding;

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

function lineMousemove() {
	if(!originNode) return;

	// update drag line
	drag_line.attr('d', 'M' + originNode.x + ',' + originNode.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
}

function lineMouseup() {
	if(originNode) {
		// hide drag line
		drag_line.classed('hidden', true).style('marker-end', '');
	}    
	// clear mouse event vars
	resetMouseVars();
}

function resetMouseVars() {
	originNode = null;
	destNode = null;
}

function updateAll() {
	force.stop();
	force = force.nodes(nodes).links(links).start();
	resetMouseVars();
	updateSVG();
}

//end force functions, begin actor code

//rename group on click
$(document).ready(function() {
	//reset group display
	$("#editGroupName").ready(function() {
		//~ var defaultGroupName = sourceGroups[sourceCurrentGroupNum].title;
		//~ updateGroupName(defaultGroupName);
		nodes.push(new nodeObj("Source Group 0", [], colors(currentSize), "source"));
		currentSize ++;
		nodes.push(new nodeObj("Target Group 0", [], colors(currentSize), "target"));
		sourceCurrentNode = nodes[0];
		targetCurrentNode = nodes[1];
	});

	//enable editing
	//~ $("#groupNameDisplay").click(function() {
		//~ $("#groupNameDisplay").hide();
		//~ $("#editGroupName").css("display", "block").show().focus();
	//~ });
	$("#editGroupName").click(function() {
		$("#editGroupName").css("background-color", "white").css("border", "1px solid black");
	});

	//catch enter key
	$("#editGroupName").keydown(function(e) {
		console.log(e.keyCode);
		if (e.keyCode == 13 || e.keyCode == 27) {		//enter or escape key pressed
			$("#editGroupName").focusout();
			$("#" + currentTab + "TabBtn").focus();		//remove focus
		}
	});

	//save changes to group name
	$("#editGroupName").focusout(function() {
		//~ $("#editGroupName").hide();
		var newGroupName = $("#editGroupName").val().trim();
		if (newGroupName == "") {
			//~ newGroupName = window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].title;
			newGroupName = window[currentTab + "CurrentNode"].name;
		}
		//~ $("#groupNameDisplay").text(newGroupName).css("display", "block").show();
		$("#editGroupName").css("background-color", "#F9F9F9").css("border", "none");
		//change in group
		//~ window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].title = newGroupName;
		window[currentTab + "CurrentNode"].name = newGroupName;
		//update DOM
		updateGroupName(newGroupName);

		updateAll();		//update force
	});
	//~ console.log("on load: " + sourceGroups[0].title);
	//~ console.log(sourceGroups[0].nodes);
	//~ console.log(sourceCurrentGroupNum);
	//~ console.log(sourceGroups[sourceCurrentGroupNum]);
});

//update display of group name
function updateGroupName(newGroupName) {
	$("#editGroupName").attr("placeholder", newGroupName);
	$("#editGroupName").val(newGroupName);
	//~ $("#groupNameDisplay").text(newGroupName);
}

//switches tabs in actor subset
function actorTabSwitch(origin, tab) {
	switch(origin) {
		case "sourceTabBtn":
			document.getElementById("targetDiv").style.display = "none";
			$("#targetTabBtn").removeClass("active").addClass("btn-default");
			$("#sourceTabBtn").removeClass("btn-default").addClass("active");
			currentTab = "source";
			break;
		default:
			document.getElementById("sourceDiv").style.display = "none";
			$("#sourceTabBtn").removeClass("active").addClass("btn-default");
			$("#targetTabBtn").removeClass("btn-default").addClass("active");
			currentTab = "target";
			break;
	}

	//~ updateGroupName(window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].title);
	updateGroupName(window[currentTab + "CurrentNode"].name);
	document.getElementById(tab).style.display = "inline-block";
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
		return defer;
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
		chkbox.className = "actorChk";
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

		if (order != "Full") {
			lbl.setAttribute("data-content", binarySearch(value));
		}
		else {
			lbl.setAttribute("data-content", "test lbl");
		}

		lbl.setAttribute("onmouseover", "$(this).popover('toggle')");
		lbl.setAttribute("onmouseout", "$(this).popover('toggle')");

		displayList.appendChild(chkbox);
		displayList.appendChild(lbl);
		displayList.appendChild(seperator);

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

//when an actor selected, add into group
function actorSelectChanged(element) {
	element.checked = !!(element.checked);
	console.log("actor check");
	//add into group
	//if checked
	//	if source then add into actorConnections[curGroupNum]
	//	else add into targetSelList
	//else
	//	if source then remove from actorConnections[curGroupNum]
	//	else remove from targetSelList
	if (element.checked) {
		//~ console.log(element.value);
		//~ if (window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].nodes.indexOf(element.value) < 0) {
			//~ window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].nodes.push(element.value);
		//~ }
		//~ console.log(window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]]);
		if (window[currentTab + "CurrentNode"].group.indexOf(element.value < 0))
			window[currentTab + "CurrentNode"].group.push(element.value);
	}
	else {
		//~ var index = window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].nodes.indexOf(element.value);
		//~ if (index > -1) {
			//~ window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].nodes.splice(index, 1);
		//~ }
		var index = window[currentTab + "CurrentNode"].group.indexOf(element.value);
		if (index > -1)
			window[currentTab + "CurrentNode"].group.splice(index, 1);
	}
	//~ console.log("Title: " + window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].title);
	//~ console.log("Contents: " + window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].nodes);
	console.log("Current node name: " + window[currentTab + "CurrentNode"].name);
	console.log(window[currentTab + "CurrentNode"]);
}

//when checkbox checked, add or remove filter
function actorFilterChanged(element) {
	element.checked = !!(element.checked);
	var ending = getActorEnding(element);
	if (element.checked) {
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
	document.getElementById(currentTab + "Search").value = "";
	$("#" + currentTab + "Filter :checkbox").prop("checked", false);
	window[currentTab + "FilterChecked"].length = 0;
	window[currentTab + "EntityChecked"].length = 0;
	window[currentTab + "OrgSelect"] = 0;
	$("#" + currentTab + "OrgAllCheck").prop("checked", false).prop("indeterminate", false);
	window[currentTab + "CountrySelect"] = 0;
	$("#" + currentTab + "CountryAllCheck").prop("checked", false).prop("indeterminate", false);
	actorSearch(currentTab);
});

//clear search box when reloading page
$(".actorSearch").ready(function() {
	$(".actorSearch").val("");
});

//when typing in search box
$(".actorSearch").on("keyup", function(event) {
	actorSearch(currentTab);
});

//on load of page, keep unchecked
$(".allCheck").ready(function() {
	$(".allCheck").prop("checked", false);
});

//selects all checks for specified element
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
	//~ console.log("in select all");
	//~ console.log(currentScreen);
	for (var x = 0; x < currentScreen.length; x++) {
		//~ if (window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].nodes.indexOf(window[currentTab + "FullList"][currentScreen[x]]) < 0) {
			//~ window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].nodes.push(window[currentTab + "FullList"][currentScreen[x]]);
		//~ }
		if (window[currentTab + "CurrentNode"].group.indexOf(window[currentTab + "FullList"][currentScreen[x]]) < 0)
			window[currentTab + "CurrentNode"].group.push(window[currentTab + "FullList"][currentScreen[x]]);
		$("#" + currentTab + "FullCheck" + currentScreen[x]).prop("checked", true);
	}
	//~ console.log(window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]]);
	//~ console.log(window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].nodes);
});

//clears all of the current matched items from the current selection
$(".actorClearAll").click(function(event) {
	//~ console.log("in clear all");
	for (var x = 0; x < currentScreen.length; x++) {
		//~ index = window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].nodes.indexOf(window[currentTab + "FullList"][currentScreen[x]]);
		//~ if (index > -1) {
			//~ window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].nodes.splice(index, 1);
			//~ $("#" + currentTab + "FullCheck" + currentScreen[x]).prop("checked", false);
		//~ }
		index = window[currentTab + "CurrentNode"].group.indexOf(window[currentTab + "FullList"][currentScreen[x]]);
		if (index > -1) {
			window[currentTab + "CurrentNode"].group.splice(index, 1);
			$("#" + currentTab + "FullCheck" + currentScreen[x]).prop("checked", false);
		}
	}
	//~ console.log(window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]]);
	//~ console.log(window[currentTab + "Groups"][window[currentTab + "CurrentGroupNum"]].nodes);
});

$(".actorNewGroup").click(function(event) {
	currentSize ++;		//not good for creating new node number because shared with targets
	nodes.push(new nodeObj(capitalizeFirst(currentTab) + " Group " + currentSize, [], colors(currentSize), currentTab));
	window[currentTab + "CurrentNode"] = nodes[nodes.length - 1];
	updateGroupName(window[currentTab + "CurrentNode"].name);
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
	console.log(currentScreen);
}

//does as its name says; returns a string with the first character capitalized
function capitalizeFirst(str) {
	return str.charAt(0).toUpperCase() + str.substring(1);
}

//end of actor code
