
/**
 * Variables declared for location
 *
 **/
var mapGraphSVG = new Object();
var mapSubGraphIdCname = new Object();
var mapListCountriesSelected = new Object();

function resetLocationVariables() {
    mapGraphSVG = new Object();
    mapSubGraphIdCname = new Object();
    mapListCountriesSelected = new Object();
}


/**
 * Draw the main graph for Location
 *
 **/

function d3loc() {
    // Clear existing data and plots

    $("#country_list").append("");


    var svg = d3.select("#main_graph_td_div").append("svg:svg")
        .attr("width", 450)
        .attr("height", 350)
        .attr("background-color", "#ADADAD")
        .attr("id", "main_graph_svg");

    mapGraphSVG["main_graph"] = svg;

    render(false, 0);
}

/**
 * render to render/draw the main/sub graph with the data provided in form of array of Objects
 * with the links to create the sub-graph based on the data
 *
 **/
var arr_location_region_data = [];
var map_location_rid_rname = new Map();
var map_location_lookup = new Map();

function render(blnIsSubgraph, cid) {

    // console.log(cid);

    if(!blnIsSubgraph) {		//this is the main graph

        console.log("Rendering Main Graph...");

        var maxDomainX = 1;
        var svg = d3.select("#main_graph_svg");
        var margin = {top: 5, right: 20, bottom: 5, left: 120},
            width = +svg.attr("width") - margin.left - margin.right,
            height = +svg.attr("height") - margin.top - margin.bottom;

        var x = d3.scaleLinear().range([0, width]);
        var y = d3.scaleBand().range([height, 0]);

        svg.append("defs").append("pattern")
            .attr("id", "pattern1")
            .attr("x", "10")
            .attr("y", "10")
            .attr("width", y.bandwidth() / 20)
            .attr("height", y.bandwidth() / 20)
            .attr("patternUnits", "userSpaceOnUse")
            .append("line")
            .attr("x1", "0")
            .attr("y1", "0")
            .attr("x2", y.bandwidth() / 20)
            .attr("y2", y.bandwidth() / 20)
            .attr("style", "stroke:brown;stroke-width:5;");


        d3.csv("data/locationlookup.csv", function (data) {
            // Clear existing region data to redraw with new subsetted data
            arr_location_region_data = [];
            map_location_rid_rname = new Map();
            resetLocationVariables();
            let map_fullname_lookup = new Map();

            data.forEach(function (d) {
                map_location_lookup.set(d.cname, d.rname);
                map_location_lookup.set(d.fullcname, d.rname);

                map_fullname_lookup.set(d.cname, d.fullcname);
            });

            var rid = -1;
            let cid = 1;
            for (let key in countryData) {

                var region = "Other";
                if (map_location_lookup.has(key)) {
                    region = map_location_lookup.get(key);
                }

                let fullname = key;
                if (map_fullname_lookup.has(key)) {
                    fullname = map_fullname_lookup.get(key);
                }

                let country = {
                    'id': "" + cid++,
                    'cname': key,
                    'freq': "" + countryData[key],
                    'fullcname': map_fullname_lookup.get(key)
                };

                if (!map_location_rid_rname.has(region)) {

                    rid++;
                    var arr_countries = [];
                    arr_countries.push(country);

                    var arr_country_names = [];
                    arr_country_names.push(country.cname);

                    var rdata = new Object();
                    rdata.rid = rid;
                    rdata.rname = region;
                    rdata.freq = parseInt(country.freq);
                    rdata.maxCFreq = parseInt(country.freq);
                    rdata.countries = arr_countries;
                    rdata.country_names = arr_country_names;

                    arr_location_region_data[rid] = rdata;

                    map_location_rid_rname.set(region, "" + rid);
                    map_location_rid_rname.set("" + rid, region);

                }
                else {

                    var currrid = map_location_rid_rname.get(region);
                    var rdata = arr_location_region_data[currrid];
                    var freq = rdata.freq + parseInt(country.freq);
                    rdata.freq = freq;
                    rdata.countries.push(country);
                    rdata.country_names.push(country.cname);

                    var cFreq = parseInt(country.freq);
                    if (cFreq > rdata.maxCFreq) {
                        rdata.maxCFreq = cFreq;
                    }

                    arr_location_region_data[currrid] = rdata;

                    if (freq > maxDomainX) {
                        maxDomainX = freq;
                    }
                }
            }

            x.domain([0, maxDomainX]);
            y.domain(arr_location_region_data.map(function(d) {
				//~ console.log(d);
				return d.rname;})).padding(0.2);		//this controls the padding

            var g = svg.append("g")		//this draws the x axis ticks
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            g.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x).ticks(5).tickFormat(function (d) {
                    return parseInt(d);
                }).tickSizeInner([-height]));

            g.append("g")
                .attr("id", "y_axis_main")
                .attr("class", "y axis")
                .call(d3.axisLeft(y));


            g.selectAll(".bar")			//these are the bars themselves
                .data(arr_location_region_data)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", 0)
                .attr("height", y.bandwidth())
                .attr("y", function (d) {
                    return y(d.rname);
                })
                .attr("width", function (d) {
                    return x(d.freq);
                })
                .attr("onclick", function (d) {
                    mapGraphSVG[d.rid] = null;
                    return "javascript:constructSubgraph('" + d.rid + "')";
                })
                .attr("id", function (d) {
                    return "tg_rect_" + d.rid;
                });

            g.selectAll(".bar_click")	//these are the empty space following the bars
                .data(arr_location_region_data)
                .enter()
                .append("rect")
                .attr("class", "bar_click")
                .attr("height", y.bandwidth())
                .attr("width", function (d) {
                    return width - x(d.freq);
                })
                .attr("x", function (d) {
                    return x(d.freq);
                })
                .attr("y", function (d) {
                    return y(d.rname);
                })
                .attr("onclick", function (d) {
                    return "javascript:constructSubgraph('" + d.rid + "')";
                });

            g.selectAll(".bar_label")	//these are the labels for the bars
                .data(arr_location_region_data)
                .enter()
                .append("text")
                .attr("class", "bar_label")
                .attr("x", function (d) {
                    return x(d.freq) + 5;
                })
                .attr("y", function (d) {
                    return y(d.rname) + y.bandwidth() / 2 + 4;
                })
                .text(function (d) {
                    return "" + d.freq;
                });

            // g.append("text")			//this is the y axis label
            //     .attr("text-anchor", "middle")
            //     .attr("transform", "translate(" + (-115) + "," + (height / 2) + ")rotate(-90)")
            //     .attr("class", "graph_axis_label")
            //     .text("Region");

            g.append("text")			//this is the x axis label
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + (width / 2) + "," + (height + 30) + ")")
                .text("Frequency");

        });
    }
    else {						//this is a sub graph

        // console.log("Rendering Sub Graph...");

        var MAX_HEIGHT = 35;
        var arr_countries = arr_location_region_data[cid].countries;
        var maxDomainX = arr_location_region_data[cid].maxCFreq;

        var svg = d3.select("#sub_graph_td_svg_" + cid);

        var margin = {top: 20, right: 30, bottom: 30, left: 80},
            width = +svg.attr("width") - margin.left - margin.right,
            height = +svg.attr("height") - margin.top - margin.bottom;

        var x = d3.scaleLinear().range([0, width]);
        var y = d3.scaleBand().range([height, 0]);

        // console.log(maxDomainX);

        x.domain([0, maxDomainX]);
        y.domain(arr_countries.map(function (d) {
            return d.cname;
        })).padding(0.1);

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


        g.selectAll(".bar")
            .data(arr_countries)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("height", d3.min([y.bandwidth(), MAX_HEIGHT]))
            .attr("y", function (d) {
                mapSubGraphIdCname[d.cname] = cid + "_" + d.id;
                if (mapListCountriesSelected[d.cname] == null) {
                    mapListCountriesSelected[d.cname] = false;
                }
                return y(d.cname) + (y.bandwidth() - d3.min([y.bandwidth(), MAX_HEIGHT])) / 2;
            })
            .attr("width", function (d) {
                return x(d.freq);
            })
            .attr("onclick", function (d) {
                return "javascript:subgraphYLabelClicked('" + d.cname + "')";
            })
            .attr("id", function (d) {
                return "tg_rect_" + cid + "_" + d.id;
            })
            .append("svg:title")
            .text(function (d) {
                return d.fullcname;
            });

        g.selectAll(".bar_click")
            .data(arr_countries)
            .enter()
            .append("rect")
            .attr("class", "bar_click")
            .attr("height", d3.min([y.bandwidth(), MAX_HEIGHT]))
            .attr("width", function (d) {
                return width - x(d.freq);
            })
            .attr("x", function (d) {
                return x(d.freq);
            })
            .attr("y", function (d) {
                return y(d.cname) + (y.bandwidth() - d3.min([y.bandwidth(), MAX_HEIGHT])) / 2;
            })
            .attr("onclick", function (d) {
                return "javascript:subgraphYLabelClicked('" + d.cname + "')";
            });

        g.selectAll(".bar_label")
            .data(arr_countries)
            .enter()
            .append("text")
            .attr("class", "bar_label")
            .attr("x", function (d) {
                return x(d.freq) + 5;
            })
            .attr("y", function (d) {
                return y(d.cname) + y.bandwidth() / 2 + 4;
            })
            .text(function (d) {
                return "" + d.freq;
            });

        g.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + (-50) + "," + (height / 2) + ")rotate(-90)")
            .attr("class", "graph_axis_label")
            .text("Sub-Region of " + map_location_rid_rname.get(cid));

        g.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + (width / 2) + "," + (height + 30) + ")")
            .attr("class", "graph_axis_label")
            .text("Frequency");

    }

}

