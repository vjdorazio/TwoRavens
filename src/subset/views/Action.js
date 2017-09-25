
/**
 * ACTION
 *
 */

function pentaClass (classNum, count, maxSelect) {
	this.classNum = classNum;
	this.count = count;
	this.maxSelect = maxSelect;			//this and selectCount are to choose what fill: if selectCount == 0 then standard, != maxSelect then partial, else fill
	this.selectCount = 0;
	this.description = "";
}

//~ function actionDataClass (

var actionTooltip = d3.select("#subsetAction").select(".SVGtooltip").style("opacity", 0);

var pentaCounts = [];		//this will probably have to move into d3action() in order to "reload" data from queries
var pentaDesc = ["Public Statement", "Verbal Cooperation", "Material Cooperation", "Verbal Conflict", "Material Conflict"];

var lookupData;//dont need

var actionBuffer = [];			//this is for query submission - remember to clear it after query!
var actionSubData = [];			//this is for the data in each root event code
	//will contain an array of the pentaclasses, the event codes (not needed)

var d3action_draw = false;
function d3action() {
	console.log("called d3action");
	pentaCounts = [];
	
	//we have the action data from actionData in json format
	d3.csv("data/actionlookup.csv", function(d) {
		return {
			rootCode: +d.EventRootCode,
			rootDesc: d.Description,
			penta: +d.PentaClass,
			count: 0,
			used: false,				//this is from pentaCounts; on click from main graph this is set
			active: false				//this is from actionSubData; on click from sub graph this is set
		};
	}, function(data) {
		actionSubData = data;
		
		console.log("lookup data");
		console.log(data);
		console.log("action data");
		console.log(actionData);
		//~ for (var x = 0; x < 21; x ++){
			//~ console.log(actionData[x]);
		//~ }
		//~ for (var x in actionData)
			//~ console.log(x);

		for (var x = 0; x < 5; x++) {
			pentaCounts.push(new pentaClass(x, 0, 0));
			pentaCounts[x].description = pentaDesc[x];
		}
		console.log("pentacounts:");
		console.log(pentaCounts);

		for (var x = 0; x < 20; x ++) {
			//~ console.log(x);
			//~ console.log(data[x]);
			//~ console.log(data[x].penta);
			//~ console.log(actionData[x + 1]);
			if (!isNaN(actionData[x + 1])) {
				pentaCounts[data[x].penta].count += actionData[x + 1];
				pentaCounts[data[x].penta].maxSelect ++;
				actionSubData[x].count = actionData[x + 1];
			}
		}
		console.log("pentaCounts");
		console.log(pentaCounts);

		if (!d3action_draw) {
			d3action_draw = true;
			drawMainGraph();			//make this call only once
			drawSubGraph();
		}

		updateActionMain();
	});
			

    //~ if(!d3action_draw) {
        //~ d3action_draw = true;
        //~ drawMainGraphAction();
    //~ }
}


/**
 * Draw the main graph for Action
 *
 **/

//this draws the main graph; I think I will change this to draw both main and sub
var actionMainX, actionMainY, actionMainMargin, actionMainWidth, actionMainHeight, actionMainGraphData;
var actionSubX, actionSubY, actionSubMargin, actionSubWidth, actionSubHeight;//, actionSubGraphData;

