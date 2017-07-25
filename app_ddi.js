//////////
// Globals

// space index
var myspace = 0;
var svg = d3.select("#main.left div.carousel-inner").attr('id', 'innercarousel')
.append('div').attr('class', 'item active').attr('id', 'm0').append('svg').attr('id', 'whitespace');

var logArray = [];

var tempWidth = d3.select("#main.left").style("width")
var width = tempWidth.substring(0,(tempWidth.length-2));

var height = $(window).height() -120;  // Hard coding for header and footer and bottom margin.


var forcetoggle=["true"];
var rightClickLast = false;


// this is the initial color scale that is used to establish the initial colors of the nodes.  allNodes.push() below establishes a field for the master node array allNodes called "nodeCol" and assigns a color from this scale to that field.  everything there after should refer to the nodeCol and not the color scale, this enables us to update colors and pass the variable type to R based on its coloring
var colors = d3.scale.category20();

var timeColor = '#2d6ca2';

var csColor = '#419641';

var dvColor = '#28a4c9';

var nomColor = '#ff6600';

var varColor = '#f0f8ff';   //d3.rgb("aliceblue");
var selVarColor = '#fa8072';    //d3.rgb("salmon");
var taggedColor = '#f5f5f5';    //d3.rgb("whitesmoke");
var d3Color = '#1f77b4';  // d3's default blue
var grayColor = '#c0c0c0';

var lefttab = "tab1"; //global for current tab in left panel

// Radius of circle
var allR = 40;

// From .csv
var valueKey = [];
//~ var hold = [];
var allNodes = [];
var links = [];
var nodes = [];

// end of (most) global declarations (minus functions)

// this is the function and callback routine that loads all external data: metadata (DVN's ddi), preprocessed (for plotting distributions), and zeligmodels (produced by Zelig) and initiates the data download to the server
//+++++++++++++++++++++++++++++++++++++++++++++++++++++
//~ readPreprocess(url="", callback=function(){
	//~ console.log("in readProcess call")
	//~ d3.json(url,function(json){		//this is async so it executes after 'done with json func'; why can this not be a func
		//~ console.log("json func start");
		//~ valueKey = ["ccode", "country", "cname", "cmark", "year", "custom"];

		  //~ for (i=0;i<valueKey.length;i++) {
			  //~ //MWD		definition of node object	!!!
			  //~ // this creates an object to be pushed to allNodes. this contains all the preprocessed data we have for the variable, as well as UI data pertinent to that variable, such as setx values (if the user has selected them) and pebble coordinates
			  //~ //var obj1 = {id:i, reflexive: false, "name": valueKey[i], "labl": valueKey[i], data: [5,15,20,0,5,15,20], count: hold, "nodeCol":colors(i), "baseCol":colors(i), "strokeColor":selVarColor, "strokeWidth":"1", "subsetplot":false, "subsetrange":["", ""],"setxplot":false, "setxvals":["", ""], "grayout":false};

			  //~ var obj1 = {id:i, "name": valueKey[i], "nodeCol":colors(i), "strokeColor": selVarColor};
			  
			  //~ allNodes.push(obj1);
		 
		  //~ }
		  //~ console.log("calling scaffolding");
		  //~ scaffolding(layout);
		  //~ console.log("done scaffolding");
	  //~ });
		//~ console.log("done with json func");	
	//~ });

//~ //this seems to load variables and initialize svg
//~ function readPreprocess(url, callback) {
		//~ console.log("in readProcess func");
		//~ if(typeof callback === "function") {
			//~ console.log("testing " + callback);
			//~ callback();
		//~ }
//~ }

console.log("begin");
valueKey = ["ccode", "country", "cname", "cmark", "year", "custom"];
for (i=0;i<valueKey.length;i++) {
  //MWD		definition of node object	!!!
  var obj1 = {id:i, "name": valueKey[i], "nodeCol":colors(i), "strokeColor": selVarColor};
  
  allNodes.push(obj1);
}
//MWD	these 3 functions do as they are called, but why are they variables? as variables, the svg is drawn immediately; otherwise it only displays after a click on the svg and i think all the nodes are display at (0,0)
// returns id
var findNodeIndex = function(nodeName) {
    for (var i in allNodes) {
        if(allNodes[i]["name"] === nodeName) {return allNodes[i]["id"];}
		
    }
}
console.log(findNodeIndex);
//~ function findNodeIndex (nodeName) {
    //~ for (var i in allNodes) {
        //~ if(allNodes[i]["name"] === nodeName) {return allNodes[i]["id"];}
		
    //~ };