/**
 * constructSubgraph by the rname or id of the main graph
 * and do the rendering of the sub graph
 *
 **/
function constructSubgraph(cid) {

    // console.log("constructSubgraph for cid : " + cid);

    if (mapGraphSVG[cid] != null) {

        subgraphAction('expand_collapse_text_' + cid);

        return;
    }

    if (mapGraphSVG[cid + "_removed"] != null) {

        mapGraphSVG[cid] = mapGraphSVG[cid + "_removed"];
        mapGraphSVG[cid + "_removed"] = null;

        $("#sub_graph_td_" + cid).parent().show();
        $("#sub_graph_td_" + cid).removeClass('graph_close');
        $("#sub_graph_td_" + cid).addClass('graph_config');

        return;
    }

    $("#sub_graph_td_div").append('<tr id="sub_graph_tr_' + cid + '"><td id="sub_graph_td_' + cid + '" class="graph_config"></td></tr>');
    subGraphLabel(cid);

    var svg = d3.select("#sub_graph_td_" + cid).append("svg:svg")
        .attr("width", 480)
        .attr("height", 350)
        .attr("id", "sub_graph_td_svg_" + cid);

    mapGraphSVG[cid] = svg;
    render(true, cid);
}

/**
 * maingraphAction -> to map the header function {All, None, Expand/Collapse} for the main graph
 *
 **/