function drawMainGraph() {

/*
    //~ $("#subsetAction").append('<div class="container"><div id="subsetAction_panel" class="row"></div></div>');

    //~ $("#subsetAction_panel").append("<div class='col-xs-4 location_left' id='subsetActionDivL'></div>");
    //~ $("#subsetAction_panel").append("<div class='col-xs-4 location_right'><div class='affix' id='subsetActionDivR'></div></div>");

    //~ $("#subsetActionDivL").append("<table id='svg_graph_table_action' border='0' align='center'><tr><td id='main_graph_action_td_1' class='graph_config'></td></tr><tr><td id='main_graph_action_td_2' class='graph_config'></td></tr></table>");

    //~ //actionGraphLabel("main_graph_action_td_1");
    //~ //actionGraphLabel("main_graph_action_td_2");

    //~ var svg1 = d3.select("#main_graph_action_td_1").append("svg:svg")
        //~ .attr("width",  480)
        //~ .attr("height", 350)
        //~ .attr("id", "main_graph_action_svg_1");

    //~ var svg2 = d3.select("#main_graph_action_td_2").append("svg:svg")
        //~ .attr("width",  480)
        //~ .attr("height", 350)
        //~ .attr("id", "main_graph_action_svg_2");

    //~ mapActionGraphSVG["main_graph_action_1"] = svg1;
    //~ mapActionGraphSVG["main_graph_action_2"] = svg2;

    //~ renderActionGraph(svg1, 1);
    //~ renderActionGraph(svg2, 2);

	//~ renderActionGraph2(svg1, 1);
	//~ renderActionGraph2(svg2, 2);

	  //~ console.log(d3.max(pentaCounts));

	  //~ var width = 500;

	  //~ var x = d3.scaleLinear()
//~ .domain([0, d3.max(pentaCounts)])
//~ .rangeRound([0, width]);

//~ var chart = d3.select("#actionMainGraph")
//~ .attr("width", width)
//~ .attr("height", 20 * pentaCounts.length);

//~ var bar = chart.selectAll("g")
//~ .data(pentaCounts)
//~ .enter().append("g")
//~ .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

//~ bar.append("rect")
//~ .attr("width", x)
//~ .attr("height", 20 - 1);

//~ bar.append("text")
//~ .attr("x", function(d) { return x(d) - 3; })
//~ .attr("y", 20 / 2)
//~ .attr("dy", ".35em")
//~ .text(function(d) { return d; });*/

	var svg = d3.select("#actionMainGraph");
	actionMainMargin = {top: 20, right: 50, bottom: 50, left: 50};
	actionMainWidth = +svg.attr("width") - actionMainMargin.left - actionMainMargin.right;
	actionMainHeight = +svg.attr("height") - actionMainMargin.top - actionMainMargin.bottom;

	actionMainX = d3.scaleLinear().range([0, actionMainWidth]);
    //~ actionMainY = d3.scaleBand().range([actionMainHeight, 0]);
    actionMainY = d3.scaleBand().range([0, actionMainHeight]);

    svg.append("defs").append("pattern")
		.attr("id", "actionPattern")
		.attr("x", "10")
		.attr("y", "10")
		.attr("width", actionMainY.bandwidth()/20)
		.attr("height", actionMainY.bandwidth()/20)
		.attr("patternUnits", "userSpaceOnUse")
		.append("line")
		.attr("x1","0")
		.attr("y1","0")
		.attr("x2", actionMainY.bandwidth()/20)
		.attr("y2", actionMainY.bandwidth()/20)
		.attr("style", "stroke:brown;stroke-width:5;");

	actionMainX.domain([0, d3.max(pentaCounts, function(d) {return d.count;})]);
	actionMainY.domain(pentaCounts.map(function(d) {
		//~ return pentaCounts.length - 1 - d.classNum;			//MWD
		return d.classNum;
	}))
	.padding(0.15);

	var g = svg.append("g").attr("id", "actionMainG")
		.attr("transform", "translate(" + actionMainMargin.left + "," + actionMainMargin.top + ")");

	g.append("g")
	.attr("class", "x axis mainX")
	.attr("transform", "translate(0," + actionMainHeight + ")")
	.call(d3.axisBottom(actionMainX).ticks(5).tickFormat(function(d) {
		return parseInt(d);
	}).tickSizeInner([-actionMainHeight]));

	g.append("g").attr("class", "y axis mainY").call(d3.axisLeft(actionMainY));

	console.log("creating actionMainGraphData");

	actionMainGraphData = g.append("g").attr("id", "actionMainData").selectAll("g");		//group data together

	g.append("text")
		.attr("text-anchor", "middle")
		.attr("transform", "translate(" + (-30) + "," + (actionMainHeight / 2) + ")rotate(-90)")
		.attr("class", "graph_axis_label")
		.text("PentaClass");


	g.append("text")
		.attr("text-anchor", "middle")
		.attr("transform", "translate(" + (actionMainWidth / 2) + "," + (actionMainHeight + 35) + ")")
		.attr("class", "graph_axis_label")
		.text("Frequency");
}