//~ }

var nodeIndex = function(nodeName) {
    for (var i in nodes) {
        if(nodes[i]["name"] === nodeName) {return i;}
    }
}

var findNode = function(nodeName) {
    for (var i in allNodes) {if (allNodes[i]["name"] === nodeName) return allNodes[i]};
}
console.log("calling scaffolding");
scaffolding(layout);
console.log("done scaffolding");
//~ svg.click();
document.getElementById("#whitespace0").click();
console.log("end");


////////////////////////////////////////////
// everything below this point is a function
//+++++++++++++++++++++++++++++++++++++++++++++++++++++


// scaffolding is called after all external data are guaranteed to have been read to completion. this populates the left panel with variable names, the right panel with model names, the transformation tool, an the associated mouseovers. its callback is layout(), which initializes the modeling space
function scaffolding(callback) {
	console.log("in scaffolding");
	// populating the variable list in the left panel
	
	d3.select("#tab1").selectAll("p") 			//do something with this..
	.data(valueKey)
	.enter()
	.append("p")
	.attr("id",function(d){
		  return d.replace(/\W/g, "_"); // replace non-alphanumerics for selection purposes
		  }) // perhapse ensure this id is unique by adding '_' to the front?
	.text(function(d){return d;})
	.style('background-color',function(d) {
		   if(findNodeIndex(d) > 2) {return varColor;}
		   else {
			return hexToRgba(allNodes[findNodeIndex(d)].strokeColor);}
		   });
    
    if(typeof callback === "function") {
		console.log("calling layout");
        callback(); // this calls layout() because at this point all scaffolding is up and ready
		console.log("done with layout");
    }
}	

var circle = svg.append('svg:g').selectAll('g');
var path = svg.append('svg:g').selectAll('path');       
		