function maingraphAction(action) {

    if (action == 'Expand_Collapse') {

        action = $('#Expand_Collapse_Main_Text').text();
    }

    if (action == 'All') {

        for (var cid in mapGraphSVG) {

            if (cid.indexOf("_removed") > -1) {
                continue;
            }

            if (mapGraphSVG[cid] == null) {
                console.log("SVG CREATE = " + cid);
                constructSubgraph(cid);
            }
            else if (mapGraphSVG[cid + "_removed"] == null) {

                console.log("SVG SHOW = " + cid);
                $("#sub_graph_td_" + cid).parent().show();
                $("#sub_graph_td_" + cid).removeClass('graph_close');
                $("#sub_graph_td_" + cid).addClass('graph_config');
            }
            else if (mapGraphSVG[cid] != null) {

                console.log("SVG NO_ACTION = " + cid);
            }
        }

    }
    else if (action == 'None') {

        removeAllSubGraphSVG();
    }
    else if (action == 'Collapse') {

        $("#Expand_Collapse_Main_Text").text("Expand");

        $("#Exp_Col_Icon").removeClass("glyphicon-resize-small");
        $("#Exp_Col_Icon").addClass("glyphicon-resize-full");


        $("#main_graph_td_div").removeClass('graph_config');
        $("#main_graph_td_div").addClass('graph_collapse');
    }
    else if (action == 'Expand') {

        $("#Expand_Collapse_Main_Text").text("Collapse");

        $("#Exp_Col_Icon").removeClass("glyphicon-resize-full");
        $("#Exp_Col_Icon").addClass("glyphicon-resize-small");

        $("#main_graph_td_div").removeClass('graph_collapse');
        $("#main_graph_td_div").addClass('graph_config');
    }
}