function drawSubGraph() {
	/*var svg = d3.select("#actionSubGraph"),
		margin = {top: 20, right: 50, bottom: 50, left: 50},
		width = +svg.attr("width") - margin.left - margin.right,
		height = +svg.attr("height") - margin.top - margin.bottom;

	var x = d3.scaleLinear().range([0, width]);
    var y = d3.scaleBand().range([height, 0]);

    x.domain([0, d3.max(pentaCounts, function(d){return d.count;})]);
            y.domain(pentaCounts.map(function (d) {
                return d.classNum;			//MWD
            }))
            //~ y.domain([0, 5])
            .padding(0.15);

            var g = svg.append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      g.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x).ticks(5).tickFormat(function (d) {
                    return parseInt(d);
                }).tickSizeInner([-height]));

            g.append("g")
                .attr("class", "y axis")
                .call(d3.axisLeft(y));

            g.selectAll(".bar_click")
                .data(pentaCounts)
                .enter()
                .append("rect")
                .attr("class", "bar_click")
                .attr("height", y.bandwidth())
                .attr("width", function (d) {
                    return width - x(d.count);
                })
                .attr("x", function (d) {
                    return x(d.count);
                })
                .attr("y", function (d) {
                    return y(d.classNum);
                })
                .attr("onclick", function (d) {
                    return "javascript:alert('External click on " + d.classNum + "')";
                })
                .on("mouseover", function(d) {
					$("#" + d.classNum + "bar").css("fill", "brown");
				})
				.on("mouseout", function(d) {
					$("#" + d.classNum + "bar").css("fill", "steelblue");
				});

            g.selectAll(".bar")
                .data(pentaCounts)
                .enter()
                .append("rect")
                .attr("id", function (d) {
                    //~ return "tg_rect_action_" + d.pid;
                    return d.classNum + "bar";
                })
                .attr("class", "bar")
                .attr("x", 0)
                .attr("height", y.bandwidth())
                .attr("y", function (d) {
                    return y(d.classNum);				//MWD
                })
                .attr("width", function (d) {
                    return x(d.count);
                })
                //~ .attr("onclick", function (d) {
                    //~ mapActionGraphSVG[d.pid] = null;
                    //~ return "javascript:alert('" + d.pid + "')";
                //~ })
                .attr("onclick", function (d) {
					return "javascript:alert('Click on " + d.classNum + "')";
				})
                .on("mouseover", function(d) {
					$("#" + d.classNum + "bar").css("fill", "brown");
				})
				.on("mouseout", function(d) {
					$("#" + d.classNum + "bar").css("fill", "steelblue");
				});


            g.selectAll(".bar_label")
                .data(pentaCounts)
                .enter()
                .append("text")
                .attr("class", "bar_label")
                .attr("x", function (d) {
                    return x(d.count) + 5;
                })
                .attr("y", function (d) {
                    return y(d.classNum) + y.bandwidth() / 2 + 4;
                })
                .text(function (d) {
                    return "" + d.count;
                });

            g.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + (-30) + "," + (height / 2) + ")rotate(-90)")
                .attr("class", "graph_axis_label")
                .text("PentaClass");


            g.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + (width / 2) + "," + (height + 30) + ")")
                .attr("class", "graph_axis_label")
                .text("Frequency");
                * */

	var svg = d3.select("#actionSubGraph");
		actionSubMargin = {top: 20, right: 50, bottom: 50, left: 50},
		actionSubWidth = +svg.attr("width") - actionSubMargin.left - actionSubMargin.right,
		actionSubHeight = +svg.attr("height") - actionSubMargin.top - actionSubMargin.bottom;

	actionSubX = d3.scaleLinear().range([0, actionSubWidth]);
    //~ actionSubY = d3.scaleBand().range([actionSubHeight, 0]);
    actionSubY = d3.scaleBand().range([0, actionSubHeight]).padding(0.15);

    actionSubX.domain([0, 0]);

	//~ actionSubX.domain([0, d3.max(pentaCounts, function(d) {return d.count;})]);			//change this
	//~ actionSubY.domain(pentaCounts.map(function(d) {
		//~ return d.classNum;			//MWD
	//~ }))
	//~ .padding(0.15);

	var g = svg.append("g").attr("id", "actionSubG")
		.attr("transform", "translate(" + actionSubMargin.left + "," + actionSubMargin.top + ")");

	g.append("g")
	.attr("class", "x axis subX")
	.attr("transform", "translate(0," + actionSubHeight + ")")
	.call(d3.axisBottom(actionSubX).ticks(5).tickFormat(function(d) {
		return parseInt(d);
	}).tickSizeInner([-actionSubHeight])).select("path").style("display", "inline");

	g.append("g").attr("class", "y axis subY").call(d3.axisLeft(actionSubY));

	console.log("creating actionSubGraphData");

	//~ actionSubGraphData = g.append("g").attr("id", "actionSubData").selectAll("g");		//group data together
	g.append("g").attr("id", "actionSubData");

	g.append("text")
		.attr("text-anchor", "middle")
		.attr("transform", "translate(" + (-30) + "," + (actionSubHeight / 2) + ")rotate(-90)")
		.attr("class", "graph_axis_label")
		.text("EventRootCode");


	g.append("text")
		.attr("text-anchor", "middle")
		.attr("transform", "translate(" + (actionSubWidth / 2) + "," + (actionSubHeight + 35) + ")")
		.attr("class", "graph_axis_label")
		.text("Frequency");
}