//ROHIT BHATTACHARJEE
// mouse event vars
var selected_node = null,
selected_link = null,
mousedown_link = null,
mousedown_node = null,
mouseup_node = null;
var force;
function layout() {
	var myValues=[];
    nodes = [];
    links = [];
    
		//MWD		i think this adds the first 3 nodes and connects them
		console.log("in something " + allNodes.length + " " + nodes.length);		//MWD
        if(allNodes.length > 2) {
			console.log("allNodes[0] = " + allNodes[0]);	//MWD
			console.log(allNodes[0]);		//MWD
            nodes = [allNodes[0], allNodes[1], allNodes[2]];
            links = [
                {source: nodes[1], target: nodes[0], left: false, right: true },
                {source: nodes[0], target: nodes[2], left: false, right: true }
                ];
        }
        else if(allNodes.length === 2) {
            nodes = [allNodes[0], allNodes[1]];
            links = [{source: nodes[1], target: nodes[0], left: false, right: true }];
        }
        else if(allNodes.length === 1){
            nodes = [allNodes[0]];
        }
        else {
            alert("There are zero variables in the metadata.");
            return;
        }
    
	//Rohit Bhattacharjee FORCE D3
	// init D3 force layout 
	
		//var 
		force=forced3layout(nodes, links, width, height,tick);
  
        
		//Rohit Bhattacharjee SVG
		//function svgappend()
		// define arrow markers for graph links
        svg.append('svg:defs').append('svg:marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 6)
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M0,-5L10,0L0,5')
        .style('fill', '#000');
        
        svg.append('svg:defs').append('svg:marker')
        .attr('id', 'start-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 4)
        .attr('markerWidth', 3)
        .attr('markerHeight', 3)
        .attr('orient', 'auto')
        .append('svg:path')
        .attr('d', 'M10,-5L0,0L10,5')
        .style('fill', '#000');

        // line displayed when dragging new nodes
     //this seems to prevent random smudges on lines
     drag_line = svg.append('svg:path')
        .attr('class', 'link dragline hidden')
        .attr('d', 'M0,0L0,0');
        
        // handles to link and node element groups
       // var
        path = svg.append('svg:g').selectAll('path');
        circle = svg.append('svg:g').selectAll('g');
    
        // mouse event vars
        //var 
        selected_node = null,
        selected_link = null,
        mousedown_link = null,
        mousedown_node = null,
        mouseup_node = null;
        console.log("before resetMouse");	//MWD

        //ROHIT BHATTACHARJEE reset mouse function
		 resetMouseVars();
        
	   circle.attr('transform', function(d) {		//not sure what this is needed for; declared again below; I think this helps drawing circle on move
		   console.log("in circle transform attr");	//MWD
		   return 'translate(' + d.x + ',' + d.y + ')';
	   });
    
    //  add listeners to leftpanel.left.  every time a variable is clicked, nodes updates and background color changes.  mouseover shows summary stats or model description.
	//Rohit BHATTACHARJEE add listener
	addlistener(nodes);

	drag_line = svg.append('svg:path')		//this displays drag line over the pebble
        .attr('class', 'link dragline hidden')
       .attr('d', 'M0,0L0,0');	

    
    // app starts here
   
    svg.attr('id', function(){
             return "whitespace".concat(myspace);
             })
    .attr('height', height)
    .on('mousedown', function() {
           mousedown(this);
           })
    .on('mouseup', function() {
        mouseup(this);
        });
    
    d3.select(window)
    .on('click',function(){  //NOTE: all clicks will bubble here unless event.stopPropagation()
    });
    
    restart(); // this is the call the restart that initializes the force.layout()
    fakeClick();
} 		// end layout

//Rohit BHATTACHARJEE
function restart() {
	//console.log("in restart func");		//MWD	I think this handles redrawing
        // nodes.id is pegged to allNodes, i.e. the order in which variables are read in
        // nodes.index is floating and depends on updates to nodes.  a variables index changes when new variables are added.
        circle.call(force.drag);
        if(forcetoggle[0]==="true")
        {
			//console.log("force toggle 0 is true");		//MWD	this enables force layout
            force.gravity(0.1);
            force.charge(-800);
            force.linkStrength(1);
        }
        else
        {
			//console.log("force is 0");		//MWD	this disables force
            force.gravity(0);
            force.charge(0);
            force.linkStrength(0);
        }
        force.resume();
        
        // path (link) group
        path = path.data(links);
        
        // update existing links
        // VJD: dashed links between pebbles are "selected". this is disabled for now
        path.classed('selected', function(d) { return;})//return d === selected_link; })
        .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
        .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; });
        
        
        // add new links
        path.enter().append('svg:path')
        .attr('class', 'link')
        .classed('selected', function(d) { return;})//return d === selected_link; })
        .style('marker-start', function(d) { return d.left ? 'url(#start-arrow)' : ''; })
        .style('marker-end', function(d) { return d.right ? 'url(#end-arrow)' : ''; })
        .on('mousedown', function(d) { // do we ever need to select a link? make it delete..
			console.log("mousedown on connector");		//MWD	this seems to be a mousedown on the connector
            var obj1 = JSON.stringify(d);
            for(var j =0; j < links.length; j++) {		//this removes the links on click
                if(obj1 === JSON.stringify(links[j])) {
                    links.splice(j,1);
                }
            }
        });
        
        // remove old links
        path.exit().remove();
        
        // circle (node) group
       circle = circle.data(nodes, function(d) {return d.id; });
     
        
        // update existing nodes (reflexive & selected visual states)
        //d3.rgb is the function adjusting the color here.
        circle.selectAll('circle')
        .classed('reflexive', function(d) { return d.reflexive; })
        .style('fill', function(d){
               return d3.rgb(d.nodeCol);
                //return (d === selected_node) ? d3.rgb(d.nodeCol).brighter() : d3.rgb(d.nodeCol); // IF d is equal to selected_node return brighter color ELSE return normal color
               })
        .style('stroke', function(d){
               return (d3.rgb(d.strokeColor));
               })
        .style('stroke-width', function(d){
               return (d.strokeWidth);
               });
        
        // add new nodes
        
        var g = circle.enter()
        .append('svg:g')
        .attr("id", function(d) {
			console.log("something about circle id");		//MWD	occurs when adding pebble
              var myname = d.name+"biggroup";
              return (myname);
              });
       
        // add plot
        g.each(function(d) {
			//~ console.log("something about circle plot");		//MWD	also occurs when adding pebble
               /*d3.select(this);
               if(d.plottype === "continuous") {
                densityNode(d, obj=this);
               }
               else if (d.plottype === "bar") {
                barsNode(d, obj=this);
               }*/
            });

        g.append('svg:circle')
        .attr('class', 'node')
        .attr('r', allR)
        .style('pointer-events', 'inherit')
        .style('fill', function(d) {
               return d.nodeCol; })
        .style('opacity', "0.5")
        .style('stroke', function(d) {
               return d3.rgb(d.strokeColor).toString(); })
        .classed('reflexive', function(d) { return d.reflexive; })
        .on('mouseover', function(d) {
			console.log("circle mouseover???");		//MWD		why is this not triggering?
        })
        .on('mouseout', function(d) {
			console.log("circle mouseout???");		//MWD		why is this not triggering?
        })
        .on('dblclick', function(d){
			console.log("circle double click")		//MWD
            d3.event.stopPropagation(); // stop click from bubbling
        })
        .on('contextmenu', function(d) { // right click on node
			console.log("pebble rightclick");	//MWD
            d3.event.preventDefault();
            d3.event.stopPropagation(); // stop right click from bubbling
            rightClickLast=true;
            
            mousedown_node = d;
            if(mousedown_node === selected_node) selected_node = null;
            else selected_node = mousedown_node;
            selected_link = null;
            
            // reposition drag line		//this displays the drag line
            drag_line
            .style('marker-end', 'url(#end-arrow)')
            .classed('hidden', false)
            .attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + mousedown_node.x + ',' + mousedown_node.y);
            
            svg.on('mousemove', mousemove);
            restart();
            })
        .on('mouseup', function(d) {
			console.log("pebble mouse up");		//MWD
            d3.event.stopPropagation(); // stop mouseup from bubbling
            
            if(rightClickLast) {
                rightClickLast=false;
                return;
            }
           
            if(!mousedown_node) return;
            
            // needed by FF
            drag_line
            .classed('hidden', true)
            .style('marker-end', '');
            
            // check for drag-to-self
            mouseup_node = d;
            if(mouseup_node === mousedown_node) { resetMouseVars(); return; }
            
            // unenlarge target node
            d3.select(this).attr('transform', '');
            
            // add link to graph (update if exists)
            // NB: links are strictly source < target; arrows separately specified by booleans
            var source, target, direction;
            if(mousedown_node.id < mouseup_node.id) {
            source = mousedown_node;
            target = mouseup_node;
            direction = 'right';
            } else {
            source = mouseup_node;
            target = mousedown_node;
            direction = 'left';
            }
            
            var link;
            link = links.filter(function(l) {
                                return (l.source === source && l.target === target);
                                })[0];
            if(link) {
            link[direction] = true;
            } else {
            link = {source: source, target: target, left: false, right: false};
            link[direction] = true;
            links.push(link);
            }
            
            // select new link
            selected_link = link;
            selected_node = null;
            svg.on('mousemove', null);
            
            resetMouseVars();
            restart();
			//forced3layout(nodes, links,  width,  height, tick);
            
			});
       
        // show node Names
        g.append('svg:text')
        .attr('x', 0)
        .attr('y', 15)
        .attr('class', 'id')
        .text(function(d) {console.log("node name show " + d.name);		//MWD	this adds the text to the pebble
			return d.name; });
        
        
        // show summary stats on mouseover
        // SVG doesn't support text wrapping, use html instead
        g.selectAll("circle.node")
        .on("mouseover", function(d) {
			//~ console.log("pebble mouseover!!!");		//MWD		//so mouseover works on circle.node, not circle
                })
        
        .on("mouseout", function(d) {
			//MWD		mouseout on pebble
            });

        // remove old nodes
        circle.exit().remove();
        force.start();
    }