/**
 * countryTableAction -> to map the header function {All, None, Expand/Collapse} for the countryTable
 *
 **/
function countryTableAction(action) {

    if (action == 'Expand_Collapse') {

        action = $('#Expand_Collapse_Country_Text').text();
    }

    if (action == 'Collapse') {

        $("#Expand_Collapse_Country_Text").text("Expand");

        $("#Exp_Col_Country_Icon").removeClass("glyphicon-resize-small");
        $("#Exp_Col_Country_Icon").addClass("glyphicon-resize-full");


        $("#country_list").removeClass('country_table_config');
        $("#country_list").addClass('country_table_collapse');
    }
    else if (action == 'Expand') {

        $("#Expand_Collapse_Country_Text").text("Collapse");

        $("#Exp_Col_Country_Icon").removeClass("glyphicon-resize-full");
        $("#Exp_Col_Country_Icon").addClass("glyphicon-resize-small");

        $("#country_list").removeClass('country_table_collapse');
        $("#country_list").addClass('country_table_config');
    }
}

/**
 * subgraphAction-> to map the subgraph function {All, None, Expand/Collapse}
 *
 **/
function subgraphAction(textId) {


    if (textId.indexOf("expand_collapse_text_") != -1) {

        var action = $("#" + textId).text();

        if (action == 'Collapse') {

            var cid = textId.substring(21);

            $("#" + textId).text("Expand");

            $("#Exp_Col_Icon_" + cid).removeClass("glyphicon-resize-small");
            $("#Exp_Col_Icon_" + cid).addClass("glyphicon-resize-full");

            $("#sub_graph_td_" + cid).removeClass('graph_config');
            $("#sub_graph_td_" + cid).addClass('graph_collapse');

        }
        else if (action == 'Expand') {

            var cid = textId.substring(21);

            $("#" + textId).text("Collapse");

            $("#Exp_Col_Icon_" + cid).removeClass("glyphicon-resize-full");
            $("#Exp_Col_Icon_" + cid).addClass("glyphicon-resize-small");

            $("#sub_graph_td_" + cid).removeClass('graph_collapse');
            $("#sub_graph_td_" + cid).addClass('graph_config');
        }
    }
    else {

        var actionData = textId.split("_");
        var action = actionData[0];
        var cid = actionData[1];

        var listCname = arr_location_region_data[cid].country_names;
        var bool = true;
        if (action == 'All') {
            bool = true;
        }
        else if (action == 'None') {
            bool = false;
        }

        for (var index in listCname) {
            var cname = listCname[index];
            mapListCountriesSelected[cname] = bool;
        }

        updateCountryList();
    }
}


/**
 * removeAllSubGraphSVG - to remove all the subgraph when clicked on "None" in the main graph
 *
 **/
function removeAllSubGraphSVG() {

    for (var cid in mapGraphSVG) {

        if (cid.indexOf("_removed") > -1) {
            continue;
        }

        if (cid != null && mapGraphSVG[cid] != null) {

            var svgToRemove = mapGraphSVG[cid];
            mapGraphSVG[cid + "_removed"] = svgToRemove;
            mapGraphSVG[cid] = null;

            $("#sub_graph_td_" + cid).removeClass('graph_config');
            $("#sub_graph_td_" + cid).addClass('graph_close');
            $("#sub_graph_td_" + cid).parent().hide();
        }
    }
}

function subgraphYLabelClicked(cname) {

    var bool = mapListCountriesSelected[cname];

    if (bool == true) {
        mapListCountriesSelected[cname] = false;
    }
    else {
        mapListCountriesSelected[cname] = true;
    }

    updateCountryList();
}