function updateActionMain() {
	console.log("in update main");

	actionMainX.domain([0, d3.max(pentaCounts, function(d) {return d.count;})]);
	actionMainY.domain(pentaCounts.map(function(d) {
		//~ return pentaCounts.length - 1 - d.classNum;			//MWD
		return d.classNum;
	}));

	d3.select("#actionMainGraph").select(".mainX").call(d3.axisBottom(actionMainX).ticks(5).tickFormat(function(d) {
		return parseInt(d);
	}).tickSizeInner([-actionMainHeight]));
	d3.select("#actionMainGraph").select(".mainY").call(d3.axisLeft(actionMainY));

	actionMainGraphData = actionMainGraphData.data(pentaCounts, function(d) {return d.count;});
	actionMainGraphData.exit().remove();
	
	actionMainGraphData = actionMainGraphData.enter()
		.append("g").attr("id", function(d) {return "Data" + d.classNum;})
		.each(function(d) {
			d3.select(this).append("rect")
				.attr("class", "actionBar_click").attr("height", actionMainY.bandwidth())
				.attr("width", function(d) {
					return actionMainWidth - actionMainX(d.count) + actionMainMargin.right;
				})		//extend to edge of svg
				.attr("x", function(d) {return actionMainX(d.count);}).attr("y", function(d) {return actionMainY(d.classNum);})
				.on("click", function(d) {
					for (var x = 0; x < actionSubData.length; x ++) {
						if (actionSubData[x].penta == d.classNum) {
							actionSubData[x].used = !actionSubData[x].used;
						}
					}
					console.log("clicked " + d.classNum);
					updateSubData();
				});
				//~ .on("mouseover", function(d) {
					//~ $("#actionBar" + d.classNum).css("fill", "brown");
					//~ actionTooltip.html(d.description).style("display", "block");
					//~ actionTooltip.transition().duration(200).style("opacity", 1);
				//~ })
				//~ .on("mousemove", function(d) {
					//~ actionTooltip.style("display", "block")
						//~ .style("left", d3.event.pageX - 250 + "px")
						//~ .style("top", d3.event.pageY - 70 + "px");
				//~ })
				//~ .on("mouseout", function(d) {
					//~ $("#actionBar" + d.classNum).css("fill", "steelblue");
					//~ actionTooltip.transition().duration(200).style("opacity", 0).style("display", "none");
				//~ });

			d3.select(this).append("rect")
				.attr("id", function(d) {return "actionBar" + d.classNum;}).attr("class", "actionBar actionBar_none")
				.attr("x", 0).attr("height", actionMainY.bandwidth()).attr("y", function(d) {return actionMainY(d.classNum);})
				.attr("width", function(d) {return actionMainX(d.count);})
				.on("click", function (d) {
					//~ return "javascript:alert('Click on " + d.classNum + "')";
					//add the corresponding data from penta into actionSubData and call updateSubData()
					for (var x = 0; x < actionSubData.length; x ++) {
						if (actionSubData[x].penta == d.classNum) {
							actionSubData[x].used = !actionSubData[x].used;
						}
					}
					console.log("clicked " + d.classNum);
					updateSubData();
				});
				//~ .on("mouseover", function(d) {
					//~ $("#actionBar" + d.classNum).css("fill", "brown");
					//~ actionTooltip.html(d.description).style("display", "block");
					//~ actionTooltip.transition().duration(200).style("opacity", 1);
				//~ })
				//~ .on("mousemove", function(d) {
					//~ actionTooltip.style("display", "block")
						//~ .style("left", d3.event.pageX - 250 + "px")
						//~ .style("top", d3.event.pageY - 70 + "px");
				//~ })
				//~ .on("mouseout", function(d) {
					//~ $("#actionBar" + d.classNum).css("fill", "steelblue");
					//~ actionTooltip.transition().duration(200).style("opacity", 0).style("display", "none");
				//~ });

			d3.select(this).append("text")
				.attr("class", "actionBar_label").attr("x", function(d) {return actionMainX(d.count) + 5;})
				.attr("y", function(d) {return actionMainY(d.classNum) + actionMainY.bandwidth() / 2 + 4;})
				.text(function(d) {return "" + d.count;});
		})
		.merge(actionMainGraphData);
}