//Rohit BHATTACHARJEE TICK
 // update force layout (called automatically each iteration)
function tick() {
	//MWD	this is called per layout update to draw everything
	// draw directed edges with proper padding from node centers
	path.attr('d', function(d) {
		//MWD	called when line moves/added/removed, THIS DISPLAYS THE CURRENT LINES (NOT THE ONES BEING DRAWN)
	  if (d.source.id == 0) {
		  d.source.x = 600;
	  }
		else if (d.target.id == 0) {
			d.target.x = 600;
		}

		//must test seperately to account for linking
		 if (d.source.id == 1) {
			d.source.x = 800;
		}
		else if (d.target.id == 1) {
			d.target.x = 800;
		}
		
	  var deltaX = d.target.x - d.source.x,
	  deltaY = d.target.y - d.source.y,
	  dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
	  normX = deltaX / dist,
	  normY = deltaY / dist,
	  sourcePadding = d.left ? allR+5 : allR,			//MWD	this adds the spacing on the line pefore arrow head
	  targetPadding = d.right ? allR+5 : allR,
	  sourceX = d.source.x + (sourcePadding * normX),
	  sourceY = d.source.y + (sourcePadding * normY),
	  targetX = d.target.x - (targetPadding * normX),
	  targetY = d.target.y - (targetPadding * normY);
		  
	  return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
  });
	
	circle.attr('transform', function(d) {
		//MWD	called on circle move, THIS DISPLAYS THE CIRCLES
		if (d.id == 0) {
			d.x = 600;
		}
		else if (d.id == 1) {
			d.x = 800;
		}
		return 'translate(' + d.x + ',' + d.y + ')';
	});
	
}
//why is this here it seems to have no effect
var drag_line = svg.append('svg:path')
      .attr('class', 'link dragline hidden')
       .attr('d', 'M0,0L0,0');