/**
 * subGraphLabel - to put the header Labels in the sub graph
 *
 **/
function subGraphLabel(cid) {

    $("#sub_graph_td_" + cid).append('<div id="sub_graph_td_div_' + cid + '"></div>');

    var cname = map_location_rid_rname.get(cid);
    var label1 = $('<label align="right">' + cname + ':</label>');
    $("#sub_graph_td_div_" + cid).append(label1);
    $("#sub_graph_td_div_" + cid).append("&nbsp;&nbsp;&nbsp;");

    var label11 = $('<label title="Select All"  onclick = "javascript:subgraphAction(\'All_' + cid + '\')"><span class="glyphicon btn btn-default"><label style="cursor:pointer; text-align:center; width:60px;" align="right">All</label></span></label>');
    var label12 = $('<label title="Remove All"  onclick = "javascript:subgraphAction(\'None_' + cid + '\')"><span class="glyphicon btn btn-default"><label style="cursor:pointer; text-align:center; width:60px;" align="right">None</label></span></label>');
    $("#sub_graph_td_div_" + cid).append(label11);
    $("#sub_graph_td_div_" + cid).append("&nbsp; &nbsp; &nbsp;");
    $("#sub_graph_td_div_" + cid).append(label12);
    $("#sub_graph_td_div_" + cid).append("&nbsp; &nbsp; &nbsp;");


    var label2 = $('<label style="cursor:pointer" onclick="javascript:subgraphAction(\'expand_collapse_text_' + cid + '\')"><span class="glyphicon glyphicon-resize-small btn btn-default" id="Exp_Col_Icon_' + cid + '"></span></label>');
    $("#sub_graph_td_div_" + cid).append(label2);

    var label = $('<label class="hide_label" id="expand_collapse_text_' + cid + '">Collapse</label>');
    $("#sub_graph_td_div_" + cid).append(label);
}

function updateCountryList() {

    var td_id = 'country_list_tab';
    $("#" + td_id).empty();

    var mapLocalMainGraphIdWithSubGraphCnameList = new Object();

    for (var country in mapListCountriesSelected) {

        var bool = mapListCountriesSelected[country];
        var main_subGraphId = mapSubGraphIdCname[country];

        var arrIds = main_subGraphId.split("_");
        var mainGraphId = arrIds[0];

        if (mapLocalMainGraphIdWithSubGraphCnameList[mainGraphId] == null) {
            mapLocalMainGraphIdWithSubGraphCnameList[mainGraphId] = [];
        }

        if (bool == true) {
            $("#country_list_tab").append('<tr><td><label class="strike_through" style="float:left;cursor:pointer" onclick="javascript:removeFromCountryList(\'' + country + '\');">' + country + '</label></td></tr>');
            $("#tg_rect_" + main_subGraphId).attr("class", "bar_all_selected");
            mapLocalMainGraphIdWithSubGraphCnameList[mainGraphId].push(country);
        }
        else {
            $("#tg_rect_" + main_subGraphId).attr("class", "bar");
        }
    }

    for (var mainGraphCid in arr_location_region_data) {

        var originalLength = arr_location_region_data[mainGraphCid].country_names.length;
        var localLength = (mapLocalMainGraphIdWithSubGraphCnameList[mainGraphCid] == null ? 0 : mapLocalMainGraphIdWithSubGraphCnameList[mainGraphCid].length);

        if (localLength == 0) {
            $("#tg_rect_" + mainGraphCid).attr("class", "bar");
        }
        else if (localLength < originalLength) {
            $("#tg_rect_" + mainGraphCid).attr("class", "bar_some_selected");
        }
        else if (localLength == originalLength) {
            $("#tg_rect_" + mainGraphCid).attr("class", "bar_all_selected");
        }

    }
}

function removeFromCountryList(cname) {

    if (cname == 'reset_all') {

        for (var country in mapListCountriesSelected) {
            mapListCountriesSelected[country] = false;
        }
    }
    else {

        mapListCountriesSelected[cname] = false;
    }
    updateCountryList();

}