function updateSubData(){
	console.log("in update sub");

	var actionCleanSubData = [];
	var actionSubDomain = [];
	for (var x = 0; x < actionSubData.length; x ++) {
		if (actionSubData[x].used) {
			actionSubDomain.push(actionSubData[x].rootCode);
			actionCleanSubData.push(actionSubData[x]);
		}
	}
	actionSubX.domain([0, d3.max(actionCleanSubData, function(d) {return d.count;})]);
	//~ actionMainY.domain(actionSubData.map(function(d) {
		//~ return d.classNum;			//how to reverse???
	//~ }));
	actionSubY.domain(actionSubDomain);

	console.log("clean data");
	console.log(actionCleanSubData);

	d3.select("#actionSubGraph").select(".subX").call(d3.axisBottom(actionSubX).ticks(5).tickFormat(function(d) {
		return parseInt(d);
	}).tickSizeInner([-actionSubHeight])).select("path").style("display", "inline");
	d3.select("#actionSubGraph").select(".subY").call(d3.axisLeft(actionSubY));

	$("#actionSubData").empty();

	var actionSubGraphData = d3.select("#actionSubData").selectAll("g").data(actionCleanSubData, function(d) {return d.count;}).enter();

	actionSubGraphData.append("rect")
		.attr("class", "actionBar_click").attr("height", actionSubY.bandwidth())
		.attr("width", function(d) {
			return actionSubWidth - actionSubX(d.count) + actionSubMargin.right;
		})		//extend to edge of svg
		.attr("x", function(d) {return actionSubX(d.count);}).attr("y", function(d) {return actionSubY(d.rootCode);});
		//~ .on("click", function(d) {
			//~ return "javascript:alert('External click on " + d.rootCode + "')";
		//~ })
		//~ .on("mouseover", function(d) {
			//~ $("#actionSubBar" + d.rootCode).css("fill", "brown");
			
		//~ })
		//~ .on("mouseout", function(d) {
			//~ $("#actionSubBar" + d.rootCode).css("fill", "steelblue");
		//~ });

	actionSubGraphData.append("rect")
		.attr("id", function(d) {return "actionSubBar" + d.rootCode;}).attr("class", "actionBar")
		.attr("x", 0).attr("height", actionSubY.bandwidth()).attr("y", function(d) {return actionSubY(d.rootCode);})
		.attr("width", function(d) {return actionSubX(d.count);})
		.style("fill", function(d) { return d.active ? "brown" : "steelblue";})
		.on("click", function (d) {
			d.active = !d.active;
			$("#actionSubBar" + d.rootCode).css("fill", function(i) {return d.active ? "brown" : "steelblue";});
			d.active ? actionBuffer.push(d.rootCode) : actionBuffer.splice(actionBuffer.indexOf(d.rootCode), 1);

			console.log("buffer");
			console.log(actionBuffer);
			for (var x = 0; x < pentaCounts.length; x ++) {
				if (pentaCounts[x].classNum == d.penta) {
					console.log("found " + x);
					if (d.active) {
						pentaCounts[x].selectCount ++;
						
					}
					else {
						pentaCounts[x].selectCount --;
						
					}
					console.log(pentaCounts[x].selectCount + "	" + pentaCounts[x].maxSelect);
					if (pentaCounts[x].selectCount == pentaCounts[x].maxSelect) {
						console.log("all");
						//~ $("#actionBar" + x).removeClass("actionBar_none");//.removeClass("actionBar_some").addClass("actionBar_all");
						//~ $("#actionBar" + x).css("fill", "brown");
						$("#actionBar" + x).attr("class", "actionBar actionBar_all");
					}
					else if (pentaCounts[x].selectCount == 0) {
						console.log("none");
						//~ $("#actionBar" + x).removeClass("actionBar_some actionBar_all").addClass("actionBar_none");
						$("#actionBar" + x).attr("class", "actionBar actionBar_none");
					}
					else {
						console.log("some");
						//~ $("#actionBar" + x).removeClass("actionBar_none actionBar_all").addClass("actionBar_some");
						//~ $("#" + x + "actionBar").css("fill", "green");
						$("#actionBar" + x).attr("class", "actionBar actionBar_some");
					}
					break;
				}
			}
			
		});
		//~ .on("mouseover", function(d) {
			//~ $("#" + d.classNum + "SubBar").css("fill", "brown");
			//~ actionTooltip.html(d.rootDesc + "; PentaClass: " + d.penta).style("display", "block");
			//~ actionTooltip.transition().duration(200).style("opacity", 1);
		//~ })
		//~ .on("mousemove", function(d) {
			//~ actionTooltip.style("display", "block")
				//~ .style("left", d3.event.pageX - 250 + "px")
				//~ .style("top", d3.event.pageY - 70 + "px");
		//~ })
		//~ .on("mouseout", function(d) {
			//~ $("#" + d.classNum + "SubBar").css("fill", "steelblue");
			//~ actionTooltip.transition().duration(200).style("opacity", 0).style("display", "none");
		//~ });

	actionSubGraphData.append("text")
		.attr("class", "actionBar_label").attr("x", function(d) {return actionSubX(d.count) + 5;})
		.attr("y", function(d) {return actionSubY(d.rootCode) + actionSubY.bandwidth() / 2 + 4;})
		.text(function(d) {return "" + d.count;});

	/*$(actionSubGraphData).empty();

	actionSubGraphData = actionSubGraphData.data(actionCleanSubData, function(d) {return d.count;});
	actionSubGraphData.exit().remove();			//here is where you animate if you want
	
	actionSubGraphData = actionSubGraphData.enter()
		.append("g").attr("id", function(d) {return d.rootCode + "SubData";})
		.each(function(d) {
			d3.select(this).append("rect")
				.attr("class", "bar_click").attr("height", actionSubY.bandwidth())
				.attr("width", function(d) {
					return actionSubWidth - actionSubX(d.count) + actionSubMargin.right;
				})		//extend to edge of svg
				.attr("x", function(d) {return actionSubX(d.count);}).attr("y", function(d) {return actionSubY(d.rootCode);})
				.attr("onclick", function(d) {
					return "javascript:alert('External click on " + d.rootCode + "')";
				})
				.on("mouseover", function(d) {
					$("#" + d.rootCode + "SubBar").css("fill", "brown");
					
				})
				.on("mouseout", function(d) {
					$("#" + d.rootCode + "SubBar").css("fill", "steelblue");
				});

			d3.select(this).append("rect")
				.attr("id", function(d) {return d.rootCode + "SubBar";}).attr("class", "bar")
				.attr("x", 0).attr("height", actionSubY.bandwidth()).attr("y", function(d) {return actionSubY(d.rootCode);})
				.attr("width", function(d) {return actionSubX(d.count);})
				.attr("onclick", function (d) {
					return "javascript:alert('Click on " + d.rootCode + "')";
				})
				.on("mouseover", function(d) {
					$("#" + d.rootCode + "SubBar").css("fill", "brown");
				})
				.on("mouseout", function(d) {
					$("#" + d.rootCode + "SubBar").css("fill", "steelblue");
				});

			d3.select(this).append("text")
				.attr("class", "bar_label").attr("x", function(d) {return actionSubX(d.count) + 5;})
				.attr("y", function(d) {return actionSubY(d.rootCode) + actionSubY.bandwidth() / 2 + 4;})
				.text(function(d) {return "" + d.count;})
				.on("mouseover", function(d) {
					$("#" + d.rootCount + "SubBar").css("fill", "brown");
				})
				.on("mouseout", function(d) {
					$("#" + d.rootCount + "SubBar").css("fill", "steelblue");
				});
		})
		.merge(actionSubGraphData);*/
}