function mousedown(d) {
	//console.log("mouse down func");		//MWD	this seems limited to only on the SVG
        // prevent I-bar on drag
        d3.event.preventDefault();
        
        // because :active only works in WebKit?
        svg.classed('active', true);
        
        if(d3.event.ctrlKey || mousedown_node || mousedown_link) {
            return;
        }
        
        restart();
    }
    
    function mousemove(d) {
        if(!mousedown_node) return;
        
        // update drag line
        drag_line.attr('d', 'M' + mousedown_node.x + ',' + mousedown_node.y + 'L' + d3.mouse(this)[0] + ',' + d3.mouse(this)[1]);
    }
    
    function mouseup(d) {
        if(mousedown_node) {
            // hide drag line
            drag_line
            .classed('hidden', true)
            .style('marker-end', '');
        }    
        // clear mouse event vars
        resetMouseVars();
    }

		//ROHIT Bhattacharjee
		// init D3 force layout
		function forced3layout(nodes, links,  width,  height,tick)
        {
			console.log("in forced3 func");		//MWD	seems to be the initializer, only called at start
			var force = d3.layout.force()
			.nodes(nodes)
			.links(links)
			.size([width, height])
			.linkDistance(150)
			.charge(-800)
			.on('tick',tick);  // .start() is important to initialize the layout
			
			return force;
		}
		
		function resetMouseVars() {
            mousedown_node = null;
            mouseup_node = null;
            mousedown_link = null;
        }

	//ROHIT BHATTACHARJEE ad listener function
	function addlistener(nodes){
	d3.select("#tab1").selectAll("p")
    .on("mouseover", function(d) {
         })
    .on("mouseout", function() {
        })
    .on("click", function varClick(){
		//console.log("addin node from tab");		//MWD
        if(allNodes[findNodeIndex(this.id)].grayout) {return null;}

        d3.select(this)
        .style('background-color',function(d) {
               var myText = d3.select(this).text();
               var myColor = d3.select(this).style('background-color');
               var mySC = allNodes[findNodeIndex(myText)].strokeColor;
               var myNode = allNodes[findNodeIndex(this.id)];

               	//console.log("inside SC wala if");
               //	SC=timeColor;
               
               if(d3.rgb(myColor).toString() === varColor.toString()) {	// we are adding a var
               
                if(nodes.length==0) {
                    nodes.push(findNode(myText));
                    nodes[0].reflexive=true;
                }
                
                else {nodes.push(findNode(myText));}
                	
               if(myNode.time==="yes") {
                    return hexToRgba(timeColor);
               }
               else if(myNode.nature==="nominal") {
                    return hexToRgba(nomColor);
               }
               else {
                    return hexToRgba(selVarColor);
               }

               }
               else { // dropping a variable
            
                    nodes.splice(findNode(myText)["index"], 1);		//MWD lookup this "findNode" function, sounds useful
                    spliceLinksForNode(findNode(myText));
                    
					return varColor;
               }
               });
			   
        restart();
        });
	}
		
//MWD	
// function called by force button
function forceSwitch() {
    if(forcetoggle[0]==="true") { forcetoggle = ["false"];}
    else {forcetoggle = ["true"]}

    if(forcetoggle[0]==="false") {
        document.getElementById('btnForce').setAttribute("class", "btn active");
    }
    else {
        document.getElementById('btnForce').setAttribute("class", "btn btn-default");
        fakeClick();
    }
}

//this allows to delete nodes
function spliceLinksForNode(node) {
    var toSplice = links.filter(function(l) {
                                return (l.source === node || l.target === node);
                                });
    toSplice.map(function(l) {
                 links.splice(links.indexOf(l), 1);
                 });
}

// programmatically deselecting every selected variable...
/*function erase() {
    leftpanelMedium();
    rightpanelMedium();
    //~document.getElementById("legend").setAttribute("style", "display:none");
    
    tabLeft('tab1');
    
    jQuery.fn.d3Click = function () {
		//console.log("does this do something?");	//MWD this clears all pebbles!
        this.children().each(function (i, e) {
                    var mycol = d3.rgb(this.style.backgroundColor);
                    if(mycol.toString()===varColor.toString()) {return;}
                  var evt = document.createEvent("MouseEvents");
                  evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                  
                  e.dispatchEvent(evt);
                  });
    };
    $("#tab1").d3Click();
}*/


/*		this is useful for hover over
function tabLeft(tab) {
    
    if(tab!="tab3") {lefttab=tab;}
    var tabi = tab.substring(3);
    
    document.getElementById('tab1').style.display = 'none';
    document.getElementById('tab2').style.display = 'none';
    document.getElementById('tab3').style.display = 'none';

    if(tab==="tab1") {
        summaryHold = false;
        document.getElementById('btnSubset').setAttribute("class", "btn btn-default");
        document.getElementById('btnVariables').setAttribute("class", "btn active");
        document.getElementById("btnSelect").style.display = 'none';
        
        d3.select("#leftpanel")
        .attr("class", "sidepanel container clearfix");
    }
    else if (tab==="tab2") {
        summaryHold = false;
        document.getElementById('btnVariables').setAttribute("class", "btn btn-default");
        document.getElementById('btnSubset').setAttribute("class", "btn active");
        
        d3.select("#leftpanel")
        .attr("class", function(d){
              if(this.getAttribute("class")==="sidepanel container clearfix expandpanel") {
                document.getElementById("btnSelect").style.display = 'none';
                return "sidepanel container clearfix";
              }
              else {
                document.getElementById("btnSelect").style.display = 'block';
                return "sidepanel container clearfix expandpanel";
              }
              });
    }
    else {
        document.getElementById('btnSubset').setAttribute("class", "btn btn-default");
        document.getElementById('btnVariables').setAttribute("class", "btn btn-default");
        
        d3.select("#leftpanel")
        .attr("class", "sidepanel container clearfix");
    }

    document.getElementById(tab).style.display = 'block';
}*/

// function to convert color codes
function hexToRgba(hex) {
    var h=hex.replace('#', '');
    
    var bigint = parseInt(h, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    var a = '0.5';
    
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}



// acts as if the user clicked in whitespace. useful when restart() is outside of scope
function fakeClick() {
    var myws = "#whitespace".concat(myspace);
    // d3 and programmatic events don't mesh well, here's a SO workaround that looks good but uses jquery...
    jQuery.fn.d3Click = function () {
        this.each(function (i, e) {
                  var evt = document.createEvent("MouseEvents");
                  evt.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                  
                  e.dispatchEvent(evt);
                  });
    };
    $(myws).d3Click();
    
    d3.select(myws)
    .classed('active', false); // remove active class
}

 
